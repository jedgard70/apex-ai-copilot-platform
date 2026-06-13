import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { isAllowedProjectFile, isPathInsideRepo } from './policy.mjs'

const MAX_OUTPUT = 120000

export const COMMANDS = {
  git_status: { executable: 'git', args: ['status', '--short'], timeoutMs: 15000 },
  git_diff_stat: { executable: 'git', args: ['diff', '--stat'], timeoutMs: 15000 },
  git_diff_name_only: { executable: 'git', args: ['diff', '--name-only'], timeoutMs: 15000 },
  git_log_recent: { executable: 'git', args: ['log', '--oneline', '-5'], timeoutMs: 15000 },
  check_server: { executable: 'node', args: ['--check', 'server.mjs'], timeoutMs: 30000 },
  check_reasoning_core: { executable: 'node', args: ['--check', 'server/apexReasoningCore.mjs'], timeoutMs: 30000, optionalFile: 'server/apexReasoningCore.mjs' },
  check_operator_runtime: { executable: 'node', args: ['--check', 'server/agent/apexOperatorRuntime.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/apexOperatorRuntime.mjs' },
  check_executor: { executable: 'node', args: ['--check', 'server/agent/executor.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/executor.mjs' },
  check_memory: { executable: 'node', args: ['--check', 'server/agent/memory.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/memory.mjs' },
  check_planner: { executable: 'node', args: ['--check', 'server/agent/planner.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/planner.mjs' },
  check_policy: { executable: 'node', args: ['--check', 'server/agent/policy.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/policy.mjs' },
  check_verifier: { executable: 'node', args: ['--check', 'server/agent/verifier.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/verifier.mjs' },
  check_build_tools: { executable: 'node', args: ['--check', 'server/agent/tools/buildTools.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/tools/buildTools.mjs' },
  check_file_tools: { executable: 'node', args: ['--check', 'server/agent/tools/fileTools.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/tools/fileTools.mjs' },
  check_git_tools: { executable: 'node', args: ['--check', 'server/agent/tools/gitTools.mjs'], timeoutMs: 30000, optionalFile: 'server/agent/tools/gitTools.mjs' },
  build: { executable: 'npm.cmd', args: ['run', 'build'], timeoutMs: 120000 },
}

function resolveExecutable(executable) {
  if (executable !== 'git') return executable
  const githubDesktopGit = 'C:\\Users\\apexg\\AppData\\Local\\GitHubDesktop\\app-3.5.12\\resources\\app\\git\\cmd\\git.exe'
  return fs.existsSync(githubDesktopGit) ? githubDesktopGit : executable
}

function prepareCommand(command) {
  if (command.executable !== 'npm.cmd' && command.executable !== 'npm') {
    return {
      executable: resolveExecutable(command.executable),
      args: command.args,
      display: [command.executable, ...command.args].join(' '),
    }
  }
  const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  const resolvedNpmCli = path.resolve(npmCli)
  if (fs.existsSync(resolvedNpmCli)) {
    return {
      executable: process.execPath,
      args: [resolvedNpmCli, ...command.args],
      display: [command.executable, ...command.args].join(' '),
    }
  }
  return {
    executable: command.executable,
    args: command.args,
    display: [command.executable, ...command.args].join(' '),
  }
}

function appendLimited(current, chunk) {
  const next = current + chunk
  if (Buffer.byteLength(next, 'utf8') <= MAX_OUTPUT) return next
  return next.slice(0, MAX_OUTPUT) + '\n[output truncated]'
}

export function redactOutput(value = '') {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[redacted-openai-key]')
    .replace(/\bghp_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-token]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-pat]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{16,}/gi, 'Bearer [redacted-token]')
    .replace(/eyJ[A-Za-z0-9._-]{20,}/g, '[redacted-jwt]')
    .replace(/\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]{8,}/gi, '$1=[redacted-secret]')
}

export function runFixedCommand(commandId, repoPath) {
  const command = COMMANDS[commandId]
  if (!command) {
    return Promise.resolve({ commandId, status: 'blocked', exitCode: null, stdout: '', stderr: 'Unknown command id.' })
  }
  if (!isPathInsideRepo(repoPath, repoPath)) {
    return Promise.resolve({ commandId, status: 'blocked', exitCode: null, stdout: '', stderr: 'Repo path is outside authorized root.' })
  }
  if (command.optionalFile && !fs.existsSync(path.join(repoPath, command.optionalFile))) {
    return Promise.resolve({ commandId, status: 'skipped', exitCode: 0, stdout: '', stderr: `${command.optionalFile} not present.` })
  }

  return new Promise(resolve => {
    const startedAt = Date.now()
    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false
    const prepared = prepareCommand(command)
    const child = spawn(prepared.executable, prepared.args, {
      cwd: repoPath,
      shell: false,
      windowsHide: true,
      env: { ...process.env, APEX_OPERATOR_RUNTIME: '1' },
    })

    const finish = (status, exitCode = null) => {
      if (settled) return
      settled = true
      resolve({
        commandId,
        command: prepared.display,
        status,
        exitCode,
        durationMs: Date.now() - startedAt,
        stdout: redactOutput(stdout),
        stderr: redactOutput(stderr),
      })
    }

    const timer = setTimeout(() => {
      timedOut = true
      stderr = appendLimited(stderr, `\nCommand timed out after ${command.timeoutMs}ms.`)
      child.kill('SIGTERM')
    }, command.timeoutMs)

    child.stdout.on('data', chunk => { stdout = appendLimited(stdout, chunk.toString('utf8')) })
    child.stderr.on('data', chunk => { stderr = appendLimited(stderr, chunk.toString('utf8')) })
    child.on('error', error => {
      clearTimeout(timer)
      stderr = appendLimited(stderr, error.message || String(error))
      finish('failed', null)
    })
    child.on('close', code => {
      clearTimeout(timer)
      finish(timedOut ? 'timeout' : code === 0 ? 'completed' : 'failed', code)
    })
  })
}

export async function runCommands(commandIds, repoPath) {
  const results = []
  for (const commandId of [...new Set(commandIds)]) {
    results.push(await runFixedCommand(commandId, repoPath))
  }
  return results
}

export function parseChangedFiles(statusOutput = '') {
  return String(statusOutput || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.slice(3).trim())
    .filter(Boolean)
}

export async function runApprovedCommit({ repoPath, message }) {
  const status = await runFixedCommand('git_status', repoPath)
  const changedFiles = parseChangedFiles(status.stdout)
  const allowedFiles = changedFiles.filter(isAllowedProjectFile)
  const blockedFiles = changedFiles.filter(file => !isAllowedProjectFile(file))

  if (!allowedFiles.length) {
    return { ok: false, status: 'YELLOW', changedFiles, blockedFiles, message: 'No allowed changed project files to commit.' }
  }
  if (blockedFiles.length) {
    return { ok: false, status: 'BLOCKED', changedFiles, blockedFiles, message: 'Commit blocked because forbidden paths are changed.' }
  }

  const addResult = await runGit(repoPath, ['add', ...allowedFiles])
  if (addResult.status !== 'completed') return { ok: false, status: 'BLOCKED', changedFiles, addResult, message: 'git add failed.' }

  const commitResult = await runGit(repoPath, ['commit', '-m', message || 'chore: apex operator approved commit'])
  if (commitResult.status !== 'completed') return { ok: false, status: 'BLOCKED', changedFiles, commitResult, message: 'git commit failed.' }

  const hashResult = await runGit(repoPath, ['rev-parse', 'HEAD'])
  const finalStatus = await runFixedCommand('git_status', repoPath)
  return {
    ok: true,
    status: 'GREEN',
    changedFiles,
    commitHash: String(hashResult.stdout || '').trim(),
    commitMessage: message || 'chore: apex operator approved commit',
    commitResult,
    finalStatus: String(finalStatus.stdout || '').trim(),
  }
}

export function runOwnerRawShell({ repoPath, rawCommand }) {
  const command = String(rawCommand || '').trim()
  if (!command) {
    return Promise.resolve({ ok: false, status: 'BLOCKED', message: 'rawCommand is required for shell livre.' })
  }
  if (/\b(rm\s+-rf|del\s+\/s|rmdir\s+\/s|drop\s+(database|schema|table)|delete\s+from|truncate|git\s+reset\s+--hard|push\s+--force|service[_-]?role)\b/i.test(command)) {
    return Promise.resolve({ ok: false, status: 'BLOCKED', message: 'Comando destrutivo ou sensivel bloqueado antes da execucao.' })
  }
  return new Promise(resolve => {
    const startedAt = Date.now()
    let stdout = ''
    let stderr = ''
    let settled = false
    const child = spawn(command, [], {
      cwd: repoPath,
      shell: true,
      windowsHide: true,
      env: { ...process.env, APEX_OPERATOR_RAW_SHELL: '1' },
    })
    const finish = (status, exitCode = null) => {
      if (settled) return
      settled = true
      resolve({
        ok: status === 'completed',
        status,
        exitCode,
        durationMs: Date.now() - startedAt,
        stdout: redactOutput(stdout),
        stderr: redactOutput(stderr),
      })
    }
    const timer = setTimeout(() => {
      stderr = appendLimited(stderr, '\nRaw shell timed out after 60000ms.')
      child.kill('SIGTERM')
    }, 60000)
    child.stdout.on('data', chunk => { stdout = appendLimited(stdout, chunk.toString('utf8')) })
    child.stderr.on('data', chunk => { stderr = appendLimited(stderr, chunk.toString('utf8')) })
    child.on('error', error => {
      clearTimeout(timer)
      stderr = appendLimited(stderr, error.message || String(error))
      finish('failed', null)
    })
    child.on('close', code => {
      clearTimeout(timer)
      finish(code === 0 ? 'completed' : 'failed', code)
    })
  })
}

function runGit(repoPath, args) {
  return new Promise(resolve => {
    const startedAt = Date.now()
    let stdout = ''
    let stderr = ''
    const child = spawn(resolveExecutable('git'), args, {
      cwd: repoPath,
      shell: false,
      windowsHide: true,
      env: { ...process.env, APEX_OPERATOR_RUNTIME: '1' },
    })
    child.stdout.on('data', chunk => { stdout = appendLimited(stdout, chunk.toString('utf8')) })
    child.stderr.on('data', chunk => { stderr = appendLimited(stderr, chunk.toString('utf8')) })
    child.on('error', error => resolve({ status: 'failed', exitCode: null, durationMs: Date.now() - startedAt, stdout: '', stderr: redactOutput(error.message || String(error)) }))
    child.on('close', code => resolve({ status: code === 0 ? 'completed' : 'failed', exitCode: code, durationMs: Date.now() - startedAt, stdout: redactOutput(stdout), stderr: redactOutput(stderr) }))
  })
}
