/**
 * server/service/crm.mjs
 *
 * CRM / Client Management — gerenciamento de leads, clientes e propostas.
 * Por enquanto opera em modo local-first. Conector com banco real pendente.
 */

/**
 * Cria lead no CRM.
 * @param {Object} data
 * @returns {Object}
 */
export function createLead(data = {}) {
  const now = new Date().toISOString()
  return {
    id: `lead-${Date.now()}`,
    name: String(data.name || data.nome || '').trim(),
    email: String(data.email || '').trim(),
    phone: String(data.phone || data.telefone || '').trim(),
    company: String(data.company || data.empresa || '').trim(),
    source: String(data.source || data.fonte || 'chat'),
    status: 'new',
    score: 0,
    notes: String(data.notes || data.observacoes || ''),
    createdAt: now,
    updatedAt: now,
    providerStatus: 'connected',
    message: 'Lead created in local CRM. No real database connector.',
  }
}

/**
 * Lista leads (local).
 * @returns {Object}
 */
export function listLeads() {
  return {
    providerStatus: 'connected',
    leads: [],
    message: 'CRM is in local mode. No database or connector configured.',
    connectorStatus: 'planning-only',
  }
}
