import { experimental_generateVideo as generateVideo } from 'ai'
import fs from 'node:fs'
import 'dotenv/config'

async function main() {
  const result = await generateVideo({
    model: 'google/veo-3.1-generate-001',
    prompt: 'A serene mountain landscape at sunset with clouds drifting by',
    aspectRatio: '16:9',
    duration: 8
  })
  if (!result.videos || !result.videos[0]) {
    console.error('No video returned')
    process.exit(1)
  }
  fs.writeFileSync('output.mp4', result.videos[0].uint8Array)
  console.log('Video saved to output.mp4')
}

main().catch(err => { console.error(err); process.exit(1) })
