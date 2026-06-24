import { readFileSync, writeFileSync } from 'fs'

// Fix NR panel
let c = readFileSync('src/components/NRCompliancePanel.tsx', 'utf8')
c = c.replace('async function generateDocs(id) {', 'async function generateDocs(id: string) {')
c = c.replace('setForm(p =>', 'setForm((p: any) =>')
c = c.replace('p.nrs.filter(x =>', "p.nrs.filter((x: string) =>")
c = c.replace('.filter(x => n.id', ".filter((x: string) => x !== n.id)")
c = c.replace(`placeholder="Endereço" style={inp} style={{ gridColumn: '1 / -1' }}`, `placeholder="Endereço" style={{...inp, gridColumn: '1 / -1'}}`)
writeFileSync('src/components/NRCompliancePanel.tsx', c)

// Fix American Permits
c = readFileSync('src/components/AmericanPermitsPanel.tsx', 'utf8')
c = c.replace('checklist.checklist?.map((c, i)', "checklist.checklist?.map((c: any, i: number)")
writeFileSync('src/components/AmericanPermitsPanel.tsx', c)

console.log('OK')
