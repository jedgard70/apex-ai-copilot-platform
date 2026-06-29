import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = process.env.LOCAL_WORKER_PORT || '8787';
const cmd = `npx localtunnel --port ${port}`;

const child = exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error('LocalTunnel error:', error);
    return;
  }
});

let url = '';
child.stdout?.on('data', (data) => {
  const match = data.toString().match(/your publicly accessible URL is: (https:\/\/[^\s]+)/i);
  if (match) {
    url = match[1].trim();
    console.log('LocalTunnel URL:', url);
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch (_) {}
    const line = `LOCAL_TUNNEL_URL='${url}'`;
    if (envContent.includes('LOCAL_TUNNEL_URL=')) {
      envContent = envContent.replace(/LOCAL_TUNNEL_URL=.*/, line);
    } else {
      envContent += `\n${line}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env.local with LOCAL_TUNNEL_URL');
    child.kill();
  }
});

process.on('SIGINT', () => {
  child.kill();
  process.exit();
});
