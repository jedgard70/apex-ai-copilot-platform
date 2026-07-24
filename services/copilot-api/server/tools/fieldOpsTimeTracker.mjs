import fs from 'node:fs'
import path from 'node:path'

const DATA_FILE = path.join(process.cwd(), 'local-worker', 'data', 'diario_de_obras.json')

function initDataFile() {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: [], rates: {} }, null, 2))
  }
}

export function setWorkerRate(worker, dailyRate) {
  initDataFile()
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    if (!data.rates) data.rates = {}
    data.rates[worker] = parseFloat(dailyRate)
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
    return { ok: true, message: `Diária do ${worker} definida para R$ ${dailyRate}` }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function logWorkerEvent(worker, dateStr, eventDescription) {
  initDataFile()
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    data.entries.push({
      id: Date.now().toString(),
      worker,
      date: dateStr, // e.g. "2026-06-26"
      timestamp: new Date().toISOString(),
      event: eventDescription
    })
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
    return { ok: true, message: `Anotado: ${worker} - ${eventDescription}` }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function getWeeklyWorkerSummary() {
  initDataFile()
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    // Para simplificar, pegaremos as entradas dos últimos 7 dias.
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentEntries = data.entries.filter(e => {
      const entryDate = new Date(e.timestamp)
      return entryDate >= sevenDaysAgo
    })
    
    if (recentEntries.length === 0) {
      return "Nenhum registro de ponto ou evento nos últimos 7 dias."
    }

    const byWorker = {}
    for (const entry of recentEntries) {
      if (!byWorker[entry.worker]) byWorker[entry.worker] = []
      byWorker[entry.worker].push(`[${entry.date}] ${entry.event}`)
    }

    let report = "### 📋 Resumo da Semana no Canteiro de Obras\n\n"
    for (const [worker, events] of Object.entries(byWorker)) {
      const dailyRate = data.rates && data.rates[worker] ? data.rates[worker] : "Não definida"
      report += `#### ${worker} (Diária Base: R$ ${dailyRate})\n`
      for (const ev of events) {
        report += `- ${ev}\n`
      }
      report += "\n"
    }
    
    return report
  } catch (err) {
    return `Erro ao gerar relatório semanal: ${err.message}`
  }
}
