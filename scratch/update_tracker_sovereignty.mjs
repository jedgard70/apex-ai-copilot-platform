import fs from 'fs'

const envPath = 'd:/AI-constr/apex-ai-copilot-platform/CHECKPOINT_TRACKER.md'
let content = fs.readFileSync(envPath, 'utf-8')

const newSovereigntyAction = `
6. **Soberania Tecnológica (O Endgame):** Fine-Tuning de modelo Open-Source (Gemma 3 / Llama) no Google Vertex AI utilizando o histórico de conversas do Supabase. Exportar os pesos do modelo (\`.safetensors\`) e integrá-lo offline ao \`Local Worker\` via Ollama, garantindo inteligência proprietária rodando 100% offline e sem custos de API na máquina do usuário.
`

if (!content.includes('Soberania Tecnológica')) {
  content = content + newSovereigntyAction
  fs.writeFileSync(envPath, content)
}
console.log('Added Sovereignty Strategy to Tracker')
