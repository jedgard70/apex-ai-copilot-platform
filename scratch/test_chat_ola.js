import http from 'node:http'

const payload = JSON.stringify({
  message: "OLA",
  language: "pt-BR",
  messages: [],
  clientMemory: {}
})

const options = {
  hostname: '127.0.0.1',
  port: 4177,
  path: '/api/copilot/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}

const req = http.request(options, (res) => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    console.log('STATUS:', res.statusCode)
    console.log('BODY:', body)
  })
})

req.on('error', (e) => {
  console.error('ERROR:', e.message)
})

req.write(payload)
req.end()
