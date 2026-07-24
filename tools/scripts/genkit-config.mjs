import { gemini25FlashPreview0417, googleAI } from '@genkit-ai/googleai'
import { genkit } from 'genkit'

const ai = genkit({
  plugins: [googleAI()],
  model: gemini25FlashPreview0417,
})

export function initGenkit() {
  return { ai, ready: true }
}

export async function genkitGenerate(prompt, options = {}) {
  const { text } = await ai.generate(prompt, options)
  return text
}

export async function genkitStream(prompt, callback) {
  const { stream } = await ai.generateStream(prompt)
  for await (const chunk of stream) {
    if (callback) callback(chunk.text)
  }
}
