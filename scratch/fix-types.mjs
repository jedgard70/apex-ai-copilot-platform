import { readFileSync, writeFileSync } from 'fs'

// Fix AccountingPanel
let c = readFileSync('src/components/AccountingPanel.tsx', 'utf8')
c = c.replace('{report.formularios?.map(f =>', '{report.formularios?.map((f: any) =>')
writeFileSync('src/components/AccountingPanel.tsx', c)

// Fix AmericanPermitsPanel
c = readFileSync('src/components/AmericanPermitsPanel.tsx', 'utf8')
c = c.replace('export function AmericanPermitsPanel({ onClear })', 'export function AmericanPermitsPanel({ onClear }: { onClear: () => void })')
c = c.replace("import { useState } from 'react'", "import { useState, useEffect } from 'react'")
c = c.replace('useState(() => { fetchProjects() }, [])', 'useEffect(() => { fetchProjects() }, [])')
c = c.replace('async function loadChecklist(id) {', 'async function loadChecklist(id: string) {')
writeFileSync('src/components/AmericanPermitsPanel.tsx', c)

console.log('OK')
