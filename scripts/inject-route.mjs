import fs from 'node:fs'
import path from 'node:path'

const serverPath = path.resolve(process.cwd(), 'server.mjs')
let code = fs.readFileSync(serverPath, 'utf8')

const anchorOld = "if (req.url === '/api/copilot/training-webhook' && (req.method === 'GET' || req.method === 'POST')) {"
const anchorNew = "if (requestUrl.pathname === '/api/copilot/training-webhook' && (req.method === 'GET' || req.method === 'POST')) {"

if (code.includes(anchorOld)) {
    code = code.replace(anchorOld, anchorNew)
    fs.writeFileSync(serverPath, code, 'utf8')
    console.log('Webhook route updated to use requestUrl.pathname')
} else {
    console.log('Old route not found.')
}
