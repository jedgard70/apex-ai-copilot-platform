import fs from 'fs'

const envPath = 'd:/AI-constr/apex-ai-copilot-platform/docs/APEX_PLATFORM_CURRENT_STATE.md'
let content = fs.readFileSync(envPath, 'utf-8')

const newRoadmapSection = `
## Roadmap Estratégico de Inteligência Artificial (Aprovado em 2026-06-26)

O desenvolvimento da inteligência da plataforma seguirá as seguintes fases para garantir personalidade, memória e soberania de dados:

1. **Matar o "Modo Robô" (Curto Prazo):** System Instructions rígidas e Few-Shot Prompting.
2. **Memória Conversacional (Curto Prazo):** Histórico via Supabase (RAG base).
3. **Busca Vetorial / RAG (Médio Prazo):** pgvector no Supabase para dados da empresa.
4. **Function Calling Autônomo (Médio Prazo):** Execução de ações reais no Supabase e Google Workspace.
5. **Soberania Tecnológica / O Endgame (Longo Prazo):** Fine-Tuning de modelo Open-Source (Gemma 3 / Llama) no Google Vertex AI usando o histórico real do Supabase. Exportação dos pesos (\`.safetensors\`) para o Local Worker (Ollama), garantindo inteligência proprietária, offline e sem custos de API na máquina final do usuário.
`

if (!content.includes('Roadmap Estratégico de Inteligência Artificial')) {
  // Insert before the Status dos Conectores section to keep it prominent
  content = content.replace('## Status dos Conectores', newRoadmapSection + '\n## Status dos Conectores')
  fs.writeFileSync(envPath, content)
}
console.log('Added Strategic Roadmap to APEX_PLATFORM_CURRENT_STATE.md')
