// Apex GitHub Tools — let the live agent edit its OWN codebase in production.
//
// In a serverless runtime (Vercel) the filesystem is read-only, so write_file /
// edit_file cannot persist. These tools use the GitHub REST API to create a
// branch, commit one or more file changes, and open a Pull Request. The user
// reviews and merges; merging triggers a Vercel deploy.
//
// Auth: GITHUB_TOKEN or GH_TOKEN (needs `repo` scope / contents+PR write).
// Repo: APEX_GITHUB_REPOSITORY or GITHUB_REPOSITORY (owner/name).
// Base: APEX_GITHUB_BASE_BRANCH or APEX_GITHUB_BRANCH or VERCEL_GIT_COMMIT_REF.
//
import { Buffer } from 'node:buffer'

const DEFAULT_REPOSITORY = 'jedgard70/apex-ai-copilot-platform'
const DEFAULT_BASE_BRANCH = 'feature/image-generation-connector'
const API = 'https://api.github.com'

function firstEnv(names) {
  for (const n of names) {
    const v = process.env[n]
    if (v && String(v).trim()) return String(v).trim()
  }
  return ''
}

function getToken() {
  return firstEnv(['GITHUB_TOKEN', 'GH_TOKEN'])
}
function getRepository() {
  return firstEnv(['APEX_GITHUB_REPOSITORY', 'GITHUB_REPOSITORY']) || DEFAULT_REPOSITORY
}
function getBaseBranch() {
  return firstEnv(['APEX_GITHUB_BASE_BRANCH', 'APEX_GITHUB_BRANCH', 'VERCEL_GIT_COMMIT_REF']) || DEFAULT_BASE_BRANCH
}

export function isGithubConfigured() {
  return Boolean(getToken() && getRepository())
}

const SECRET_FILE_PATTERN = /(^|[\\/])\.env(\.|$)|\.env\.local$|\.pem$|\.key$|id_rsa|\.p12$|\.pfx$/i

async function gh(method, pathname, body) {
  const token = getToken()
  if (!token) throw new Error('GITHUB_TOKEN/GH_TOKEN not configured.')
  const res = await fetch(API + pathname, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'apex-live-agent',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }
  if (!res.ok) {
    const msg = data?.message || `GitHub API ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

function repoPath(suffix) {
  return `/repos/${getRepository()}${suffix}`
}

function sanitizeBranchName(name) {
  const base = String(name || '').trim().replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/^-+|-+$/g, '')
  return base || `apex/auto-${Date.now()}`
}

// Get the SHA of the base branch tip.
async function getBaseSha(baseBranch) {
  const ref = await gh('GET', repoPath(`/git/ref/heads/${encodeURIComponent(baseBranch)}`))
  return ref.object.sha
}

// Ensure a working branch exists (create from base if missing).
async function ensureBranch(branch, baseBranch) {
  try {
    await gh('GET', repoPath(`/git/ref/heads/${encodeURIComponent(branch)}`))
    return { created: false }
  } catch (err) {
    if (err.status !== 404) throw err
    const baseSha = await getBaseSha(baseBranch)
    await gh('POST', repoPath('/git/refs'), { ref: `refs/heads/${branch}`, sha: baseSha })
    return { created: true }
  }
}

// Read current file SHA on a branch (needed to update existing files).
async function getFileSha(path, branch) {
  try {
    const data = await gh('GET', repoPath(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`))
    return Array.isArray(data) ? null : data.sha || null
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

// Commit a single file (create or update) to a branch.
async function putFile({ path, content, message, branch }) {
  const sha = await getFileSha(path, branch)
  const body = {
    message,
    content: Buffer.from(String(content ?? ''), 'utf8').toString('base64'),
    branch,
  }
  if (sha) body.sha = sha
  const data = await gh('PUT', repoPath(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`), body)
  return { path, action: sha ? 'updated' : 'created', commit: data.commit?.sha }
}

// ---- Tool definitions ----
export function buildGithubToolDefinitions() {
  if (!isGithubConfigured()) return []
  return [
    {
      type: 'function',
      function: {
        name: 'github_commit_changes',
        description: 'Edit the Apex platform source code by committing one or more file changes to a new branch on GitHub and opening a Pull Request. Use this to ACTUALLY apply code changes in production (the serverless filesystem is read-only, so write_file/edit_file cannot persist there). After the PR is merged, Vercel redeploys automatically. Provide complete file contents for each file you create or modify.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            branch: { type: 'string', description: 'Name for the new working branch, e.g. "apex/add-pdfjs". A unique suffix is added if it exists.' },
            commitMessage: { type: 'string', description: 'Commit/PR title describing the change.' },
            prBody: { type: 'string', description: 'Optional PR description (markdown).' },
            files: {
              type: 'array',
              description: 'List of files to create or overwrite. Provide the FULL new content of each file.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  path: { type: 'string', description: 'Repo-relative file path.' },
                  content: { type: 'string', description: 'Full new content of the file.' },
                },
                required: ['path', 'content'],
              },
            },
          },
          required: ['branch', 'commitMessage', 'files'],
        },
      },
    },
  ]
}

export const GITHUB_TOOL_NAMES = new Set(['github_commit_changes'])

// ---- Execution ----
export async function executeGithubToolCall(toolCall) {
  const name = toolCall && toolCall.function ? String(toolCall.function.name || '') : ''
  if (name !== 'github_commit_changes') {
    return { ok: false, error: `Unknown github tool: ${name}` }
  }
  if (!isGithubConfigured()) {
    return { ok: false, error: 'GitHub is not configured (need GITHUB_TOKEN and a repository).' }
  }
  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return { ok: false, error: 'Invalid tool arguments JSON.' }
  }

  const files = Array.isArray(args.files) ? args.files : []
  if (!files.length) return { ok: false, error: 'No files provided.' }
  for (const f of files) {
    if (!f || !f.path || typeof f.content !== 'string') {
      return { ok: false, error: 'Each file needs a path and string content.' }
    }
    if (SECRET_FILE_PATTERN.test(f.path)) {
      return { ok: false, error: `Refusing to write secret/credential file: ${f.path}` }
    }
    if (f.path.includes('..')) {
      return { ok: false, error: `Invalid path: ${f.path}` }
    }
  }

  const baseBranch = getBaseBranch()
  const branch = sanitizeBranchName(args.branch) + '-' + Math.random().toString(36).slice(2, 7)
  const commitMessage = String(args.commitMessage || 'chore: apex live-agent code change').slice(0, 200)

  try {
    await ensureBranch(branch, baseBranch)

    const committed = []
    for (const f of files) {
      const r = await putFile({ path: f.path, content: f.content, message: commitMessage, branch })
      committed.push(r)
    }

    const pr = await gh('POST', repoPath('/pulls'), {
      title: commitMessage,
      head: branch,
      base: baseBranch,
      body: String(args.prBody || `Automated change by Apex Live Agent.\n\nFiles:\n${committed.map(c => `- ${c.action} \`${c.path}\``).join('\n')}`).slice(0, 60000),
    })

    return {
      ok: true,
      repository: getRepository(),
      baseBranch,
      branch,
      files: committed,
      pullRequest: { number: pr.number, url: pr.html_url, state: pr.state },
      note: 'Pull request opened. Review and merge to deploy via Vercel.',
    }
  } catch (err) {
    return { ok: false, error: `GitHub commit failed: ${err?.message || String(err)}`, status: err?.status }
  }
}
