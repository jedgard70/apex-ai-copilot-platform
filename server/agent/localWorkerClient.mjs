/**
 * Apex AI Copilot — Local Worker Client (H6.0)
 * Bridge between production backend and the Apex Local Worker running on the user's PC.
 * Reads LOCAL_WORKER_URL + LOCAL_WORKER_TOKEN from ENV.
 * Never logs or returns the token.
 * H6.0: risk-tiered actions — READ/VALIDATE execute directly; WRITE/DANGEROUS require confirmed:true.
 */

import { spawn } from 'node:child_process'

const TIMEOUT_MS = 8000
const DIRECT_TIMEOUT_MS = 120000
const MAX_OUTPUT = 10000

// READ — execute without confirmation
const READ_ACTIONS = new Set([
  'system.info', 'node.version', 'npm.version', 'git.version',
  'project.git_status', 'project.git_log', 'project.git_log10',
  'project.git_diff', 'project.git_diff_stat', 'project.git_branch', 'project.git_remote',
  'npm.list', 'npm.outdated', 'npm.audit',
  // System diagnostics (read-only)
  'system.diag_full', 'system.diag_cpu_ram', 'system.diag_disk',
  'system.diag_services', 'system.diag_startup', 'system.temp_audit',
  // Revit info (read-only)
  'revit.info', 'revit.addin_list',
])

// VALIDATE — execute directly (may be slow)
const VALIDATE_ACTIONS = new Set([
  'project.build_check', 'npm.test', 'npm.lint',
  'project.validate_h44', 'project.validate_h5', 'project.validate_h6',
  'project.validate_h7', 'project.validate_final',
])

// WRITE — require confirmed:true
const WRITE_ACTIONS = new Set([
  'project.git_add', 'project.git_commit', 'project.git_push', 'project.git_push_u',
  'project.git_fetch', 'project.git_stash', 'project.git_stash_pop',
  'npm.install', 'project.raw_shell', 'mcp.run_stdio',
  // System maintenance (write, needs confirmation)
  'system.temp_clean', 'system.startup_disable',
  // Revit execution (write, needs confirmation)
  'revit.run_pyrevit',
])

// DANGEROUS — require confirmed:true + rollbackAcknowledged:true
const DANGEROUS_ACTIONS = new Set([
  'project.git_push_force',
])

const ALL_ALLOWED_ACTIONS = new Set([
  ...READ_ACTIONS, ...VALIDATE_ACTIONS, ...WRITE_ACTIONS, ...DANGEROUS_ACTIONS,
])

function workerConfig() {
  const url = (process.env.LOCAL_WORKER_URL || process.env.Local_Worker_URL || '').trim()
  const token = (process.env.LOCAL_WORKER_TOKEN || process.env.Local_Worker_TOKEN || '').trim()
  return { url, token, configured: Boolean(url && token) }
}

function makeMissingConfigResult() {
  return {
    ok: false,
    configured: false,
    reachable: false,
    status: 'degraded',
    reason: 'Local Worker não configurado; fallback automático local será usado quando possível.',
    secretsExposed: false,
  }
}

function appendLimited(current, chunk) {
  const next = current + chunk
  if (next.length <= MAX_OUTPUT) return next
  return next.slice(0, MAX_OUTPUT) + '\n[output truncated]'
}

function shellQuote(value = '') {
  const text = String(value || '')
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text
  return `"${text.replace(/"/g, '\\"')}"`
}

