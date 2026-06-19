import { streamText } from 'ai'

// Simple AI Gateway streaming example
const result = streamText({
  model: 'openai/gpt-5.2',
  prompt: 'Explain quantum computing in simple terms.',
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
