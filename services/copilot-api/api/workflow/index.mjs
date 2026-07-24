export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const body = ['POST','PATCH'].includes(req.method) ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''; const url = new URL(req.url, 'http://localhost')
    const mod = await import('../../server/service/workflowTasks.mjs')
    if (path === '/api/workflow/kpis' && req.method === 'GET') return res.status(200).json({ providerStatus:'connected', kpis: mod.getKPIs() })
    if (path === '/api/workflow/tasks' && req.method === 'GET') return res.status(200).json({ providerStatus:'connected', tasks: mod.listTasks(url.searchParams.get('projeto'), url.searchParams.get('assignee'), url.searchParams.get('status'), url.searchParams.get('prioridade')) })
    if (path === '/api/workflow/tasks' && req.method === 'POST') return res.status(200).json({ providerStatus:'connected', task: mod.createTask(body) })
    if (path?.startsWith('/api/workflow/tasks/') && req.method === 'GET' && !path.includes('/status')) {
      const id = path.replace('/api/workflow/tasks/', ''); const task = mod.getTask(id)
      if (!task) return res.status(404).json({ error:'Not found' }); return res.status(200).json({ providerStatus:'connected', task })
    }
    if (path?.includes('/status') && req.method === 'PATCH') {
      const id = path.replace('/status','').replace('/api/workflow/tasks/','')
      const task = mod.updateTaskStatus(id, body.status, body.horasGastas)
      if (!task) return res.status(404).json({ error:'Not found' }); return res.status(200).json({ providerStatus:'connected', task })
    }
    return res.status(404).json({ error:'Not found' })
  } catch (err) { console.error('[workflow] Error:',err.message); return res.status(500).json({ error:err.message }) }
}