function commandForAction(action, params = {}) {
  const files = Array.isArray(params.files) ? params.files.filter(Boolean).map(item => shellQuote(item)).join(' ') : ''
  const message = params.message ? shellQuote(params.message) : ''
  const branch = params.branch ? shellQuote(params.branch) : ''
  const pkg = params.package ? shellQuote(params.package) : ''

  switch (action) {
    case 'system.info': return 'node -v && npm -v'
    case 'node.version': return 'node -v'
    case 'npm.version': return 'npm -v'
    case 'git.version': return 'git --version'
    case 'project.git_status': return 'git --no-pager status --short'
    case 'project.git_log': return 'git --no-pager log --oneline -5'
    case 'project.git_log10': return 'git --no-pager log --oneline -10'
    case 'project.git_diff': return 'git --no-pager diff --name-only'
    case 'project.git_diff_stat': return 'git --no-pager diff --stat'
    case 'project.git_branch': return 'git --no-pager branch --show-current'
    case 'project.git_remote': return 'git --no-pager remote -v'
    case 'project.git_add': return files ? `git add ${files}` : 'git add -A'
    case 'project.git_commit': return message ? `git commit -m ${message}` : 'git commit -m "chore: apex automated commit"'
    case 'project.git_push': return 'git push'
    case 'project.git_push_u': return branch ? `git push -u origin ${branch}` : 'git push -u origin HEAD'
    case 'project.git_fetch': return 'git fetch origin'
    case 'project.git_stash': return 'git stash'
    case 'project.git_stash_pop': return 'git stash pop'
    case 'project.git_push_force': return branch ? `git push --force-with-lease origin ${branch}` : 'git push --force-with-lease'
    case 'project.build_check': return 'npm run build'
    case 'npm.test': return 'npm test'
    case 'npm.lint': return 'npm run lint'
    case 'npm.install': return pkg ? `npm install ${pkg}` : 'npm install'
    case 'npm.list': return 'npm list --depth=0'
    case 'npm.outdated': return 'npm outdated'
    case 'npm.audit': return 'npm audit --audit-level=high'
    case 'project.validate_h44': return 'npm run validate:cp15x-h44'
    case 'project.validate_h5': return 'npm run validate:cp15x-h5'
    case 'project.validate_h6': return 'node --check server.mjs'
    case 'system.diag_full': return 'powershell -ExecutionPolicy Bypass -Command "Write-Host === SISTEMA ===; $os = Get-CimInstance Win32_OperatingSystem; $uptime = (Get-Date) - $os.LastBootUpTime; Write-Host OS: $($os.Caption); Write-Host Uptime: $($uptime.Days)d $($uptime.Hours)h; Get-CimInstance Win32_Processor | Select-Object -First 1 | %% { Write-Host CPU: $($_.Name) }; $totalGB = [math]::Round($os.TotalVisibleMemorySize/1MB,1); $freeGB = [math]::Round($os.FreePhysicalMemory/1MB,1); Write-Host RAM: $totalGB GB total, $([math]::Round($totalGB-$freeGB,1)) GB em uso"'
    case 'system.diag_cpu_ram': return 'powershell -ExecutionPolicy Bypass -Command "$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1; $cpuLoad = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average; Write-Host CPU: $($cpu.Name) - $($cpu.NumberOfCores) nucleos - $cpuLoad% uso; $os = Get-CimInstance Win32_OperatingSystem; $totalGB = [math]::Round($os.TotalVisibleMemorySize/1MB,1); $freeGB = [math]::Round($os.FreePhysicalMemory/1MB,1); Write-Host RAM: $totalGB GB total, $([math]::Round($totalGB-$freeGB,1)) GB em uso ($([math]::Round(($totalGB-$freeGB)/$totalGB*100,1))%); Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 | %% { $mb=[math]::Round($_.WorkingSet64/1MB,1); Write-Host ($_.ProcessName + \": \" + $mb + \" MB\") }"'
    case 'system.diag_disk': return 'powershell -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_LogicalDisk -Filter DriveType=3 | %% { $t=[math]::Round($_.Size/1GB,1); $f=[math]::Round($_.FreeSpace/1GB,1); Write-Host ($_.DeviceID + \" \" + $t + \" GB total, \" + $([math]::Round($t-$f,1)) + \" GB usados, \" + $f + \" GB livres\") }"'
    case 'system.diag_services': return 'powershell -ExecutionPolicy Bypass -Command "@(\"WSearch\",\"wuauserv\",\"Spooler\",\"MpsSvc\",\"Dnscache\",\"DHCP\",\"Winmgmt\") | % { $s = Get-Service $_ -ErrorAction SilentlyContinue; if ($s) { Write-Host ($_.PadRight(20) + $s.Status) } }"'
    case 'system.diag_startup': return 'powershell -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_StartupCommand | Sort Name | %% { Write-Host ($_.Name + \" - \" + $_.Command) }"'
    case 'system.temp_audit': return 'powershell -ExecutionPolicy Bypass -Command "Write-Host TEMP:; @(\"$env:TEMP\",\"$env:WINDIR\\Temp\") | % { if (Test-Path $_) { $s=[math]::Round((Get-ChildItem $_ -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum/1MB,1); $c=(Get-ChildItem $_ -Recurse -File -ErrorAction SilentlyContinue).Count; Write-Host ($_ + \": \" + $c + \" arquivos, \" + $s + \" MB\") } }"'
    case 'system.temp_clean': return 'powershell -ExecutionPolicy Bypass -Command "Remove-Item \"$env:TEMP\\*\" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item \"$env:WINDIR\\Temp\\*\" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host Temporarios limpos."'
    case 'system.startup_disable': return params.name ? `powershell -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_StartupCommand | Where-Object { \$_.Name -like '*${params.name}*' } | %% { Remove-ItemProperty -Path 'Registry::\\HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name \$_.Name -ErrorAction SilentlyContinue; Write-Host 'Removido: ' + \$_.Name }"` : ''
    case 'revit.info': return 'powershell -ExecutionPolicy Bypass -Command "Get-ChildItem \"C:\\Program Files\\Autodesk\\Revit *\\Revit.exe\" -ErrorAction SilentlyContinue | %% { $v=[System.Diagnostics.FileVersionInfo]::GetVersionInfo($_.FullName); Write-Host ($_.FullName + \" v\" + $v.FileVersion) }"'
    case 'revit.addin_list': return 'powershell -ExecutionPolicy Bypass -Command "Get-ChildItem \"$env:APPDATA\\Autodesk\\Revit\\Addins\" -Recurse -Filter *.addin -ErrorAction SilentlyContinue | %% { Write-Host $_.Name }"'
    case 'revit.run_pyrevit': return ''  // Requires params.script, needs temp file - use worker
    case 'project.raw_shell': return String(params.command || '').trim()
    default: return ''
  }
}

