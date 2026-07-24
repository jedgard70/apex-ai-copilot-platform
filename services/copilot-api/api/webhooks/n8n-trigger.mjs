import { SalesAutomationConnector } from '../../server/agent/salesAutomationConnector.mjs'

/**
 * Webhook Endpoint para receber comandos da UI ou da IA 
 * e acionar a automação de vendas via n8n e Supabase CRM.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, payload, workspaceId } = req.body

    // TODO: Instanciar cliente do supabaseAdmin para acesso server-side (omitido para brevidade do boilerplate)
    const mockSupabase = {
      from: () => ({
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'mock-id' } }) }) }),
        update: () => ({ eq: async () => ({ data: {} }) })
      })
    }

    const n8nWebhookUrl = process.env.N8N_SALES_WEBHOOK_URL
    const connector = new SalesAutomationConnector(mockSupabase, n8nWebhookUrl)

    if (action === 'SAVE_CAMPAIGN') {
      const result = await connector.saveCampaign(workspaceId, payload)
      return res.status(200).json(result)
    }

    if (action === 'LAUNCH_CAMPAIGN') {
      const result = await connector.triggerN8NCampaign(payload.campaign_id, workspaceId)
      return res.status(200).json(result)
    }

    if (action === 'REGISTER_LEAD') {
      const result = await connector.registerLead(workspaceId, payload)
      return res.status(200).json(result)
    }

    return res.status(400).json({ error: 'Ação de automação desconhecida.' })
  } catch (error) {
    console.error('[Webhook n8n-trigger] Erro:', error)
    return res.status(500).json({ error: 'Internal Server Error', details: error.message })
  }
}
