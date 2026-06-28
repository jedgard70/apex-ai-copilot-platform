import 'dotenv/config'
import { runTrendScout } from '../server/cron/trendScout.mjs'

runTrendScout().then(() => {
  console.log('Finalizado.')
})
