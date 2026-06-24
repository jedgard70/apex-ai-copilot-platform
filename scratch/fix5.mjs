import { readFileSync, writeFileSync } from 'fs'
let c = readFileSync('src/components/NRCompliancePanel.tsx', 'utf8')
c = c.replace('const [projects, setProjects] = useState<any[]>([])', 'const [projects, setProjects] = useState<any[]>([])')
c = c.replace('const [selected, setSelected] = useState(null)', 'const [selected, setSelected] = useState<any>(null)')
c = c.replace('const [documents, setDocuments] = useState(null)', 'const [documents, setDocuments] = useState<any>(null)')
c = c.replace('const [form, setForm] = useState<any>({', 'const [form, setForm] = useState<any>({')
c = c.replace('placeholder={documents', 'placeholder={documents as any')
writeFileSync('src/components/NRCompliancePanel.tsx', c)

// Fix main.tsx edit - check if the old replaces worked
c = readFileSync('src/main.tsx', 'utf8')
if (c.includes('nrOutput')) {
  console.log('main.tsx already has nrOutput')
} else {
  console.log('main.tsx MISSING nrOutput - needs manual fix')
}
console.log('OK')
