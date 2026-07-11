import fs from 'node:fs'
import path from 'node:path'

const TRAINING_DIR = path.resolve(process.cwd(), 'training_data')
const STATUS_FILE = path.join(TRAINING_DIR, 'training_status.json')

export default async function trainingWebhookHandler(req, res) {
    if (req.method === 'GET') {
        try {
            if (fs.existsSync(STATUS_FILE)) {
                const statusData = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'))
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify(statusData))
            }
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'idle', message: 'Nenhum treinamento em andamento.' }))
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'Erro ao ler status de treinamento.' }))
        }
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    }

    let rawBody = ''
    req.on('data', chunk => { rawBody += chunk })
    req.on('end', () => {
        try {
            const body = rawBody ? JSON.parse(rawBody) : {}
            
            if (!fs.existsSync(TRAINING_DIR)) {
                fs.mkdirSync(TRAINING_DIR, { recursive: true })
            }

            const newStatus = {
                status: body.status || 'unknown',
                progress: typeof body.progress === 'number' ? body.progress : null,
                loss: typeof body.loss === 'number' ? body.loss : null,
                epoch: typeof body.epoch === 'number' ? body.epoch : null,
                message: body.message || '',
                lastUpdated: new Date().toISOString()
            }

            fs.writeFileSync(STATUS_FILE, JSON.stringify(newStatus, null, 2), 'utf-8')

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, recorded: newStatus }))
        } catch (error) {
            console.error('Erro no webhook de treinamento:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal Server Error' }))
        }
    })
}
