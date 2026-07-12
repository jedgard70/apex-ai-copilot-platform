import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getApexTunnelSubdomain, getApexWorkerPort } from './apex-config.mjs';

const port = process.env.LOCAL_WORKER_PORT || String(getApexWorkerPort() || 8787);
const cliSubdomain = process.argv.find(arg => arg.startsWith('--subdomain='));
const subdomain = cliSubdomain ? cliSubdomain.split('=')[1] : (process.env.LOCAL_TUNNEL_SUBDOMAIN || process.env.APEX_TUNNEL_SUBDOMAIN || getApexTunnelSubdomain() || '').trim();
const cmd = subdomain
  ? `npx localtunnel --port ${port} --subdomain ${subdomain}`
  : `npx localtunnel --port ${port}`;

const child = exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error('LocalTunnel error:', error);
    return;
  }
});

let url = '';
child.stdout?.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/your url is:\s*(https:\/\/[^\s]+)/i)
    || text.match(/your publicly accessible URL is:\s*(https:\/\/[^\s]+)/i);
  if (match) {
    url = match[1].trim();
    console.log('LocalTunnel URL:', url);
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch (_) { }
    const line = `LOCAL_WORKER_URL='${url}'`;
    if (envContent.includes('LOCAL_WORKER_URL=')) {
      envContent = envContent.replace(/LOCAL_WORKER_URL=.*/, line);
    } else {
      envContent += `\n${line}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env.local with LOCAL_WORKER_URL');
    console.log('Tunnel is running. Press Ctrl+C to stop.');
  }
});

process.on('SIGINT', () => {
  child.kill();
  process.exit();
});
