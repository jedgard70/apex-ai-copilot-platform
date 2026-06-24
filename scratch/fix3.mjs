import { readFileSync, writeFileSync } from 'fs'
let c = readFileSync('src/components/NRCompliancePanel.tsx', 'utf8')
c = c.replace('const [form, setForm] = useState({', 'const [form, setForm] = useState<any>({')
writeFileSync('src/components/NRCompliancePanel.tsx', c)
console.log('OK')
