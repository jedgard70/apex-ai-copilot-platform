import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }
}

const supabaseUrl = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY to your environment to run this script.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportToVertex() {
  console.log("Fetching chat_history from Supabase...");

  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching data:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No chat history found. Nothing to export.");
    return;
  }

  // Group by session_id
  const sessions = {};
  for (const row of data) {
    if (!sessions[row.session_id]) {
      sessions[row.session_id] = [];
    }
    // Convert role to Vertex AI expectation ('assistant' -> 'model')
    let role = row.role;
    if (role === 'assistant') role = 'model';
    
    // Ignore tool and system messages for basic SFT if needed, but we keep them mapped
    if (role === 'system') continue; 
    
    sessions[row.session_id].push({
      role: role,
      content: row.content
    });
  }

  // Generate JSONL
  const outputPath = path.join(process.cwd(), 'vertex_tuning_data.jsonl');
  const ws = fs.createWriteStream(outputPath);

  let exportCount = 0;
  for (const [sessionId, messages] of Object.entries(sessions)) {
    // Vertex AI requires at least one user-model turn
    if (messages.length >= 2) {
      ws.write(JSON.stringify({ messages }) + '\n');
      exportCount++;
    }
  }

  ws.end();
  
  console.log(`\n✅ Export successful!`);
  console.log(`Extracted ${exportCount} valid multi-turn conversational sessions.`);
  console.log(`File saved to: ${outputPath}`);
  console.log(`\nNext Step: Upload 'vertex_tuning_data.jsonl' to Google Cloud Storage (GCS) and start a Fine-Tuning job in Vertex AI Model Garden for Gemma 4.`);
}

exportToVertex();
