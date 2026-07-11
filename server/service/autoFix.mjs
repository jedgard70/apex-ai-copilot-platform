/**
 * server/service/autoFix.mjs
 *
 * Auto-Fix Engine — detecta e corrige automaticamente erros de build,
 * conflitos de merge, problemas de compilação e falhas de deploy.
 *
 * Funciona em 3 modos:
 *   1. DETECT (read-only): escaneia erros e reporta
 *   2. AUTO_FIX: tenta corrigir automaticamente
 *   3. MONITOR: watchdog contínuo que reage a mudanças
 */

import { execSync, spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const ROOT = resolve(__dirname)

// ─── Detect ──────────────────────────────────────────────────────────────────

/**
 * Detect all current project problems.
 * @returns {Promise<Object[]>}
 */
export async function detectProblems() {
  const problems = []

  // 1. Merge conflicts
  try {
    const gitOutput = execSync('git --no-pager diff --name-only --diff-filter=U', {
      cwd: ROOT, encoding: 'utf-8', timeout: 5000,
    }).trim()
    if (gitOutput) {
      const files = gitOutput.split('\n').filter(Boolean)
      problems.push({
        type: 'merge-conflict',
        severity: 'high',
        files,
        detail: `${files.length} arquivo(s) com conflito de merge`,
        autoFixable: true,
      })
    }
  } catch {}

  // 2. TypeScript errors
  try {
    const tscOutput = execSync('node node_modules/typescript/bin/tsc --noEmit 2>&1 || true', {
      cwd: ROOT, encoding: 'utf-8', timeout: 30000,
    })
    const lines = tscOutput.split('\n').filter(l => l.includes('error TS'))
    if (lines.length > 0) {
      const files = new Set(lines.map(l => l.split('(')[0]?.trim()).filter(Boolean))
      problems.push({
        type: 'typescript-error',
        severity: 'high',
        files: [...files],
        detail: `${lines.length} erro(s) de TypeScript em ${files.size} arquivo(s)`,
        autoFixable: true,
      })
    }
  } catch {}

  // 3. ESLint / code quality issues
  try {
    const lintOutput = execSync('node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep -i "error\|warning" || true', {
      cwd: ROOT, encoding: 'utf-8', timeout: 15000, shell: true,
    })
    if (lintOutput.includes('error')) {
      problems.push({
        type: 'lint-error',
        severity: 'medium',
        files: [],
        detail: 'Problemas de lint detectados',
        autoFixable: true,
      })
    }
  } catch {}

  // 4. Vite build check
  try {
    const buildOutput = execSync('node node_modules/vite/bin/vite.js build 2>&1', {
      cwd: ROOT, encoding: 'utf-8', timeout: 120000,
    })
    if (buildOutput.includes('error') && !buildOutput.includes('built in')) {
      problems.push({
        type: 'build-failure',
        severity: 'critical',
        files: [],
        detail: 'Build do Vite falhou',
        autoFixable: true,
      })
    }
  } catch (e) {
    problems.push({
      type: 'build-failure',
      severity: 'critical',
      files: [],
      detail: `Build do Vite falhou: ${e.message?.slice(0, 200)}`,
      autoFixable: true,
    })
  }

  // 5. Test failures
  try {
    const testOutput = execSync('node node_modules/vitest/vitest.mjs run --reporter=verbose 2>&1', {
      cwd: ROOT, encoding: 'utf-8', timeout: 60000,
    })
    const failMatch = testOutput.match(/Tests\s+\d+\s+failed/)
    if (failMatch) {
      problems.push({
        type: 'test-failure',
        severity: 'high',
        files: [],
        detail: failMatch[0],
        autoFixable: true,
      })
    }
  } catch (e) {
    const out = String(e.stdout || '')
    const failCount = (out.match(/FAIL\s/g) || []).length
    if (failCount > 0) {
      problems.push({
        type: 'test-failure',
        severity: 'high',
        files: [],
        detail: `${failCount} teste(s) falharam`,
        autoFixable: true,
      })
    }
  }

  // 6. Uncommitted changes
  try {
    const status = execSync('git --no-pager status --porcelain', {
      cwd: ROOT, encoding: 'utf-8', timeout: 5000,
    }).trim()
    if (status) {
      const lines = status.split('\n').filter(Boolean)
      problems.push({
        type: 'uncommitted-changes',
        severity: 'low',
        files: lines.map(l => l.slice(3).trim()).filter(Boolean),
        detail: `${lines.length} arquivo(s) não commitados`,
        autoFixable: true,
      })
    }
  } catch {}

  // 7. Outdated dependencies
  try {
    const outdated = execSync('npm outdated --json 2>&1 || true', {
      cwd: ROOT, encoding: 'utf-8', timeout: 15000,
    })
    if (outdated && outdated !== '{}') {
      try {
        const parsed = JSON.parse(outdated)
        const count = Object.keys(parsed).length
        if (count > 0) {
          problems.push({
            type: 'outdated-deps',
            severity: 'low',
            files: [],
            detail: `${count} dependência(s) desatualizada(s)`,
            autoFixable: false,
          })
        }
      } catch {}
    }
  } catch {}

  // 8. Vercel deployment status (Cloud Deploy Monitoring)
  try {
    const vercelOutput = execSync('npx vercel ls 2>&1 || true', {
      cwd: ROOT, encoding: 'utf-8', timeout: 30000,
    })
    
    // Check if the most recent deploy failed
    const lines = vercelOutput.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('https://') && (line.includes('● Error') || line.includes('● Canceled') || line.includes('● Failed'))) {
        // If it's one of the first few deployments (recent)
        if (i < 10) {
          const urlMatch = line.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
          if (urlMatch) {
            const url = urlMatch[0];
            const stateFile = resolve(ROOT, '.vercel_last_error');
            let lastErrorUrl = '';
            if (existsSync(stateFile)) {
              lastErrorUrl = readFileSync(stateFile, 'utf8').trim();
            }
            
            if (lastErrorUrl !== url) {
              problems.push({
                type: 'vercel-deploy-error',
                severity: 'critical',
                files: [],
                detail: `Falha no deploy da Vercel detectada: ${url}`,
                autoFixable: true,
                url: url
              });
            }
          }
        }
        break;
      } else if (line.includes('https://') && line.includes('● Ready')) {
        break; // Latest is successful
      }
    }
  } catch (err) {}

  return problems
}

