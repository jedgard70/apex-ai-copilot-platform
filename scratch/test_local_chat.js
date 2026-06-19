import handler from '../api/copilot/chat.mjs'

// Mock request and response
const req = {
  method: 'POST',
  [Symbol.asyncIterator]: async function* () {
    const payload = JSON.stringify({
      message: "OLA",
      language: "pt-BR",
      messages: [],
      clientMemory: {}
    })
    yield Buffer.from(payload)
  }
}

const res = {
  statusCode: 200,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value
  },
  status(code) {
    this.statusCode = code
    return this
  },
  json(body) {
    this.end(JSON.stringify(body))
  },
  end(body) {
    console.log('RESPONSE STATUS:', this.statusCode)
    console.log('RESPONSE HEADERS:', this.headers)
    console.log('RESPONSE BODY:', body)
  }
}

// Set process.env to mimic Vercel production
process.env.OPENAI_API_BASEROUTER = 'https://openrouter.ai/api/v1'
process.env.OPENAI_API_KEYROUTER = 'sk-or-mock-router-key'
process.env.OPENAI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai'
process.env.OPENAI_API_KEY = 'AIzaSy-mock-gemini-key'

handler(req, res).catch(err => {
  console.error('Unhandled handler error:', err)
})
