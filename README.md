# express-metrics
express middleware with standard prometheus metrics.

# install
npm i express-metrics-middleware

# use mothed
import { createMiddleware } from "express-metrics-middleware"

app.use(createMiddleware({
    metricPrefix: "test"
}));