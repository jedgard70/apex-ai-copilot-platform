import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const key = process.env.GEMINI_API_KEY;

async function test() {
  console.log('=== Test 1: Basic generateContent ===');
  const res1 = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hello in 3 words' }] }] })
  });
  const d1 = await res1.json();
  console.log('Status:', res1.status);
  if (res1.ok) {
    const text = d1.candidates?.[0]?.content?.parts?.[0]?.text || 'no text';
    console.log('Reply:', text);
  } else {
    console.log('ERROR:', d1.error?.message || JSON.stringify(d1).substring(0, 300));
  }

  console.log('\n=== Test 2: Multi-turn with history ===');
  const res2 = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: 'My name is Edgard' }] },
        { role: 'model', parts: [{ text: 'Hello Edgard! How can I help you?' }] },
        { role: 'user', parts: [{ text: 'What is my name?' }] }
      ]
    })
  });
  const d2 = await res2.json();
  console.log('Status:', res2.status);
  if (res2.ok) {
    const text = d2.candidates?.[0]?.content?.parts?.[0]?.text || 'no text';
    console.log('Reply:', text);
  } else {
    console.log('ERROR:', d2.error?.message || JSON.stringify(d2).substring(0, 300));
  }

  console.log('\n=== Test 3: Tools / function calling ===');
  const res3 = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'What is the weather in London?' }] }],
      tools: [{
        functionDeclarations: [{
          name: 'get_weather',
          description: 'Get the weather for a location',
          parameters: {
            type: 'object',
            properties: { location: { type: 'string', description: 'City name' } },
            required: ['location']
          }
        }]
      }]
    })
  });
  const d3 = await res3.json();
  console.log('Status:', res3.status);
  if (res3.ok) {
    const fc = d3.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    console.log('Function call:', fc ? JSON.stringify(fc) : 'no function call (text: ' + (d3.candidates?.[0]?.content?.parts?.[0]?.text || '').substring(0, 80) + ')');
  } else {
    console.log('ERROR:', d3.error?.message || JSON.stringify(d3).substring(0, 300));
  }

  console.log('\n=== VERDICT ===');
  if (res1.ok && res2.ok && res3.ok) console.log('Gemini API WORKS PERFECTLY');
  else console.log('Gemini API HAS ISSUES');
}
test().catch(e => console.error('FAIL:', e.message));
