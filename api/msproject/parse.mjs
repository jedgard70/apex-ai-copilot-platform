/**
 * api/msproject/parse.mjs — Vercel serverless endpoint
 *
 * POST /api/msproject/parse
 * Body: { xml: "<MSPDI XML content>" }
 * Returns parsed MS Project data as JSON.
 *
 * GET /api/msproject/parse?sample=1
 * Returns a sample MSPDI XML for testing.
 */

import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    ['Task', 'Resource', 'Calendar', 'ExtendedAttribute', 'PredecessorLink',
     'Baseline', 'TimephasedData', 'WeekDay', 'Exception', 'WorkWeek',
     'Assignment'].includes(name),
})

function parseDuration(raw) {
  if (!raw) return 0
  const s = String(raw).trim()
  if (!s) return 0
  const iso = s.match(/^P(?:(\d+)D)?T?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (iso) {
    const days = Number(iso[1] || 0)
    const hours = Number(iso[2] || 0)
    const mins = Number(iso[3] || 0)
    const secs = Number(iso[4] || 0)
    return (days * 8 * 60) + (hours * 60) + mins + Math.round(secs / 60)
  }
  const plain = s.match(/^(\d+(?:\.\d+)?)\s*([hdms])$/i)
  if (plain) {
    const val = Number(plain[1])
    switch (plain[2].toLowerCase()) {
      case 'h': return Math.round(val * 60)
      case 'd': return Math.round(val * 8 * 60)
      case 'm': return Math.round(val)
      case 's': return Math.round(val / 60)
    }
  }
  return 0
}

function parsePredecessors(links) {
  if (!links) return []
  const arr = Array.isArray(links) ? links : [links]
  return arr.map(l => String(l['@_PredecessorUID'] || l.PredecessorUID || '')).filter(Boolean)
}

function computeStatus(pct) {
  if (pct >= 100) return 'complete'
  if (pct > 0) return 'in-progress'
  return 'not-started'
}

const SAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<Project xmlns="http://schemas.microsoft.com/project" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Name>Projeto Exemplo — Construção</Name>
  <StartDate>2026-06-01T08:00:00</StartDate>
  <FinishDate>2026-09-30T17:00:00</FinishDate>
  <Tasks>
    <Task>
      <UID>1</UID>
      <Name>Fundação</Name>
      <Duration>PT240H</Duration>
      <Start>2026-06-01T08:00:00</Start>
      <Finish>2026-06-30T17:00:00</Finish>
      <PercentComplete>100</PercentComplete>
      <WBS>1</WBS>
      <OutlineLevel>1</OutlineLevel>
    </Task>
    <Task>
      <UID>2</UID>
      <Name>Estrutura</Name>
      <Duration>PT320H</Duration>
      <Start>2026-07-01T08:00:00</Start>
      <Finish>2026-08-01T17:00:00</Finish>
      <PercentComplete>60</PercentComplete>
      <WBS>2</WBS>
      <OutlineLevel>1</OutlineLevel>
      <PredecessorLinks>
        <PredecessorLink><PredecessorUID>1</PredecessorUID></PredecessorLink>
      </PredecessorLinks>
    </Task>
    <Task>
      <UID>3</UID>
      <Name>Acabamento</Name>
      <Duration>PT320H</Duration>
      <Start>2026-08-02T08:00:00</Start>
      <Finish>2026-09-15T17:00:00</Finish>
      <PercentComplete>10</PercentComplete>
      <WBS>3</WBS>
      <OutlineLevel>1</OutlineLevel>
      <PredecessorLinks>
        <PredecessorLink><PredecessorUID>2</PredecessorUID></PredecessorLink>
      </PredecessorLinks>
    </Task>
    <Task>
      <UID>4</UID>
      <Name>Entrega</Name>
      <Duration>PT80H</Duration>
      <Start>2026-09-16T08:00:00</Start>
      <Finish>2026-09-30T17:00:00</Finish>
      <PercentComplete>0</PercentComplete>
      <WBS>4</WBS>
      <OutlineLevel>1</OutlineLevel>
      <Milestone>true</Milestone>
      <PredecessorLinks>
        <PredecessorLink><PredecessorUID>3</PredecessorUID></PredecessorLink>
      </PredecessorLinks>
    </Task>
  </Tasks>
  <Resources>
    <Resource>
      <UID>1</UID>
      <Name>Equipe A</Name>
      <Type>0</Type>
      <MaxUnits>100</MaxUnits>
    </Resource>
    <Resource>
      <UID>2</UID>
      <Name>Equipe B</Name>
      <Type>0</Type>
      <MaxUnits>50</MaxUnits>
    </Resource>
  </Resources>
</Project>`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET /api/msproject/parse?sample=1
  if (req.method === 'GET' && req.query?.sample) {
    return res.status(200).json({
      sample: SAMPLE_XML,
      description: 'Sample MSPDI XML for testing the parser.',
      usage: 'POST /api/msproject/parse with { xml: "<content>" }',
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
    const xml = body.xml

    if (!xml) {
      return res.status(400).json({ error: 'xml field is required' })
    }

    const doc = parser.parse(xml)
    const project = doc?.Project || doc?.project || {}

    // Parse tasks
    const tasks = []
    if (project.Tasks?.Task) {
      const raw = Array.isArray(project.Tasks.Task) ? project.Tasks.Task : [project.Tasks.Task]
      for (const t of raw) {
        tasks.push({
          uid: String(t['@_UID'] || t.UID || ''),
          id: String(t['@_ID'] || t.ID || ''),
          name: String(t['@_Name'] || t.Name || ''),
          duration: parseDuration(t['@_Duration'] || t.Duration),
          start: t['@_Start'] || t.Start || '',
          finish: t['@_Finish'] || t.Finish || '',
          percentComplete: Number(t['@_PercentComplete'] || t.PercentComplete || 0),
          wbs: String(t['@_WBS'] || t.WBS || ''),
          outlineLevel: Number(t['@_OutlineLevel'] || t.OutlineLevel || 0),
          predecessors: parsePredecessors(t.PredecessorLinks?.PredecessorLink),
          status: computeStatus(Number(t['@_PercentComplete'] || t.PercentComplete || 0)),
          milestone: t['@_Milestone'] === 'true' || t.Milestone === 'true',
          summary: t['@_Summary'] === 'true' || t.Summary === 'true',
        })
      }
    }

    // Parse resources
    const resources = []
    if (project.Resources?.Resource) {
      const raw = Array.isArray(project.Resources.Resource) ? project.Resources.Resource : [project.Resources.Resource]
      for (const r of raw) {
        resources.push({
          uid: String(r['@_UID'] || ''),
          name: String(r['@_Name'] || r.Name || ''),
          type: String(r['@_Type'] || r.Type || '0') === '1' ? 'material' : String(r['@_Type'] || '0') === '2' ? 'cost' : 'work',
          maxUnits: Number(r['@_MaxUnits'] || r.MaxUnits || 100),
        })
      }
    }

    // Analysis
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'complete').length
    const totalPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return res.status(200).json({
      providerStatus: 'connected',
      project: {
        name: String(project['@_Name'] || project.Name || ''),
        startDate: project['@_StartDate'] || project.StartDate || '',
        finishDate: project['@_FinishDate'] || project.FinishDate || '',
      },
      analysis: {
        totalTasks,
        completedTasks,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        notStarted: tasks.filter(t => t.status === 'not-started').length,
        percentComplete: totalPct,
        milestones: tasks.filter(t => t.milestone).length,
      },
      tasks,
      resources,
    })
  } catch (err) {
    console.error('[msproject-parse] Error:', err.message)
    return res.status(400).json({
      error: 'Failed to parse MS Project XML',
      detail: err.message,
    })
  }
}
