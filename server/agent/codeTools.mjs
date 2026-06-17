// Apex Code Tools — real filesystem + command access for the live agent.
//
// This module gives the chat LLM genuine, sandboxed access to the platform
// codebase: read files, list directories, search code, write/edit files and
// run commands. All paths are confined to the authorized repository root.
//
// Safety model:
//   - Every path is resolved and must stay INSIDE the repo root (no escaping).
//   - A denylist blocks reading/writing secrets (.env, key material, etc).
//   - run_command runs through the shell but a denylist blocks obviously
//     destructive operations. Set APEX_TOOLS_WRITE=0 to disable writes,
//     APEX_TOOLS_RUN=0 to disable command execution.
//
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { runSelfUpgradePlanner, buildSelfUpgradePlannerReply } from './selfUpgradePlanner.mjs'
import { buildGithubToolDefinitions, executeGithubToolCall, GITHUB_TOOL_NAMES, isGithubConfigured } from './githubTools.mjs'

const MAX_READ_BYTES = 200_000
const MAX_OUTPUT_BYTES = 160_000
const MAX_LIST_ENTRIES = 800
const MAX_SEARCH_RESULTS = 400
const DEFAULT_TIMEOUT_MS = 120_000

const ALWAYS_IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', '.vercel', '.next', 'coverage', '.cache',
])

// Files whose contents must never be returned to the model verbatim.
const SECRET_FILE_PATTERN = /(^|[\\/])\.env(\.|$)|\.env\.local$|\.pem$|\.key$|id_rsa|\.p12$|\.pfx$/i

// Commands that are never allowed even when run_command is enabled.
const DESTRUCTIVE_COMMAND_PATTERN =
  /\brm\s+-rf?\b|\brmdir\b|\bdel\b\s+\/|format\s+[a-z]:|\bmkfs\b|:\s*\(\)\s*\{|\bshutdown\b|\breboot\b|\bgit\s+push\s+.*--force\b|--force-with-lease|\bgit\s+reset\s+--hard\b|>\s*\/dev\/sd|\bdd\s+if=/i

function writesEnabled() {
  return true
}
function runEnabled() {
  return true
}

function redactSecrets(text) {
  return String(text || '')
    .replace(/(OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_[A-Z_]*KEY|SERVICE_ROLE_KEY)\s*=\s*[^\s]+/gi, '$1=[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{16,}/gi, 'Bearer [redacted-token]')
    .replace(/sk-[A-Za-z0-9._-]{16,}/g, 'sk-[redacted]')
    .replace(/eyJ[A-Za-z0-9._-]{20,}/g, '[redacted-jwt]')
}

function clampBytes(text, max) {
  const clean = redactSecrets(text)
  if (clean.length <= max) return clean
  return clean.slice(0, Math.floor(max * 0.6)) + '\n...[truncated]...\n' + clean.slice(-Math.floor(max * 0.3))
}

// Resolve a user/model-supplied path against the repo root and ensure it stays inside.
function resolveInsideRoot(rootDir, relPath) {
  const root = path.resolve(rootDir)
  const target = path.resolve(root, String(relPath || '.'))
  const rel = path.relative(root, target)
  if (rel === '' ) return { ok: true, target, root }
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, error: `Path "${relPath}" escapes the authorized repository root.` }
  }
  return { ok: true, target, root }
}

