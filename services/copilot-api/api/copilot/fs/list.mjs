import fs from 'node:fs';
import path from 'node:path';

export default async function handler(req, res) {
  try {
    const cwd = process.cwd();
    const readDirRecursive = (dir, base = '', depth = 0) => {
      if (depth > 3) return []; // Limit depth to prevent hangs
      let results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.next' || entry.name === '.gemini' || entry.name === 'brain' || entry.name === '.vercel') continue;
        const relPath = path.join(base, entry.name);
        if (entry.isDirectory()) {
          results.push({ name: entry.name, path: relPath.replace(/\\/g, '/'), isDir: true });
          results = results.concat(readDirRecursive(path.join(dir, entry.name), relPath, depth + 1));
        } else {
          results.push({ name: entry.name, path: relPath.replace(/\\/g, '/'), isDir: false });
        }
      }
      return results;
    }
    
    let files = [];
    if (fs.existsSync(cwd)) {
      files = readDirRecursive(cwd);
    }
    
    return res.status(200).json({ ok: true, files });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
}
