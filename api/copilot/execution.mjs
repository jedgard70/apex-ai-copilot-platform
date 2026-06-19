import { runLocalWorkerAction } from '../../server/agent/localWorkerClient.mjs'

// Normalize Local_Worker_URL casing from Vercel env vars
if (process.env.Local_Worker_URL && !process.env.LOCAL_WORKER_URL) {
  process.env.LOCAL_WORKER_URL = process.env.Local_Worker_URL
}
if (process.env.Local_Worker_TOKEN && !process.env.LOCAL_WORKER_TOKEN) {
  process.env.LOCAL_WORKER_TOKEN = process.env.Local_Worker_TOKEN
}

const copilotExecutionCommands = [
  {
    id: 'raw_shell',
    label: 'Raw shell command',
    description: 'Run a free live shell command in a user-selected cwd through the local shell.',
    executable: 'shell',
    args: [],
    acceptsRawCommand: true,
    risk: 'high',
    requiresApproval: false,
    timeoutMs: 60000,
  },
  {
    id: 'git_status',
    label: 'Git status',
    description: 'Show concise repo status for the authorized Apex Copilot repo.',
    executable: 'git',
    args: ['status', '--short'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
  },
  {
    id: 'git_log_recent',
    label: 'Recent Git log',
    description: 'Show the five most recent commits.',
    executable: 'git',
    args: ['log', '--oneline', '-5'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
  },
  {
    id: 'git_diff_stat',
    label: 'Git diff stat',
    description: 'Summarize unstaged and staged file changes without showing full patches.',
    executable: 'git',
    args: ['diff', '--stat'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
  },
  {
    id: 'git_diff_name_only',
    label: 'Git changed names',
    description: 'List changed file paths only.',
    executable: 'git',
    args: ['diff', '--name-only'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 15000,
  },
  {
    id: 'build',
    label: 'Build',
    description: 'Run the local Vite production build.',
    executable: 'npm',
    args: ['run', 'build'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 120000,
  },
  {
    id: 'validate_supabase_sql',
    label: 'Validate Supabase SQL',
    description: 'Run the local read-only Supabase SQL validation script.',
    executable: 'npm',
    args: ['run', 'validate:supabase-sql'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 60000,
  },
  {
    id: 'validate_vercel_live',
    label: 'Vercel: Check live deployments',
    description: 'Queries the live Vercel API for deployment logs, URLs, and states.',
    executable: 'node',
    args: ['scripts/validate-vercel.mjs'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
  },
  {
    id: 'validate_supabase_live',
    label: 'Supabase: Check live database',
    description: 'Queries the live Supabase project database connection, schema info, and tables.',
    executable: 'node',
    args: ['scripts/validate-supabase-live.mjs'],
    risk: 'medium',
    requiresApproval: false,
    timeoutMs: 30000,
  },
  {
    id: 'deploy_vercel_live',
    label: 'Vercel: Trigger preview deployment',
    description: 'Triggers a live preview deployment on Vercel and prints connection details.',
    executable: 'node',
    args: ['scripts/deploy-vercel-live.mjs'],
    risk: 'high',
    requiresApproval: true,
    timeoutMs: 60000,
  },
  {
    id: 'check_server',
    label: 'Check server.mjs',
    description: 'Syntax-check the local Node server.',
    executable: 'node',
    args: ['--check', 'server.mjs'],
    risk: 'low',
    requiresApproval: false,
    timeoutMs: 30000,
  },
]

const COMMAND_LABELS = {
  git_status: 'Git status',
  git_log_recent: 'Recent Git log',
  git_diff_stat: 'Git diff stat',
  git_diff_name_only: 'Git changed names',
  build: 'Build',
}

const COMMAND_ARGS = {
  git_status: ['status', '--short'],
  git_log_recent: ['log', '--oneline', '-5'],
  git_diff_stat: ['diff', '--stat'],
  git_diff_name_only: ['diff', '--name-only'],
  build: ['run', 'build'],
}

export default async function handler(req, res) {
  const urlObj = new URL(req.url || '', 'http://localhost')
  const action = req.query?.action || urlObj.searchParams.get('action') || ''

  if (action === 'commands') {
    return res.status(200).json({
      providerStatus: 'local-execution-v0',
      commands: copilotExecutionCommands,
    })
  }

  if (action === 'run') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { commandId, cwd, rawCommand } = req.body || {}

    let workerAction = ''
    let params = {}

    if (commandId === 'git_status') {
      workerAction = 'project.git_status'
    } else if (commandId === 'git_log_recent') {
      workerAction = 'project.git_log'
    } else if (commandId === 'git_diff_stat') {
      workerAction = 'project.git_diff_stat'
    } else if (commandId === 'git_diff_name_only') {
      workerAction = 'project.git_diff'
    } else if (commandId === 'build') {
      workerAction = 'project.build_check'
    } else if (commandId === 'raw_shell') {
      workerAction = 'project.raw_shell'
      params = { command: rawCommand }
    } else if (commandId === 'validate_supabase_sql') {
      workerAction = 'project.raw_shell'
      params = { command: 'npm run validate:supabase-sql' }
    } else if (commandId === 'validate_vercel_live') {
      workerAction = 'project.raw_shell'
      params = { command: 'node scripts/validate-vercel.mjs' }
    } else if (commandId === 'validate_supabase_live') {
      workerAction = 'project.raw_shell'
      params = { command: 'node scripts/validate-supabase-live.mjs' }
    } else if (commandId === 'deploy_vercel_live') {
      workerAction = 'project.raw_shell'
      params = { command: 'node scripts/deploy-vercel-live.mjs' }
    } else if (commandId === 'check_server') {
      workerAction = 'project.raw_shell'
      params = { command: 'node --check server.mjs' }
    }

    if (!workerAction) {
      return res.status(400).json({
        error: `Command "${commandId}" is not supported or mapped in the serverless worker bridge.`,
        providerStatus: 'blocked',
      })
    }

    const startedAt = new Date().toISOString()
    const startedAtMs = Date.now()

    try {
      const result = await runLocalWorkerAction(workerAction, { confirmed: true, params })

      const finishedAt = new Date().toISOString()
      const durationMs = Date.now() - startedAtMs

      if (!result.reachable) {
        return res.status(500).json({
          error: `Local Worker is offline or unreachable. Reason: ${result.reason || 'Network error'}`,
          providerStatus: 'local-execution-v0',
        })
      }

      const cmdDef = copilotExecutionCommands.find(c => c.id === commandId)
      const label = cmdDef ? cmdDef.label : (COMMAND_LABELS[commandId] || commandId)
      const args = commandId === 'raw_shell' ? [rawCommand || ''] : (cmdDef ? cmdDef.args : (COMMAND_ARGS[commandId] || []))
      const risk = cmdDef ? cmdDef.risk : 'low'
      const requiresApproval = cmdDef ? cmdDef.requiresApproval : false

      const executionResult = {
        id: `execution-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        commandId,
        label,
        cwd: result.projectPath || cwd || 'D:\\AI-constr\\apex-ai-copilot-platform',
        args,
        shell: true,
        status: result.ok ? 'completed' : 'failed',
        stdout: result.stdout || '',
        stderr: result.stderr || result.reason || '',
        exitCode: result.exitCode ?? (result.ok ? 0 : 1),
        startedAt,
        finishedAt,
        durationMs: result.durationMs || durationMs,
        createdBy: 'User',
        risk,
        requiresApproval,
        redactedOutput: false,
      }

      return res.status(200).json({
        providerStatus: 'local-execution-v0',
        result: executionResult,
      })
    } catch (err) {
      return res.status(500).json({
        error: `Internal serverless execution router error: ${err.message || String(err)}`,
        providerStatus: 'local-execution-v0',
      })
    }
  }

  return res.status(400).json({ error: `Invalid or missing action "${action}"` })
}