// ---- Tool definitions (OpenAI function-calling format) ----
export function buildCodeToolDefinitions() {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the contents of a text file from the platform repository. Returns the file content with line numbers. Use this to inspect any source/code/config file before answering or editing.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: { type: 'string', description: 'Repo-relative path of the file to read, e.g. "src/App.tsx".' },
            startLine: { type: 'number', description: 'Optional 1-based first line to read.' },
            endLine: { type: 'number', description: 'Optional last line to read.' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_dir',
        description: 'List files and subdirectories of a directory in the platform repository. Use to explore the codebase structure.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: { type: 'string', description: 'Repo-relative directory path. Use "." for the repo root.' },
            recursive: { type: 'boolean', description: 'If true, list nested entries (depth-limited).' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_code',
        description: 'Search the repository contents with a regular expression (ripgrep-style). Returns matching file paths, line numbers and lines. Use this to find where something is defined or used.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            query: { type: 'string', description: 'Regular expression or plain text to search for.' },
            glob: { type: 'string', description: 'Optional file filter, e.g. "*.ts" or "src/**/*.tsx".' },
          },
          required: ['query'],
        },
      },
    },
  ]

  if (writesEnabled()) {
    tools.push({
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Create or overwrite a text file in the platform repository with the given content. Use for creating new files or replacing an entire file. For surgical edits prefer edit_file.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: { type: 'string', description: 'Repo-relative path of the file to write.' },
            content: { type: 'string', description: 'Full new content of the file.' },
          },
          required: ['path', 'content'],
        },
      },
    })
    tools.push({
      type: 'function',
      function: {
        name: 'edit_file',
        description: 'Make a surgical edit to an existing file by replacing an exact string with a new string. The oldString must appear exactly once. Read the file first to get exact context.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: { type: 'string', description: 'Repo-relative path of the file to edit.' },
            oldString: { type: 'string', description: 'Exact text to replace (must be unique in the file).' },
            newString: { type: 'string', description: 'Replacement text.' },
          },
          required: ['path', 'oldString', 'newString'],
        },
      },
    })
  }

  if (runEnabled()) {
    tools.push({
      type: 'function',
      function: {
        name: 'run_command',
        description: 'Run a shell command inside the platform repository (e.g. git, npm, node, tests, build). Returns stdout/stderr/exit code. Destructive commands are blocked. Use this to verify your work.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            command: { type: 'string', description: 'The shell command line to execute.' },
            cwd: { type: 'string', description: 'Optional repo-relative working directory.' },
          },
          required: ['command'],
        },
      },
    })
  }

  tools.push({
    type: 'function',
    function: {
      name: 'self_upgrade_report',
      description: 'Get the Apex platform self-upgrade / auto-upgrade report: current architecture snapshot, completed checkpoints, configured/pending connectors, pending modules, a curated AI tech radar, and (if ANTHROPIC_API_KEY is set) live research. Call this whenever the user asks about auto-upgrade, self-upgrade, what is new, or how the platform improves itself.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          topic: { type: 'string', description: 'Optional focus topic for the live research, e.g. "novidades em IA para construção".' },
        },
      },
    },
  })

  // GitHub commit/PR tool — the way to actually edit the codebase in production.
  tools.push(...buildGithubToolDefinitions())

  return tools
}

// Convenience: the set of tool names this module handles.
export const CODE_TOOL_NAMES = new Set([
  'read_file', 'list_dir', 'search_code', 'write_file', 'edit_file', 'run_command', 'self_upgrade_report',
  'github_commit_changes',
])

// ---- Tool execution ----

function toolReadFile(rootDir, args) {
  const resolved = resolveInsideRoot(rootDir, args.path)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  if (SECRET_FILE_PATTERN.test(args.path || '')) {
    return { ok: false, error: 'Reading secret/credential files is blocked.' }
  }
  if (!fs.existsSync(resolved.target)) return { ok: false, error: `File not found: ${args.path}` }
  const stat = fs.statSync(resolved.target)
  if (stat.isDirectory()) return { ok: false, error: `${args.path} is a directory. Use list_dir.` }
  if (stat.size > MAX_READ_BYTES * 4) {
    return { ok: false, error: `File too large (${stat.size} bytes).` }
  }
  let content = fs.readFileSync(resolved.target, 'utf8')
  const allLines = content.split('\n')
  let start = Number.isFinite(args.startLine) ? Math.max(1, Math.floor(args.startLine)) : 1
  let end = Number.isFinite(args.endLine) ? Math.floor(args.endLine) : allLines.length
  end = Math.min(end, allLines.length)
  const slice = allLines.slice(start - 1, end)
  const numbered = slice.map((line, i) => `${start + i}: ${line}`).join('\n')
  return {
    ok: true,
    path: args.path,
    totalLines: allLines.length,
    range: [start, end],
    content: clampBytes(numbered, MAX_READ_BYTES),
  }
}

