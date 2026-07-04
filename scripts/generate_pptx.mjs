import PptxGenJS from 'pptxgenjs'
import { readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

async function gerarPPTX(caminhoJson) {
  try {
    const caminhoCompleto = resolve(rootDir, caminhoJson)
    const dadosRaw = readFileSync(caminhoCompleto, 'utf8')
    const dados = JSON.parse(dadosRaw)

    const pres = new PptxGenJS()
    pres.layout = 'LAYOUT_16x9'

    // Define Master Slide
    pres.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: 'FFFFFF' },
      objects: [
        { rect: { x: 0, y: 0, w: '100%', h: 0.75, fill: { color: '0f172a' } } },
        { text: { text: 'Apex AI Copilot - Engenharia', options: { x: 0.5, y: 0.1, w: '50%', h: 0.5, color: 'FFFFFF', fontSize: 14, bold: true } } }
      ]
    })

    // Capa
    const slideCapa = pres.addSlide('MASTER_SLIDE')
    slideCapa.addText(dados.titulo_apresentacao || 'Resumo Técnico', {
      x: 1, y: 2.5, w: 8, h: 1.5,
      fontSize: 36, bold: true, color: '0f172a', align: 'center'
    })
    slideCapa.addText('Gerado automaticamente pela Inteligência Artificial', {
      x: 1, y: 4, w: 8, h: 0.5,
      fontSize: 16, color: '64748b', align: 'center'
    })

    // Slides
    if (Array.isArray(dados.slides)) {
      dados.slides.forEach(slideInfo => {
        const slide = pres.addSlide('MASTER_SLIDE')
        
        slide.addText(slideInfo.titulo || 'Sem Título', {
          x: 0.5, y: 1.0, w: 9, h: 0.8,
          fontSize: 24, bold: true, color: '0f172a'
        })

        if (Array.isArray(slideInfo.topicos)) {
          const formatoTopicos = slideInfo.topicos.map(t => ({ text: t, options: { bullet: true } }))
          slide.addText(formatoTopicos, {
            x: 0.5, y: 2.0, w: 8.5, h: 3,
            fontSize: 18, color: '334155', lineSpacing: 28
          })
        }
      })
    }

    const nomeSaida = `Resumo_${Date.now()}.pptx`
    const caminhoSaida = join(rootDir, nomeSaida)
    
    await pres.writeFile({ fileName: caminhoSaida })
    console.log(`✅ Apresentação gerada com sucesso em: ${nomeSaida}`)

  } catch (err) {
    console.error('❌ Erro ao gerar PPTX:', err.message)
    process.exit(1)
  }
}

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error("Uso: node generate_pptx.mjs <caminho_do_json>")
  process.exit(1)
}

gerarPPTX(args[0])
