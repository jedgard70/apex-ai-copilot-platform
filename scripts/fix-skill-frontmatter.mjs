import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dirs = [
  path.join(root, 'skills', 'imported'),
  path.join(root, 'docs'),
]

let fixed = 0
let skipped = 0
let created = 0

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue

  const entries = fs.readdirSync(dir)
  for (const entry of entries) {
    let fp
    let folderName = entry.replace(/\.md$/i, '')
    if (entry.endsWith('.md')) {
      fp = path.join(dir, entry)
      if (!fs.statSync(fp).isFile()) continue
    } else {
      const skillDir = path.join(dir, entry)
      if (!fs.statSync(skillDir).isDirectory()) continue
      fp = path.join(skillDir, 'SKILL.md')
      folderName = entry
      if (!fs.existsSync(fp)) continue
    }

    const raw = fs.readFileSync(fp, 'utf8')

    // Check if it has frontmatter
    const hasFM = /^---\r?\n/.test(raw)

    if (!hasFM) {
      // Create frontmatter from scratch
      const title = folderName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const fm = `---
name: ${folderName}
title: ${title}
description: ${title} skill for the Apex AI Copilot platform.
kind: runtime-skill
tags: []
---

`
      fs.writeFileSync(fp, fm + raw, 'utf8')
      console.log(`✓ ${folderName}: frontmatter CREATED`)
      created++
      continue
    }

    // Has frontmatter — parse just enough to find name/title/kind
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!fmMatch) continue

    const fmBlock = fmMatch[1]
    const lines = fmBlock.split('\n').map(l => l.replace(/\r$/, ''))

    // Detect keys (handle simple key: value and key: [value] and key: multi-line)
    const keys = new Set()
    for (const line of lines) {
      const kv = line.match(/^(\w[\w_-]*):\s*/)
      if (kv) keys.add(kv[1])
    }

    const hasName = keys.has('name')
    const hasTitle = keys.has('title')
    const hasKind = keys.has('kind')

    if (hasKind && hasTitle) {
      skipped++
      continue
    }

    // Find the name value
    let nameVal = null
    for (const line of lines) {
      const nv = line.match(/^name:\s*(.+)$/)
      if (nv) nameVal = nv[1].replace(/^['"]|['"]$/g, '')
    }

    // Rebuild frontmatter with additions
    const newLines = []
    let kindAdded = false
    let titleAdded = false

    for (const line of lines) {
      const isName = line.startsWith('name:')
      const isTitle = line.startsWith('title:')
      const isKind = line.startsWith('kind:')

      if (isName) {
        newLines.push(line)
        if (!hasTitle && nameVal) {
          newLines.push(`title: ${nameVal}`)
          titleAdded = true
        }
        continue
      }
      if (isTitle) {
        newLines.push(line)
        titleAdded = true
        continue
      }
      if (isKind) {
        newLines.push(line)
        kindAdded = true
        continue
      }
      newLines.push(line)
    }

    // If kind still missing, append at end (before closing ---)
    if (!kindAdded) {
      newLines.push('kind: runtime-skill')
    }

    const newBody = newLines.join('\n')
    const newContent = raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newBody}\n---`)
    fs.writeFileSync(fp, newContent, 'utf8')
    console.log(`✓ ${folderName}: ${!hasTitle && titleAdded ? 'title+kind' : 'kind'} added`)
    fixed++
  }
}

console.log(`\n=== Done: ${created} created, ${fixed} fixed, ${skipped} already OK ===`)