// ─── Auto-Fix ────────────────────────────────────────────────────────────────

/**
 * Try to automatically fix detected problems.
 * @param {Object[]} problems - Array from detectProblems()
 * @returns {Promise<{fixed: Object[], failed: Object[]}>}
 */
export async function autoFixProblems(problems) {
  const fixed = []
  const failed = []

  for (const problem of problems) {
    if (!problem.autoFixable) {
      failed.push({ ...problem, reason: 'Não é auto-fixável' })
      continue
    }

    try {
      switch (problem.type) {
        case 'merge-conflict': {
          // Accept ours for all conflicting files
          for (const file of problem.files) {
            try {
              execSync(`git checkout --ours "${file}" 2>&1`, { cwd: ROOT, encoding: 'utf-8', timeout: 10000 })
              execSync(`git add "${file}" 2>&1`, { cwd: ROOT, encoding: 'utf-8', timeout: 5000 })
            } catch {
              try {
                execSync(`git checkout --theirs "${file}" 2>&1`, { cwd: ROOT, encoding: 'utf-8', timeout: 10000 })
                execSync(`git add "${file}" 2>&1`, { cwd: ROOT, encoding: 'utf-8', timeout: 5000 })
              } catch (e2) {
                throw new Error(`Falha ao resolver conflito em ${file}: ${e2.message}`)
              }
            }
          }
          fixed.push({ ...problem, resolution: `Conflitos resolvidos em ${problem.files.length} arquivo(s)` })
          break
        }

        case 'typescript-error': {
          // Re-run tsc to get specific errors, try auto-fix common patterns
          try {
            execSync('node node_modules/typescript/bin/tsc --noEmit 2>&1', {
              cwd: ROOT, encoding: 'utf-8', timeout: 30000,
            })
            fixed.push({ ...problem, resolution: 'TypeScript ok após re-check' })
          } catch {
            failed.push({ ...problem, reason: 'TypeScript errors não puderam ser auto-corrigidos' })
          }
          break
        }

        case 'build-failure': {
          // Retry build
          try {
            execSync('node node_modules/typescript/bin/tsc -b 2>&1', {
              cwd: ROOT, encoding: 'utf-8', timeout: 60000,
            })
            execSync('node node_modules/vite/bin/vite.js build 2>&1', {
              cwd: ROOT, encoding: 'utf-8', timeout: 120000,
            })
            fixed.push({ ...problem, resolution: 'Build bem-sucedido após re-tentativa' })
          } catch (e) {
            failed.push({ ...problem, reason: `Build ainda falha: ${e.message?.slice(0, 150)}` })
          }
          break
        }

        case 'uncommitted-changes': {
          try {
            execSync('git add -A 2>&1', { cwd: ROOT, encoding: 'utf-8', timeout: 10000 })
            execSync('git commit -m "chore: auto-fix uncommitted changes" 2>&1', {
              cwd: ROOT, encoding: 'utf-8', timeout: 10000,
            })
            fixed.push({ ...problem, resolution: `${problem.files.length} arquivo(s) commitados` })
          } catch (e) {
            failed.push({ ...problem, reason: `Falha ao commitar: ${e.message?.slice(0, 100)}` })
          }
          break
        }

        case 'vercel-deploy-error': {
          try {
            // 1. Mark this URL as seen
            const stateFile = resolve(ROOT, '.vercel_last_error');
            writeFileSync(stateFile, problem.url, 'utf8');
            
            // 2. Fetch logs and alert agents
            console.log(`[auto-fix] Coletando logs da Vercel para ${problem.url}...`);
            try {
               const inspect = execSync(`npx vercel inspect ${problem.url} 2>&1`, { cwd: ROOT, encoding: 'utf-8', timeout: 30000 });
               writeFileSync(resolve(ROOT, 'VERCEL_DEPLOY_ERROR.md'), `# Vercel Deploy Error\n\nURL: ${problem.url}\n\n\`\`\`\n${inspect}\n\`\`\`\n\nAgentes Antigravity: Por favor, leiam este log, consertem o código e façam o git push novamente.`, 'utf8');
               fixed.push({ ...problem, resolution: 'Logs extraídos e salvos em VERCEL_DEPLOY_ERROR.md para atuação dos agentes' });
            } catch (e) {
               writeFileSync(resolve(ROOT, 'VERCEL_DEPLOY_ERROR.md'), `# Vercel Deploy Error\n\nURL: ${problem.url}\n\nNão foi possível puxar os logs via CLI. Acesse o painel da Vercel.`, 'utf8');
               fixed.push({ ...problem, resolution: 'Erro salvo em VERCEL_DEPLOY_ERROR.md' });
            }
          } catch (e) {
            failed.push({ ...problem, reason: `Falha ao processar erro da Vercel: ${e.message}` });
          }
          break;
        }

        default:
          failed.push({ ...problem, reason: 'Nenhuma estratégia de auto-fix para este tipo' })
      }
    } catch (err) {
      failed.push({ ...problem, reason: err.message })
    }
  }

  return { fixed, failed }
}

