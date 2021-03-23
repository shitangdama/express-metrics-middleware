import express from 'express'
import { createMiddleware } from "./index.js"
const app = express()

const data = createMiddleware(app, {
  metricPrefix: "test"
})
app.use(data)
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3001)