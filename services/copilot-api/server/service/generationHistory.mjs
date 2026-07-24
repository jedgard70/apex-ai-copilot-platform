/**
 * server/service/generationHistory.mjs
 *
 * Generation History — historico de geracoes do projeto.
 */

/**
 * Constroi resumo do historico de geracoes.
 * @param {Object} project
 * @returns {Object}
 */
export function buildGenerationHistory(project) {
  if (!project || typeof project !== 'object' || !project.name) {
    return { error: 'Valid project state is required for generation history.' }
  }

  const entries = Array.isArray(project.generationHistory) ? [...project.generationHistory] : []
  entries.sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))

  const byKind = entries.reduce((acc, entry) => {
    const key = String(entry?.kind || 'unknown')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return {
    providerStatus: 'connected',
    summary: {
      total: entries.length,
      completed: entries.filter(entry => entry?.status === 'completed').length,
      failed: entries.filter(entry => entry?.status === 'failed').length,
      byKind,
    },
    entries,
  }
}