async function runDirectActionFallback(action, params = {}) {
  const command = commandForAction(action, params)
  if (!command) {
    return {
      ok: false,
      action,
      configured: false,
      reachable: false,
      reason: `Ação "${action}" sem fallback local automático implementado.`,
      secretsExposed: false,
    }
  }

  const cwd = process.cwd()
  return await new Promise(resolve => {
    let stdout = ''
    let stderr = ''
    let exitCode = null
    let settled = false
    let timedOut = false
    const startedAt = Date.now()

    const child = spawn(command, [], {
      cwd,
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    })

    const finish = status => {
      if (settled) return
      settled = true
      resolve({
        ok: status === 'completed',
        partial: false,
        action,
        configured: false,
        reachable: true,
        executedVia: 'direct_local_fallback',
        label: action,
        stdout: String(stdout || '').slice(0, 4000),
        stderr: String(stderr || '').slice(0, 1000),
        exitCode: typeof exitCode === 'number' ? exitCode : -1,
        durationMs: Date.now() - startedAt,
        results: [],
        reason: status === 'completed' ? '' : (stderr || `Fallback command failed for ${action}`),
        secretsExposed: false,
      })
    }

    const timer = setTimeout(() => {
      timedOut = true
      stderr = appendLimited(stderr, `\nTimeout após ${DIRECT_TIMEOUT_MS / 1000}s.`)
      child.kill('SIGTERM')
    }, DIRECT_TIMEOUT_MS)

    child.stdout.on('data', chunk => {
      stdout = appendLimited(stdout, String(chunk))
    })
    child.stderr.on('data', chunk => {
      stderr = appendLimited(stderr, String(chunk))
    })
    child.on('error', err => {
      clearTimeout(timer)
      stderr = appendLimited(stderr, err?.message || String(err))
      finish('failed')
    })
    child.on('close', code => {
      clearTimeout(timer)
      exitCode = code
      finish(timedOut ? 'timeout' : code === 0 ? 'completed' : 'failed')
    })
  })
}

