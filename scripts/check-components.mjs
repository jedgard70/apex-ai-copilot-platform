import fs from 'node:fs'
import path from 'node:path'

const componentsDir = new URL('../src/components/', import.meta.url)
const mainTsx = new URL('../src/main.tsx', import.meta.url)

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'))
const components = files.map(f => f.replace('.tsx', ''))

const mainSrc = fs.readFileSync(mainTsx, 'utf8')
const importMatches = [...mainSrc.matchAll(/from\s+['"]\.\/components\/([^'"]+)['"]/g)]
const imported = importMatches.map(m => m[1].replace(/\.tsx$/, ''))

console.log('=== COMPONENTES EXISTENTES ===')
console.log('Total:', components.length)
console.log()

const notImported = components.filter(c => !imported.includes(c))
console.log('=== NÃO IMPORTADOS EM main.tsx ===')
if (notImported.length === 0) {
  console.log('  ✓ Todos os componentes são importados.')
} else {
  notImported.forEach(c => console.log('  ⚠ ' + c))
}
console.log()

console.log('=== IMPORTADOS QUE NÃO EXISTEM ===')
const orphanImports = imported.filter(i => !components.includes(i))
if (orphanImports.length === 0) {
  console.log('  ✓ Nenhum import órfão.')
} else {
  orphanImports.forEach(i => console.log('  ⚠ ' + i))
}
console.log()

console.log('=== VERIFICANDO IMPORTS INTERNOS DE CADA COMPONENTE ===')
let totalIssues = 0
for (const c of components) {
  const fp = path.join(componentsDir.pathname, c + '.tsx')
  if (!fs.existsSync(fp)) continue
  const content = fs.readFileSync(fp, 'utf8')
  const localImports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)]
  for (const m of localImports) {
    const target = m[1]
    if (target.startsWith('./') || target.startsWith('../')) {
      const resolved = path.resolve(componentsDir.pathname, target)
      if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.ts') && !fs.existsSync(resolved + '.tsx') && !fs.existsSync(resolved + '/index.ts') && !fs.existsSync(resolved + '/index.tsx')) {
        console.log('  ⚠ ' + c + ' -> ' + target + ' (NOT FOUND at ' + resolved + ')')
        totalIssues++
      }
    }
  }
}
if (totalIssues === 0) {
  console.log('  ✓ Todos os imports locais nos componentes resolvem corretamente.')
}