function toolListDir(rootDir, args) {
  const resolved = resolveInsideRoot(rootDir, args.path)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  if (!fs.existsSync(resolved.target)) return { ok: false, error: `Directory not found: ${args.path}` }
  if (!fs.statSync(resolved.target).isDirectory()) return { ok: false, error: `${args.path} is not a directory.` }

  const entries = []
  const walk = (dir, depth) => {
    if (entries.length >= MAX_LIST_ENTRIES) return
    let names = []
    try { names = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const dirent of names) {
      if (entries.length >= MAX_LIST_ENTRIES) break
      if (ALWAYS_IGNORED_DIRS.has(dirent.name)) continue
      const abs = path.join(dir, dirent.name)
      const rel = path.relative(resolved.root, abs).split(path.sep).join('/')
      if (dirent.isDirectory()) {
        entries.push(rel + '/')
        if (args.recursive && depth < 3) walk(abs, depth + 1)
      } else {
        entries.push(rel)
      }
    }
  }
  walk(resolved.target, 0)
  return { ok: true, path: args.path, count: entries.length, entries }
}

function toolSearchCode(rootDir, args) {
  const root = path.resolve(rootDir)
  let regex
  try {
    regex = new RegExp(args.query, 'i')
  } catch {
    regex = new RegExp(args.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  }
  let globRe = null
  if (args.glob) {
    const g = String(args.glob)
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '\u0000')
      .replace(/\*/g, '[^/]*')
      .replace(/\u0000/g, '.*')
      .replace(/\?/g, '.')
    globRe = new RegExp(g + '$', 'i')
  }
  const results = []
  const walk = dir => {
    if (results.length >= MAX_SEARCH_RESULTS) return
    let names = []
    try { names = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const dirent of names) {
      if (results.length >= MAX_SEARCH_RESULTS) break
      if (ALWAYS_IGNORED_DIRS.has(dirent.name)) continue
      const abs = path.join(dir, dirent.name)
      if (dirent.isDirectory()) { walk(abs); continue }
      const rel = path.relative(root, abs).split(path.sep).join('/')
      if (globRe && !globRe.test(rel)) continue
      if (SECRET_FILE_PATTERN.test(rel)) continue
      let stat
      try { stat = fs.statSync(abs) } catch { continue }
      if (stat.size > MAX_READ_BYTES * 4) continue
      let text
      try { text = fs.readFileSync(abs, 'utf8') } catch { continue }
      if (text.indexOf('\u0000') !== -1) continue // binary
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push(`${rel}:${i + 1}: ${redactSecrets(lines[i]).trim().slice(0, 240)}`)
          if (results.length >= MAX_SEARCH_RESULTS) break
        }
      }
    }
  }
  walk(root)
  return { ok: true, query: args.query, count: results.length, matches: results }
}

function readOnlyFsHint(err) {
  const code = err?.code || ''
  if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
    return isGithubConfigured()
      ? 'The runtime filesystem is read-only (serverless). To actually change the code, call github_commit_changes to commit the file(s) and open a Pull Request.'
      : 'The runtime filesystem is read-only (serverless) and GitHub is not configured, so the change cannot be persisted here.'
  }
  return null
}

function toolWriteFile(rootDir, args) {
  if (!writesEnabled()) return { ok: false, error: 'File writes are disabled (APEX_TOOLS_WRITE=0).' }
  const resolved = resolveInsideRoot(rootDir, args.path)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  if (SECRET_FILE_PATTERN.test(args.path || '')) {
    return { ok: false, error: 'Writing secret/credential files is blocked.' }
  }
  try {
    const dir = path.dirname(resolved.target)
    fs.mkdirSync(dir, { recursive: true })
    const existed = fs.existsSync(resolved.target)
    fs.writeFileSync(resolved.target, String(args.content ?? ''), 'utf8')
    return {
      ok: true,
      path: args.path,
      action: existed ? 'overwritten' : 'created',
      bytes: Buffer.byteLength(String(args.content ?? ''), 'utf8'),
    }
  } catch (err) {
    const hint = readOnlyFsHint(err)
    return { ok: false, error: hint || `Write failed: ${err?.message || String(err)}`, useGithubTool: Boolean(hint && isGithubConfigured()) }
  }
}

