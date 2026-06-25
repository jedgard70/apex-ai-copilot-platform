import { streamText } from 'ai'

// Simple Gemini streaming example
const result = streamText({
  model: 'google/gemini-2.5-flash',
  prompt: 'Explain quantum computing in simple terms.',
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
