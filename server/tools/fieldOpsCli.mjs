import { logWorkerEvent, getWeeklyWorkerSummary } from './fieldOpsTimeTracker.mjs'

const action = process.argv[2]

if (action === 'log') {
  const worker = process.argv[3]
  const eventDesc = process.argv[4]
  const dateStr = new Date().toISOString().split('T')[0] // local time equivalent roughly
  
  if (!worker || !eventDesc) {
    console.error('Usage: node fieldOpsCli.mjs log "Nome do Trabalhador" "Descrição do Evento"')
    process.exit(1)
  }
  
  const result = logWorkerEvent(worker, dateStr, eventDesc)
  console.log(JSON.stringify(result))
} else if (action === 'rate') {
  const worker = process.argv[3]
  const dailyRate = process.argv[4]
  
  if (!worker || !dailyRate) {
    console.error('Usage: node fieldOpsCli.mjs rate "Nome do Trabalhador" "220"')
    process.exit(1)
  }
  
  import('./fieldOpsTimeTracker.mjs').then(({ setWorkerRate }) => {
    const result = setWorkerRate(worker, dailyRate)
    console.log(JSON.stringify(result))
  })
} else if (action === 'report') {
  const report = getWeeklyWorkerSummary()
  console.log(report)
} else {
  console.error('Unknown action. Use "log" or "report".')
  process.exit(1)
}