async function fetchWorker(path, method, body = null) {
  const { url, token, configured } = workerConfig()
  if (!configured) return { ok: false, configMissing: true }

  if (!globalThis.fetch) {
    return { ok: false, error: 'fetch não disponível neste ambiente' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }
    if (body) options.body = JSON.stringify(body)

    const response = await fetch(`${url}${path}`, options).finally(() => clearTimeout(timer))
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch (err) {
    clearTimeout(timer)
    const isTimeout = err?.name === 'AbortError'
    return {
      ok: false,
      error: isTimeout
        ? `Timeout após ${TIMEOUT_MS / 1000}s — worker pode estar offline ou inacessível.`
        : (err?.message || 'Erro de rede ao acessar Local Worker.'),
    }
  }
}

export function isReadAction(action) { return READ_ACTIONS.has(action) }
export function isValidateAction(action) { return VALIDATE_ACTIONS.has(action) }
export function isWriteAction(action) { return WRITE_ACTIONS.has(action) }
export function isDangerousAction(action) { return DANGEROUS_ACTIONS.has(action) }
export function isAllowedAction(action) { return ALL_ALLOWED_ACTIONS.has(action) }

// Legacy aliases
export function isLightAction(action) { return READ_ACTIONS.has(action) }
export function isHeavyAction(action) { return VALIDATE_ACTIONS.has(action) }

export async function readLocalWorkerHealth() {
  const { configured } = workerConfig()
  if (!configured) return makeMissingConfigResult()

  const { ok, data, error, status } = await fetchWorker('/health', 'GET')
  if (error) {
    return {
      ok: false,
      configured: true,
      reachable: false,
      status: 'unavailable',
      reason: error,
      secretsExposed: false,
    }
  }

  if (!ok) {
    return {
      ok: false,
      configured: true,
      reachable: true,
      status: 'partial',
      reason: `Worker respondeu HTTP ${status} — verificar token e configuração.`,
      secretsExposed: false,
    }
  }

  return {
    ok: true,
    configured: true,
    reachable: true,
    status: 'available',
    checkpoint: data.checkpoint || 'unknown',
    projectPath: data.projectPath || '',
    platform: data.platform || '',
    discoveredTools: data.discoveredTools || {},
    allowedActions: Array.isArray(data.allowedActions) ? data.allowedActions : [],
    secretsExposed: false,
  }
}

export async function runLocalWorkerAction(action, { confirmed = false, rollbackAcknowledged = false, params = {} } = {}) {
  if (!isAllowedAction(action)) {
    return {
      ok: false,
      action,
      reason: `Ação "${action}" não está no catálogo H6.0 permitido.`,
      secretsExposed: false,
    }
  }

  const { configured } = workerConfig()
  if (!configured) {
    return runDirectActionFallback(action, params)
  }

  const body = { action, confirmed, rollbackAcknowledged, params }
  const { ok, data, error, status } = await fetchWorker('/run', 'POST', body)

  if (error) {
    return {
      ok: false,
      action,
      configured: true,
      reachable: false,
      reason: error,
      secretsExposed: false,
    }
  }

  if (!ok) {
    return {
      ok: false,
      action,
      configured: true,
      reachable: true,
      reason: `Worker respondeu HTTP ${status}.`,
      unavailable: data?.unavailable || data?.blocked || false,
      secretsExposed: false,
    }
  }

  return {
    ok: data?.ok ?? false,
    partial: data?.partial ?? false,
    action,
    configured: true,
    reachable: true,
    label: data?.label || action,
    stdout: String(data?.stdout || '').slice(0, 4000),
    stderr: String(data?.stderr || '').slice(0, 1000),
    exitCode: data?.exitCode ?? -1,
    durationMs: data?.durationMs ?? 0,
    results: data?.results || [],
    secretsExposed: false,
  }
}