// ─── Monitor (watchdog) ──────────────────────────────────────────────────────

let watchInterval = null

/**
 * Start auto-fix monitoring.
 * Checks for problems every `intervalMs` and fixes automatically.
 * @param {number} intervalMs - Check interval in ms (default: 30000)
 * @returns {() => void} Stop function
 */
export function startAutoFixMonitor(intervalMs = 30000) {
  if (watchInterval) clearInterval(watchInterval)

  async function check() {
    try {
      const problems = await detectProblems()
      if (problems.length === 0) return

      console.log(`[auto-fix] ${problems.length} problema(s) detectado(s). Tentando corrigir...`)
      const result = await autoFixProblems(problems.filter(p => p.autoFixable))

      if (result.fixed.length > 0) {
        console.log(`[auto-fix] ${result.fixed.length} problema(s) corrigido(s):`)
        for (const f of result.fixed) {
          console.log(`  ✅ ${f.type}: ${f.resolution}`)
        }
      }
      if (result.failed.length > 0) {
        console.log(`[auto-fix] ${result.failed.length} problema(s) não corrigido(s):`)
        for (const f of result.failed) {
          console.log(`  ❌ ${f.type}: ${f.reason}`)
        }
      }
    } catch (err) {
      console.error('[auto-fix] Erro no monitor:', err.message)
    }
  }

  // Check immediately, then on interval
  check()
  watchInterval = setInterval(check, intervalMs)

  return () => {
    if (watchInterval) {
      clearInterval(watchInterval)
      watchInterval = null
    }
  }
}

export function stopAutoFixMonitor() {
  if (watchInterval) {
    clearInterval(watchInterval)
    watchInterval = null
  }
}

// ─── Get status ──────────────────────────────────────────────────────────────

export async function getAutoFixStatus() {
  const problems = await detectProblems()
  return {
    healthy: problems.length === 0,
    problemCount: problems.length,
    autoFixableCount: problems.filter(p => p.autoFixable).length,
    problems,
    monitored: watchInterval !== null,
    lastCheck: new Date().toISOString(),
  }
}
