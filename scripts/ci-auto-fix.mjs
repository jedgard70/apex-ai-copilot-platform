import fs from 'node:fs'
import { execSync } from 'node:child_process'

const [, , command, logFile] = process.argv

if (!command || !logFile) {
  console.error("Uso: node scripts/ci-auto-fix.mjs \"<comando>\" <arquivo_de_log>")
  process.exit(1)
}

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error("Erro: GEMINI_API_KEY não configurada no ambiente.")
  process.exit(1)
}

// Extrai blocos JSON de um texto (útil para lidar com a formatação Markdown do Gemini)
function extractJson(text) {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (match) return JSON.parse(match[1])
    return JSON.parse(text)
  } catch (e) {
    console.error("Erro ao fazer parse do JSON retornado pela IA:", e.message)
    return null
  }
}

async function askGeminiToFix(errorLog) {
  console.log("🤖 Apex AI Auto-Fixer: Analisando o erro...")
  
  const systemInstruction = `Você é o Agente de Auto-Reparo CI da Apex AI.
Sua missão é analisar logs de erro de GitHub Actions (Node.js/Testes), identificar o arquivo causador, e fornecer exatamente a string original que deve ser substituída pela nova string corrigida.
Responda EXCLUSIVAMENTE em formato JSON, sem comentários adicionais.
Formato obrigatório:
{
  "fixes": [
    {
      "file": "caminho/do/arquivo",
      "search": "código exato com erro, incluindo espaços originais",
      "replace": "código corrigido"
    }
  ],
  "reason": "Explicação curta do que foi corrigido"
}`

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: `O comando '${command}' falhou com o seguinte log:\n\n${errorLog.slice(-4000)}` }] }],
    generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  return extractJson(responseText)
}

async function runAutoFix() {
  let attempts = 0
  const maxAttempts = 2
  let currentLog = fs.readFileSync(logFile, 'utf8')

  while (attempts < maxAttempts) {
    attempts++
    console.log(`\n🔄 Tentativa de Reparo ${attempts}/${maxAttempts}`)
    
    const suggestion = await askGeminiToFix(currentLog)
    if (!suggestion || !suggestion.fixes || suggestion.fixes.length === 0) {
      console.error("Nenhuma correção sugerida pela IA.")
      process.exit(1)
    }

    console.log(`💡 Solução proposta: ${suggestion.reason}`)
    
    for (const fix of suggestion.fixes) {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8')
        if (content.includes(fix.search)) {
          content = content.replace(fix.search, fix.replace)
          fs.writeFileSync(fix.file, content, 'utf8')
          console.log(`✅ Arquivo modificado: ${fix.file}`)
        } else {
          console.log(`⚠️ String de busca não encontrada em: ${fix.file}`)
          console.log(`Buscava por: ${fix.search}`)
        }
      } else {
        console.log(`⚠️ Arquivo não encontrado: ${fix.file}`)
      }
    }

    console.log(`🧪 Re-testando comando: ${command}`)
    try {
      execSync(command, { stdio: 'inherit' })
      console.log("🎉 Teste passou! Auto-Reparo concluído com sucesso.")
      
      // Auto-commit and push
      try {
        console.log("📦 Fazendo commit e push do reparo...")
        execSync(`git config --global user.name "Apex AI Auto-Fixer"`)
        execSync(`git config --global user.email "bot@apexglobalai.com"`)
        execSync(`git add .`)
        execSync(`git commit -m "fix(auto-heal): correcao autonoma de falha de CI" -m "${suggestion.reason}"`)
        execSync(`git push origin HEAD`)
        console.log("🚀 Reparo enviado para produção!")
        process.exit(0)
      } catch (gitErr) {
        console.error("Erro ao fazer commit/push do reparo:", gitErr.message)
        process.exit(0) // Saímos com 0 pois o erro técnico foi resolvido
      }
    } catch (testErr) {
      console.log("❌ Teste falhou novamente após o reparo.")
      currentLog = testErr.stdout?.toString() || testErr.stderr?.toString() || testErr.message
    }
  }

  console.error("🚨 Limite de tentativas alcançado. Reparo falhou.")
  process.exit(1)
}

runAutoFix().catch(err => {
  console.error("Erro crítico no Auto-Fixer:", err)
  process.exit(1)
})
