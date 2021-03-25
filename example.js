const express = require('express')
const test = require("./index.js")
const app = express()

const data = test.createMiddleware({
  metricPrefix: "test"
})
app.use(data)
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3001)