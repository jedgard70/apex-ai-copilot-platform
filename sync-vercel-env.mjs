import fs from 'fs';
import path from 'path';

async function pushEnvVars() {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  
  const VERCEL_TOKEN = envContent.match(/VERCEL_TOKEN=['"]?([^'"\n]+)['"]?/)?.[1];
  const PROJECT_ID = envContent.match(/APEX_VERCEL_PROJECT_ID=['"]?([^'"\n]+)['"]?/)?.[1] || envContent.match(/VERCEL_PROJECT_ID=['"]?([^'"\n]+)['"]?/)?.[1];
  
  if (!VERCEL_TOKEN || !PROJECT_ID) {
    console.error('VERCEL_TOKEN or PROJECT_ID not found in .env.local');
    return;
  }

  console.log(`Using Project ID: ${PROJECT_ID}`);
  
  const envVars = [];
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.*?)['"]?$/i);
    if (match) {
      const key = match[1];
      const value = match[2];
      
      // Ignorar chaves muito grandes ou indesejadas
      if (key === 'FIREBASE_SERVICE_ACCOUNT_JSON') continue;
      if (key.includes('VERCEL_OIDC_TOKEN')) continue;
      
      envVars.push({
        type: 'encrypted',
        key: key,
        value: value,
        target: ['production', 'preview', 'development']
      });
    }
  }

  console.log(`Found ${envVars.length} variables. Pushing to Vercel...`);
  
  for (const envVar of envVars) {
    try {
      const res = await fetch(`https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envVar)
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error(`Failed to push ${envVar.key}:`, error);
      } else {
        console.log(`Successfully synced: ${envVar.key}`);
      }
    } catch (e) {
      console.error(`Error syncing ${envVar.key}:`, e);
    }
  }
  
  console.log('Finished syncing environment variables.');
}

pushEnvVars();
