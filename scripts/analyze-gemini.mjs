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

const key = process.env.GEMINI_API_KEY;

async function main() {
  // 1. Get all models + their capabilities
  console.log('=== GEMINI MODELS & CAPABILITIES ===\n');
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', {
    headers: { 'x-goog-api-key': key },
  });
  const data = await res.json();
  const models = data.models || [];
  const geminiModels = models.filter(m => (m.name || '').startsWith('models/gemini-'));
  
  // Categorize
  const textModels = [];
  const imageModels = [];
  const videoModels = [];
  const audioModels = [];
  const ttsModels = [];
  
  for (const m of geminiModels) {
    const name = (m.name || '').replace('models/', '');
    const methods = (m.supportedGenerationMethods || []).join(',');
    const displayName = m.displayName || name;
    
    if (name.includes('tts') || name.includes('audio')) {
      ttsModels.push({ name, displayName, methods });
    } else if (methods.includes('generateContent')) {
      textModels.push({ name, displayName, methods });
    }
    if (name.includes('image')) {
      imageModels.push({ name, displayName, methods });
    }
    if (name.includes('video') || name.includes('veo')) {
      videoModels.push({ name, displayName, methods });
    }
  }
  
  console.log(`Total Gemini models: ${geminiModels.length}`);
  console.log(`- Text/Chat: ${textModels.length} models`);
  console.log(`- Image gen: ${imageModels.length} models`);
  console.log(`- Video gen: ${videoModels.length} models`);
  console.log(`- TTS/Audio: ${ttsModels.length} models`);
  
  console.log('\n--- TEXT/CHAT MODELS (generateContent) ---');
  for (const m of textModels) {
    console.log(`  ${m.name.padEnd(35)} ${m.displayName}`);
  }
  
  console.log('\n--- IMAGE MODELS ---');
  for (const m of imageModels) {
    console.log(`  ${m.name.padEnd(35)} ${m.displayName}`);
  }
  
  console.log('\n--- TTS/AUDIO MODELS ---');
  for (const m of ttsModels) {
    console.log(`  ${m.name.padEnd(35)} ${m.displayName}`);
  }
  
  console.log('\n--- VIDEO MODELS ---');
  for (const m of videoModels) {
    console.log(`  ${m.name.padEnd(35)} ${m.displayName}`);
  }
  
  // 2. Try to get per-model quota info
  console.log('\n\n=== PER-MODEL QUOTA (first 10) ===\n');
  for (const m of geminiModels.slice(0, 10)) {
    const name = m.name.replace('models/', '');
    try {
      const qRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${m.name}?key=${key}`);
      const q = await qRes.json();
      const pricing = q.pricing || {};
      const quota = q.quota || {};
      console.log(`${name.padEnd(35)} billable: ${q.billable ? 'YES' : 'no'} | pricing: ${JSON.stringify(pricing).substring(0, 80)}`);
    } catch(e) { /* */ }
  }
  
  // 3. Key info
  console.log('\n\n=== KEY INFO ===');
  console.log(`Key configured: ${key ? 'YES (' + key.length + ' chars)' : 'NO'}`);
  console.log(`Key starts with: ${key ? key.substring(0, 15) + '...' : ''}`);
  console.log('\nNote: Free tier Gemini includes:');
  console.log('- 60 requests per minute (RPM) for Gemini Flash models');
  console.log('- 10 requests per minute for Gemini Pro models');
  console.log('- 1,500 conversations per day (Interactions API)');
  console.log('- Image generation (Imagen/Nano Banana) included');
  console.log('- TTS included');
  console.log('\nTo get PAYG pricing: https://ai.google.dev/pricing');
}

main().catch(e => console.error('FAIL:', e.message, e.stack?.substring(0, 200)));
