import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Configurações
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAW_DATA_DIR = path.join(__dirname, '../docs/raw_data') // Pasta com seus PDFs/Textos
const OUTPUT_FILE = path.join(__dirname, '../dataset_engenharia.jsonl')
const API_KEY = process.env.GEMINI_API_KEY || '' // Use a chave do Gemini para acelerar a extração

/**
 * Função para chamar a API e pedir que ela extraia pares de Pergunta/Resposta de um texto bruto.
 */
async function extrairParesComIA(textoBruto, nomeArquivo) {
  if (!API_KEY) {
    console.warn('GEMINI_API_KEY não configurada. Simulando extração estruturada...')
    return [
      {
        messages: [
          { role: 'user', content: `Analise os dados do documento ${nomeArquivo} e extraia o ponto principal.` },
          { role: 'model', content: `O ponto principal identificado no arquivo ${nomeArquivo} é a especificação técnica dos materiais.` }
        ]
      }
    ]
  }

  const prompt = `
Você é um Engenheiro de Dados.
Analise o seguinte texto bruto extraído de um documento da construtora (relatório, norma, RDO ou orçamento).
Crie de 3 a 5 exemplos práticos de interações em formato de chat, onde o 'user' faz uma pergunta técnica e o 'model' responde de forma precisa com base no texto.
Devolva APENAS um array JSON válido, sem formatação markdown ou crases.

Formato exigido:
[
  { "messages": [{ "role": "user", "content": "..." }, { "role": "model", "content": "..." }] }
]

TEXTO BRUTO:
${textoBruto.substring(0, 5000)}
`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    })

    const data = await response.json()
    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    
    // Limpa a string JSON se a IA enviou com markdown
    const jsonLimpo = respostaIA.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(jsonLimpo)
  } catch (error) {
    console.error(`Erro ao processar ${nomeArquivo} com a IA:`, error.message)
    return []
  }
}

async function gerarDataset() {
  console.log('🏗️ Iniciando a Máquina de Geração de Dataset para Fine-Tuning do Gemma...')
  
  // Cria a pasta de dados brutos se não existir
  await fs.mkdir(RAW_DATA_DIR, { recursive: true })
  
  try {
    const arquivos = await fs.readdir(RAW_DATA_DIR)
    if (arquivos.length === 0) {
      console.log(`⚠️ A pasta ${RAW_DATA_DIR} está vazia. Coloque alguns arquivos de texto (.txt) lá para testar.`)
      // Criando um arquivo de teste rápido
      await fs.writeFile(path.join(RAW_DATA_DIR, 'exemplo_rdo.txt'), 'Relatório de Obra Diário. Data: 03/07/2026. Clima: Chuvoso. Atividades: Concretagem das sapatas suspensa devido à chuva. Material recebido: 50 sacos de cimento Votorantim.')
      arquivos.push('exemplo_rdo.txt')
    }

    // Limpa ou cria o arquivo de saída
    await fs.writeFile(OUTPUT_FILE, '')
    let contadorTotal = 0

    for (const arquivo of arquivos) {
      const caminhoCompleto = path.join(RAW_DATA_DIR, arquivo)
      const estatisticas = await fs.stat(caminhoCompleto)
      
      if (estatisticas.isFile()) {
        console.log(`\n📄 Processando documento: ${arquivo}`)
        const textoBruto = await fs.readFile(caminhoCompleto, 'utf8')
        
        const pares = await extrairParesComIA(textoBruto, arquivo)
        
        for (const par of pares) {
          // Salva cada linha no formato JSONL (JSON Lines) exigido pelo Unsloth
          await fs.appendFile(OUTPUT_FILE, JSON.stringify(par) + '\n')
          contadorTotal++
        }
        console.log(`✅ ${pares.length} pares extraídos de ${arquivo}`)
      }
    }

    console.log(`\n🎉 Dataset gerado com sucesso!`)
    console.log(`Foram gerados ${contadorTotal} exemplos de treinamento salvos em:`)
    console.log(`👉 ${OUTPUT_FILE}`)
    console.log(`\nAgora você pode pegar esse arquivo .jsonl e jogar direto no Colab (Célula 3)!`)

  } catch (erro) {
    console.error('Erro fatal:', erro)
  }
}

gerarDataset()
