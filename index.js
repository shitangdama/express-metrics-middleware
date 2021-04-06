const UrlValueParser = require('url-value-parser');
const url = require('url');
const client = require('prom-client');
const merge = require('merge-options');

const urlValueParser = new UrlValueParser();

const normalizePath = (path) => urlValueParser.replacePathValues(url.parse(path).pathname);
const normalizeMethod = (method) => method.toLowerCase();
const normalizeStatusCode = (statusCode) => statusCode;
const extractPath = (req) => req.originalUrl || req.url;
// const merge = (a, b) => Object.assign({}, a, b);
const isSkipPath = (arr, str) => arr?arr.some(item=> item===str):false
const defaultLabels = ['path', 'status_code', 'method'];
const defaultDurationPercentile = [0.5, 0.9, 0.95, 0.98, 0.99];
const defaultRequestDuration = [0.05,0.1,0.3,0.5,0.8,1,1.5,2,3,10];
const defaultNormalizers = {
  normalizeStatusCode,
  normalizePath,
  normalizeMethod,
};

const signalIsNotUp = () => {if(metrics["up"]) metrics["up"].set(0)}
const signalIsUp = () => {if(metrics["up"]) metrics["up"].set(1)}

// function normalizeStatusCode(status) {
//   if (status >= 200 && status < 300) {
//     return '2XX';
//   }

//   if (status >= 300 && status < 400) {
//     return '3XX';
//   }

//   if (status >= 400 && status < 500) {
//     return '4XX';
//   }

//   return '5XX';
// }

const metrics = {}

const defaultOptions = {
  labels: [],
  metricPrefix: '',
  metricTypes: 'histogram', // summary
  metricNames: {
    httpRequestsTotal: 'http_requests_total',
    httpRequestDurationPerPercentile: 'http_request_duration_per_percentile_seconds',
    httpRequestDuration: 'http_request_duration_seconds',
  },
  skipPath: [],
}

const createMetric = (options) => {
  metrics["up"] = new client.Gauge({
    name: `${options.metricPrefix}up`,
    help: '1 = up, 0 = not up',
  })

  if (options.metricTypes === 'summary') {
    metrics["httpRequestDuration"] = new client.Summary({
      name: `${options.metricPrefix}http_request_duration_per_percentile_seconds`,
      help: 'The HTTP request latencies in seconds.',
      labelNames: defaultLabels.concat(options.labels).sort(),
      percentiles: options.percentiles || defaultDurationPercentile,
    })
  } else if (options.metricTypes === 'histogram') {
    metrics["httpRequestDuration"] = new client.Histogram({
      name: `${options.metricPrefix}http_request_duration_seconds`,
      help: 'The HTTP request latencies in seconds.',
      labelNames: defaultLabels.concat(options.labels).sort(),
      buckets: options.buckets || defaultRequestDuration,
    })
  } else {
    throw new Error('metricType option must be histogram or summary');
  }

  metrics["httpRequestsTotal"] = new client.Counter({
    name: `${options.metricPrefix}http_requests_total`,
    help: 'The total HTTP requests.',
    labelNames: defaultLabels.concat(options.labels).sort(),
  })
}

const createMiddleware = (options) => {

  client.collectDefaultMetrics({ prefix: options.metricPrefix });

  let allOptions = merge(        
    defaultOptions,
    defaultNormalizers,
    options,
  )

  createMetric(allOptions);

  const middleware = (request, response, next) => {
    if (extractPath(request).match("/metrics")) {
      return metricsMiddleware(request, response, next);
    }
  
    if (isSkipPath(allOptions.skipPath, request.path)) {
        return next()
    }

    const end = metrics["httpRequestDuration"].startTimer()
    response.on('finish', () => {
      const labels = Object.assign(
        {},
        {
          method: allOptions.normalizeMethod(request.method, {
            req: request,
            res: response,
          }),
          status_code: allOptions.normalizeStatusCode(
            response.statusCode,
            { req: request, res: response }
          ),
          path: allOptions.normalizePath(extractPath(request), {
            req: request,
            res: response,
          }),
        },
      );

      end(labels)
      metrics["httpRequestsTotal"].inc(labels, 1)
    })

    return next();
  }

  return middleware
}

const metricsMiddleware = function(request, response, next) {
  const sendSuccesss = (output) => {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(output);
  };

  client.register.metrics().then(output => sendSuccesss(output)).catch(err => next(err));
};

exports.createMiddleware = createMiddleware;
exports.signalIsNotUp = signalIsNotUp;
exports.signalIsUp = signalIsUp;
