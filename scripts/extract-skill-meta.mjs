import { readFileSync, readdirSync, statSync } from 'fs';

const folders = [
  'algorithmic-art','apex-ai-copilot','apex-global-orchestrator','brand-guidelines',
  'canvas-design','consolidate-memory','doc-coauthoring','humanize-floor-plan-source',
  'internal-comms','mcp-builder','schedule','setup-cowork','theme-factory',
  'web-artifacts-builder','apex-copilot-construction-intelligence','apex-global-orchestrator-unificada'
];

const entries = [];
for (const f of folders) {
  const p = `skills/imported/${f}/SKILL.md`;
  const raw = readFileSync(p, 'utf8');
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let name = f, desc = '';
  if (fmMatch) {
    const fm = fmMatch[1];
    const nm = fm.match(/^name:\s*(.+)$/m);
    if (nm) name = nm[1].trim().replace(/^['"]|['"]$/g, '');
    const ds = fm.match(/^description:\s*(.+)$/m);
    if (ds) desc = ds[1].trim().replace(/^['"]|['"]$/g, '').substring(0, 240);
  }
  const id = f.replace(/[_\s]+/g, '-').toLowerCase();
  const assets = [];
  const dir = `skills/imported/${f}`;
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) {
      assets.push(`${dir}/${entry.name}`.replace(/\\/g, '/'));
    }
  }
  entries.push({ id, path: p, name, desc, assets });
}

console.log(JSON.stringify(entries, null, 2));
