/**
 * server/service/rdo.mjs
 *
 * RDO / Field Operations — diario de obra, checklists, fotos.
 * Dados sao local-first com sync opcional para Supabase.
 */

/**
 * Dividir lista de campo por linhas/virgulas.
 * @param {string|string[]} input
 * @returns {string[]}
 */
function splitFieldList(input) {
  if (!input) return []
  if (Array.isArray(input)) return input.filter(Boolean)
  return String(input).split(/\n|,/).map(s => s.trim()).filter(Boolean)
}

/**
 * Determina nivel de evidencia baseado na fonte.
 * @param {Object|null} source
 * @param {boolean} hasManualText
 * @returns {string}
 */
function evidenceFromSource(source, hasManualText) {
  if (source?.kind === 'image') return 'PHOTO_CONFIRMED'
  if (hasManualText) return 'USER_REPORTED'
  return 'UNKNOWN'
}

/**
 * Cria um RDO / plano de campo.
 * @param {Object} context
 * @param {Object|null} source
 * @returns {Object}
 */
export function buildFieldOpsPlan(context = {}, source = null) {
  const action = String(context.action || 'rdo')
  const goal = String(context.goal || '')
  const project = String(context.project || 'Apex field project')
  const date = String(context.date || new Date().toISOString().slice(0, 10))
  const weather = String(context.weather || '')
  const crew = splitFieldList(context.crew)
  const materials = splitFieldList(context.materialsDeliveredUsed)
  const activitiesText = String(context.activitiesPerformed || goal || '')
  const delays = String(context.delays || '')
  const incidents = String(context.incidents || '')
  const safetyNotes = String(context.safetyNotes || '')
  const qualityNotes = String(context.qualityNotes || '')
  const hasManualText = Boolean(activitiesText || delays || incidents || safetyNotes || qualityNotes || crew.length || materials.length)
  const baseEvidence = evidenceFromSource(source, hasManualText)
  const photoEvidence = source?.kind === 'image' ? 'PHOTO_CONFIRMED' : 'UNKNOWN'

  const activityDescriptions = splitFieldList(activitiesText)
  const activities = activityDescriptions.length
    ? activityDescriptions.map((description, index) => ({
        id: `activity-${index + 1}`,
        description,
        responsibleParty: crew[0] || 'Field team',
        evidence: baseEvidence === 'PHOTO_CONFIRMED' ? 'USER_REPORTED' : baseEvidence,
        status: 'Completed',
      }))
    : []

  const rdoDraft = [
    `RDO / Daily Report - ${date}`,
    `Project: ${project}`,
    `Weather: ${weather || 'Not reported'}`,
    '',
    'Crew:',
    ...(crew.length ? crew.map(m => `- ${m}`) : ['(not entered)']),
    '',
    'Activities:',
    ...(activities.length ? activities.map(a => `- ${a.description}`) : ['(not entered)']),
    '',
    delays ? `Delays: ${delays}` : '',
    incidents ? `Incidents: ${incidents}` : '',
    safetyNotes ? `Safety: ${safetyNotes}` : '',
    qualityNotes ? `Quality: ${qualityNotes}` : '',
  ].filter(Boolean).join('\n')

  return {
    providerStatus: 'connected',
    action,
    project,
    date,
    weather,
    crew,
    materials,
    activities,
    delays,
    incidents,
    safetyNotes,
    qualityNotes,
    evidence: baseEvidence,
    photoEvidence,
    hasManualText,
    rdoDraft,
    message: action === 'rdo'
      ? 'Field Operations Studio generated an RDO draft. Weather and inspection status are not faked.'
      : 'Field Operations Studio generated a quality/planning draft.',
  }
}
