import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const importedDir = path.join(root, 'skills', 'imported')
const docsDir = path.join(root, 'docs')

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const fm = {}
  for (const line of m[1].split('\n')) {
    const clean = line.replace(/\r$/, '')
    const kv = clean.match(/^(\w[\w_-]*):\s*(.+)$/)
    if (kv) fm[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '')
  }
  return fm
}

const allDirs = [importedDir]
const results = []

for (const dir of allDirs) {
  if (!fs.existsSync(dir)) continue
  for (const d of fs.readdirSync(dir)) {
    const skillDir = path.join(dir, d)
    if (!fs.statSync(skillDir).isDirectory()) continue
    const fp = path.join(skillDir, 'SKILL.md')
    if (!fs.existsSync(fp)) continue
    const raw = fs.readFileSync(fp, 'utf8')
    const fm = parseFrontmatter(raw)
    const issues = []
    if (!fm.name) issues.push('MISSING name')
    if (!fm.description) issues.push('MISSING description')
    if (!fm.kind) issues.push('MISSING kind')
    if (!fm.tags) issues.push('MISSING tags')
    if (fm.name && fm.name.startsWith('skill-')) issues.push('Generic slug name: ' + fm.name)
    if (issues.length === 0) issues.push('OK')
    results.push({
      folder: d,
      name: fm.name || '(missing)',
      desc: (fm.description || '').slice(0, 60),
      kind: fm.kind || '(missing)',
      tags: fm.tags || '(missing)',
      status: issues.join(', ')
    })
  }
}

// Also scan docs/
if (fs.existsSync(docsDir)) {
  for (const f of fs.readdirSync(docsDir)) {
    if (!f.toLowerCase().endsWith('.md')) continue
    if (!f.toLowerCase().includes('skill')) continue
    const fp = path.join(docsDir, f)
    const raw = fs.readFileSync(fp, 'utf8')
    const fm = parseFrontmatter(raw)
    const issues = []
    if (!fm.name) issues.push('MISSING name')
    if (!fm.description) issues.push('MISSING description')
    if (issues.length === 0) issues.push('OK')
    results.push({
      folder: '(docs) ' + f,
      name: fm.name || '(missing)',
      desc: (fm.description || '').slice(0, 60),
      kind: fm.kind || '(missing)',
      tags: fm.tags || '(missing)',
      status: issues.join(', ')
    })
  }
}

console.log('=== SKILL.md FRONTMATTER AUDIT ===')
console.log(`Total: ${results.length}`)
console.log()
let problems = 0
for (const r of results) {
  const marker = r.status === 'OK' ? '  ✓' : '  ⚠'
  if (r.status !== 'OK') problems++
  console.log(`${marker} ${r.folder}`)
  console.log(`     Name: ${r.name}`)
  console.log(`     Desc: ${r.desc}`)
  console.log(`     Kind: ${r.kind}`)
  console.log(`     Tags: ${r.tags}`)
  console.log(`     ${r.status}`)
  console.log()
}
console.log(`=== ${problems} SKILL.MD files with issues ===`)
