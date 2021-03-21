import express from 'express'
import  {createMiddleware} from "./index.js"
const app = express()
// var memwatch = require('@airbnb/node-memwatch');



// memwatch.on('gc', function(d) {
//     if (d.compacted) {
//       console.log('current base memory usage:', memwatch.stats().current_base);
//     }
//   });
const data = createMiddleware(app, {
  metricPrefix: "test"
})
app.use(data)
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3001)