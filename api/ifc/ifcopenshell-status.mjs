import { spawn } from 'node:child_process'

function runPythonIfcOpenShellCheck() {
  return new Promise((resolve) => {
    const cmd = spawn('python', ['-c', "import ifcopenshell; print(getattr(ifcopenshell, 'version', 'unknown'))"], {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        try { cmd.kill('SIGTERM') } catch {}
        resolve({ ok: false, reason: 'Timeout checking ifcopenshell (python).' })
      }
    }, 10000)

    cmd.stdout.on('data', chunk => {
      stdout += String(chunk)
    })
    cmd.stderr.on('data', chunk => {
      stderr += String(chunk)
    })
    cmd.on('error', err => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve({ ok: false, reason: err?.message || 'Failed to run python.' })
    })
    cmd.on('close', code => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (code === 0) {
        resolve({ ok: true, version: stdout.trim() || 'unknown' })
        return
      }
      resolve({
        ok: false,
        reason: (stderr || stdout || `python exited with code ${code}`).trim(),
      })
    })
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const result = await runPythonIfcOpenShellCheck()
  res.writeHead(result.ok ? 200 : 503, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    connector: 'ifcopenshell-python',
    configured: result.ok,
    available: result.ok,
    version: result.ok ? result.version : null,
    reason: result.ok ? null : result.reason,
  }))
}

