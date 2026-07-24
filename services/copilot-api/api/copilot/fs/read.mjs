import fs from 'node:fs';
import path from 'node:path';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filepath = url.searchParams.get('path');
    if (!filepath) return res.status(400).json({ ok: false, error: 'path is required' });
    
    const cwd = process.cwd();
    const fullPath = path.join(cwd, filepath);
    
    // basic security: must be inside cwd
    if (!fullPath.startsWith(cwd)) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    
    if (!fs.existsSync(fullPath)) return res.status(404).json({ ok: false, error: 'file not found' });
    
    const content = fs.readFileSync(fullPath, 'utf8');
    return res.status(200).json({ ok: true, content });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
}
