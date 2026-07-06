/**
 * api/copilot/project-package.mjs — Vercel serverless
 *
 * Project Package Pipeline — consolida dados do projeto
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method not allowed' }))

  try {
    const body = typeof req.body === 'object' ? req.body : {}
    const project = body.project || {}
    const goal = String(body.goal || 'Complete project package').trim()

    if (!project || typeof project !== 'object' || !project.name) {
      return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Valid project state is required for project package pipeline.' }))
    }

    const exportsList = Array.isArray(project.exports) ? project.exports : []
    const files = Array.isArray(project.files) ? project.files : []

    // Find latest exports
    const findLatestExport = (type) => {
      const matches = exportsList.filter(e => e?.type === type)
      matches.sort((a, b) => String(b?.timestamp || '').localeCompare(String(a?.timestamp || '')))
      return matches[0] || null
    }

    const latestBudget = findLatestExport('budget-estimate')
    const latestContracts = findLatestExport('contracts-permits-review')
    const latestResearch = findLatestExport('research-market-intelligence')

    const { buildProjectPackage } = await import('../../server/service/projectPackage.mjs')
    const result = buildProjectPackage({
      projectName: project.name,
      goal,
      files,
      exportsList,
      budgetTotal: latestBudget?.plan?.totalDirectCost || latestBudget?.plan?.total || 0,
      budgetCurrency: latestBudget?.plan?.assumptions?.currency || 'BRL',
      researchSources: Array.isArray(latestResearch?.plan?.sources) ? latestResearch.plan.sources.length : 0,
      permitItems: Array.isArray(latestContracts?.plan?.permitPackage) ? latestContracts.plan.permitPackage.length : 0,
      pendingContractQuestions: Array.isArray(latestContracts?.plan?.pendingQuestions) ? latestContracts.plan.pendingQuestions.length : 0,
      profile: project.projectProfile && typeof project.projectProfile === 'object' ? project.projectProfile : {},
    })
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result))
  } catch (error) {
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error.message }))
  }
}
