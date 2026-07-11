import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env.local');
const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
for (const line of lines) {
  if (!line || line.trim().startsWith('#')) continue;
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  const [, k, v] = m;
  if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, '');
}

const mod = await import('../server/api/copilot/provider-status.mjs');
const req = { method: 'GET', headers: {} };
const res = {
  _status: null,
  status(c) { this._status = c; return this },
  json(b) {
    console.log(`\n=== PROVIDER STATUS (${b.checkedAt}) ===\n`);
    for (const p of b.providers) {
      const icon = p.status === 'ok' ? '✅' : p.status === 'warning' ? '⚠️' : p.status === 'error' ? '❌' : '⚪';
      console.log(`${icon} ${p.id.padEnd(12)} ${p.status.padEnd(14)} ${(p.message||'').substring(0,80)}`);
    }
    if (b.summary) {
      console.log(`\n--- Summary: ${b.summary.healthy} healthy, ${b.summary.warnings} warnings, ${b.summary.needsAttention} attention, ${b.summary.unconfigured} unconfigured`);
    }
  },
  setHeader() {},
};
mod.default(req, res);
