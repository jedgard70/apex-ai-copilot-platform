import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env (not .env.local)
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');
const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (!process.env[key]) process.env[key] = val.replace(/^["']|["']$/g, '');
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('❌ GEMINI_API_KEY não encontrado no .env'); process.exit(1); }
console.log('📌 Chave do .env (últimos 10 chars):', apiKey.slice(-10));
console.log('');

// Test 1: x-goog-api-key header (provider-status method)
console.log('=== Teste 1: x-goog-api-key header ===');
try {
    const r1 = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=5', {
        headers: { 'x-goog-api-key': apiKey },
    });
    console.log('Status:', r1.status, r1.statusText);
    const t1 = await r1.text();
    console.log('Resposta (primeiros 300 chars):', t1.slice(0, 300));
} catch (e) {
    console.log('Erro de rede:', e.message);
}
console.log('');

// Test 2: ?key= query param (alternative method)
console.log('=== Teste 2: ?key= query param ===');
try {
    const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=5&key=${apiKey}`);
    console.log('Status:', r2.status, r2.statusText);
    const t2 = await r2.text();
    console.log('Resposta (primeiros 300 chars):', t2.slice(0, 300));
} catch (e) {
    console.log('Erro de rede:', e.message);
}
