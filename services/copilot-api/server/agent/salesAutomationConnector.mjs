import fetch from 'node-fetch'
import { v4 as uuidv4 } from 'uuid'

/**
 * Conector dedicado para a IA de Vendas da Apex AI.
 * Faz o meio de campo entre a inteligência generativa e os sistemas transacionais (Supabase CRM / n8n Webhooks).
 */
export class SalesAutomationConnector {
  constructor(supabaseClient, n8nWebhookUrl) {
    this.supabase = supabaseClient
    this.n8nUrl = n8nWebhookUrl || process.env.N8N_SALES_WEBHOOK_URL
  }

  /**
   * Salva uma campanha gerada pela IA no banco de dados
   */
  async saveCampaign(workspaceId, campaignData) {
    try {
      const { data, error } = await this.supabase
        .from('ai_campaigns')
        .insert([{
          workspace_id: workspaceId,
          campaign_name: campaignData.title || `Campanha Gerada em ${new Date().toISOString()}`,
          status: 'draft',
          vsl_copy: campaignData.vsl,
          email_sequence: campaignData.emails,
          ad_creatives: campaignData.ads,
          n8n_webhook_url: this.n8nUrl
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, campaign: data }
    } catch (err) {
      console.error('[SalesAutomationConnector] Erro ao salvar campanha no Supabase:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Dispara o n8n para engatilhar os fluxos de e-mail e tráfego pago baseados em uma campanha aprovada.
   */
  async triggerN8NCampaign(campaignId, workspaceId) {
    if (!this.n8nUrl) {
      return { success: false, error: 'N8N_SALES_WEBHOOK_URL não configurado.' }
    }

    try {
      const response = await fetch(this.n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LAUNCH_CAMPAIGN',
          campaign_id: campaignId,
          workspace_id: workspaceId,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`n8n webhook failed with status ${response.status}`)
      }

      // Atualiza o status no Supabase para 'active'
      await this.supabase
        .from('ai_campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId)

      return { success: true, message: 'Campanha disparada via n8n com sucesso.' }
    } catch (err) {
      console.error('[SalesAutomationConnector] Erro ao disparar webhook do n8n:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Registra um novo lead qualificado pela IA
   */
  async registerLead(workspaceId, leadData) {
    try {
      const { data, error } = await this.supabase
        .from('ai_leads')
        .insert([{
          workspace_id: workspaceId,
          email: leadData.email,
          name: leadData.name,
          phone: leadData.phone,
          qualification_score: leadData.score || 0,
          tags: leadData.tags || [],
          n8n_sync_status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error
      
      // Tentar enviar o lead para o n8n imediatamente (opcional/assíncrono)
      if (this.n8nUrl) {
        this.triggerN8NLeadSync(data).catch(e => console.error('N8N async sync error:', e))
      }

      return { success: true, lead: data }
    } catch (err) {
      console.error('[SalesAutomationConnector] Erro ao registrar lead:', err)
      return { success: false, error: err.message }
    }
  }
  
  async triggerN8NLeadSync(lead) {
     await fetch(this.n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NEW_LEAD',
          lead: lead
        })
     });
     
     await this.supabase
        .from('ai_leads')
        .update({ n8n_sync_status: 'synced' })
        .eq('id', lead.id)
  }
}
