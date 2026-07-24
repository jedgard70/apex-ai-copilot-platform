import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { z } from 'zod'

const mcpServer = new McpServer({
  name: 'Apex Ai',
  version: '1.0.0',
})

mcpServer.tool('roll_dice', 'Apex Ai Copilot Platform.', {
  sides: z.number().int().min(2),
}, async ({ sides }) => {
  const value = 1 + Math.floor(Math.random() * sides)
  return {
    content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }]
  }
})

let transport = null

export default async function mcpHandler(req, res) {
  const requestUrl = new URL(req.url, 'http://127.0.0.1')
  
  if (requestUrl.pathname === '/api/mcp' && req.method === 'GET') {
    try {
      transport = new SSEServerTransport('/api/mcp/message', res)
      await mcpServer.connect(transport)
    } catch (e) {
      console.error('MCP Connect Error:', e)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message, stack: e.stack }))
    }
    return
  }
  
  if (requestUrl.pathname === '/api/mcp/message' && req.method === 'POST') {
    if (transport) {
      await transport.handlePostMessage(req, res)
    } else {
      res.writeHead(400)
      res.end('No active MCP connection')
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
}
