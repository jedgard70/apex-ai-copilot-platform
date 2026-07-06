const http = require('http')

const data = JSON.stringify({
  status: 'training',
  progress: 45,
  loss: 0.12,
  epoch: 1,
  message: 'Mock update'
})

const options = {
  hostname: '127.0.0.1',
  port: 3333,
  path: '/api/copilot/training-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)
  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.write(data)
req.end()