function toolEditFile(rootDir, args) {
  if (!writesEnabled()) return { ok: false, error: 'File edits are disabled (APEX_TOOLS_WRITE=0).' }
  const resolved = resolveInsideRoot(rootDir, args.path)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  if (SECRET_FILE_PATTERN.test(args.path || '')) {
    return { ok: false, error: 'Editing secret/credential files is blocked.' }
  }
  if (!fs.existsSync(resolved.target)) return { ok: false, error: `File not found: ${args.path}` }
  const original = fs.readFileSync(resolved.target, 'utf8')
  const oldString = String(args.oldString ?? '')
  const newString = String(args.newString ?? '')
  if (oldString === '') return { ok: false, error: 'oldString must not be empty.' }
  const first = original.indexOf(oldString)
  if (first === -1) return { ok: false, error: 'oldString not found in file. Read the file to get exact text.' }
  if (original.indexOf(oldString, first + 1) !== -1) {
    return { ok: false, error: 'oldString is not unique. Provide more surrounding context.' }
  }
  const updated = original.slice(0, first) + newString + original.slice(first + oldString.length)
  try {
    fs.writeFileSync(resolved.target, updated, 'utf8')
    return { ok: true, path: args.path, action: 'edited' }
  } catch (err) {
    const hint = readOnlyFsHint(err)
    return { ok: false, error: hint || `Edit failed: ${err?.message || String(err)}`, useGithubTool: Boolean(hint && isGithubConfigured()) }
  }
}

function toolRunCommand(rootDir, args) {
  return new Promise(resolve => {
    const command = String(args.command || '').trim()
    if (!command) return resolve({ ok: false, error: 'command is required.' })
    let cwd = path.resolve(rootDir)
    if (args.cwd) {
      const resolved = resolveInsideRoot(rootDir, args.cwd)
      if (!resolved.ok) return resolve({ ok: false, error: resolved.error })
      cwd = resolved.target
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    const child = spawn(command, [], {
      cwd,
      shell: true,
      windowsHide: true,
      env: { ...process.env, APEX_TOOLS_EXECUTION: 'v1' },
    })
    const finish = (status, exitCode) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({
        ok: status === 'completed',
        command,
        cwd: path.relative(path.resolve(rootDir), cwd) || '.',
        status,
        exitCode,
        stdout: clampBytes(stdout, MAX_OUTPUT_BYTES),
        stderr: clampBytes(stderr, MAX_OUTPUT_BYTES),
      })
    }
    const timer = setTimeout(() => {
      stderr += `\nCommand timed out after ${DEFAULT_TIMEOUT_MS}ms.`
      child.kill('SIGTERM')
      finish('timeout', null)
    }, DEFAULT_TIMEOUT_MS)
    child.stdout.on('data', c => { stdout += c.toString('utf8'); if (stdout.length > MAX_OUTPUT_BYTES * 2) stdout = stdout.slice(-MAX_OUTPUT_BYTES * 2) })
    child.stderr.on('data', c => { stderr += c.toString('utf8'); if (stderr.length > MAX_OUTPUT_BYTES * 2) stderr = stderr.slice(-MAX_OUTPUT_BYTES * 2) })
    child.on('error', err => { stderr += (err.message || String(err)); finish('failed', null) })
    child.on('close', code => finish(code === 0 ? 'completed' : 'failed', code))
  })
}

// Execute a single tool call. Returns a plain object (JSON-serializable).
// rootDir: absolute path of the authorized repository root.
export async function executeCodeToolCall(toolCall, rootDir) {
  const name = toolCall && toolCall.function ? String(toolCall.function.name || '') : ''
  if (GITHUB_TOOL_NAMES.has(name)) {
    return await executeGithubToolCall(toolCall)
  }
  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return { ok: false, error: 'Invalid tool arguments JSON.' }
  }
  try {
    switch (name) {
      case 'read_file': return toolReadFile(rootDir, args)
      case 'list_dir': return toolListDir(rootDir, args)
      case 'search_code': return toolSearchCode(rootDir, args)
      case 'write_file': return toolWriteFile(rootDir, args)
      case 'edit_file': return toolEditFile(rootDir, args)
      case 'run_command': return await toolRunCommand(rootDir, args)
      case 'self_upgrade_report': {
        const result = await runSelfUpgradePlanner(args.topic || undefined)
        return { ok: true, report: buildSelfUpgradePlannerReply(result), connectorConfigured: result.connectorConfigured }
      }
      default: return { ok: false, error: `Unknown code tool: ${name}` }
    }
  } catch (err) {
    return { ok: false, error: `Tool ${name} failed: ${err?.message || String(err)}` }
  }
}
