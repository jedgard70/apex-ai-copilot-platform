import { generateImage } from 'ai'
import fs from 'node:fs'
import 'dotenv/config'

async function main() {
  const result = await generateImage({
    model: 'black-forest-labs/flux-1.1-pro',
    prompt: 'A serene mountain landscape at sunset with a calm lake reflection',
    size: '1024x1024'
  })
  const imageData = result.images && result.images[0]
  if (!imageData || !imageData.base64) {
    console.error('No image returned')
    process.exit(1)
  }
  fs.writeFileSync('output.png', Buffer.from(imageData.base64, 'base64'))
  console.log('Image saved to output.png')
}

main().catch(err => { console.error(err); process.exit(1) })
