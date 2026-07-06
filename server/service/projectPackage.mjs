/**
 * server/service/projectPackage.mjs
 *
 * Project Package Pipeline — consolida dados do projeto em pacote unico.
 */

/**
 * Constroi artefato de pacote.
 * @param {Object} params
 * @returns {Object}
 */
function buildArtifact({ id, title, checks, summary = '', nextAction = '' }) {
  return { id, title, checks, summary, nextAction, createdAt: new Date().toISOString() }
}

/**
 * Constroi pacote do projeto a partir de dados pre-processados.
 * @param {Object} data
 * @returns {Object}
 */
export function buildProjectPackage(data) {
  const {
    projectName = 'Apex Project',
    goal = 'Complete project package',
    files = [],
    exportsList = [],
    budgetTotal = 0,
    budgetCurrency = 'BRL',
    researchSources = 0,
    permitItems = 0,
    pendingContractQuestions = 0,
    profile = {},
  } = data

  const fileKinds = Array.from(new Set(files.map(f => String(f?.kind || 'unknown'))))

  const designArtifact = buildArtifact({
    id: 'design-review',
    title: 'Design review and board package',
    checks: [
      { label: 'briefing', value: profile.brief ? 'saved in workspace' : 'missing', status: profile.brief ? 'READY' : 'PARTIAL' },
      { label: 'project type', value: profile.projectType || 'missing', status: profile.projectType ? 'READY' : 'PARTIAL' },
      { label: 'files', value: `${files.length} file(s) / kinds: ${fileKinds.join(', ') || 'none'}`, status: files.length ? 'READY' : 'MISSING' },
    ],
    summary: files.length
      ? 'Apex can structure the review package, board narrative and drawing handoff from the current workspace evidence.'
      : 'No source files are attached yet, so the board package cannot move past planning status.',
    nextAction: files.length
      ? 'Confirm which drawing should become the main presentation board and lock the revision constraints.'
      : 'Upload the base plan, facade, BIM or reference files first.',
  })

  return {
    providerStatus: 'connected',
    packageId: `pkg-${Date.now()}`,
    createdAt: new Date().toISOString(),
    summary: {
      projectName,
      goal,
      totalExports: exportsList.length,
      totalFiles: files.length,
      budgetEstimate: { total: budgetTotal, currency: budgetCurrency },
      researchSources,
      contractPermits: { permitItems, pendingQuestions: pendingContractQuestions },
    },
    artifacts: [designArtifact],
    exportReadiness: exportsList.length > 0 ? 'READY' : 'MISSING',
    message: exportsList.length > 0
      ? `Package built with ${exportsList.length} export(s) and ${files.length} file(s). Research sources: ${researchSources}. Contracts: ${permitItems} items with ${pendingContractQuestions} questions pending.`
      : 'No exports yet — generate something first (ArchVis, Budget, Research, etc).',
  }
}
