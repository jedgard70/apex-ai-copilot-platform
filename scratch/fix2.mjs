import { readFileSync, writeFileSync } from 'fs'
let c = readFileSync('src/components/AmericanPermitsPanel.tsx', 'utf8')
c = c.replace('const [projects, setProjects] = useState([])', 'const [projects, setProjects] = useState<any[]>([])')
c = c.replace('const [selected, setSelected] = useState(null)', 'const [selected, setSelected] = useState<string | null>(null)')
c = c.replace('const [checklist, setChecklist] = useState(null)', 'const [checklist, setChecklist] = useState<any>(null)')
c = c.replace('const [loading, setLoading] = useState(false)', 'const [loading, setLoading] = useState<boolean>(false)')
c = c.replace('const [showForm, setShowForm] = useState(false)', 'const [showForm, setShowForm] = useState<boolean>(false)')
writeFileSync('src/components/AmericanPermitsPanel.tsx', c)
console.log('OK')
