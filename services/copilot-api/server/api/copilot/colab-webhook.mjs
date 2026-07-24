export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method Not Allowed'});
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Parse JSON body
    let bodyData;
    if (typeof req.body === 'string') {
      try { bodyData = JSON.parse(req.body); } catch (e) { bodyData = {}; }
    } else {
      bodyData = req.body || {};
    }

    const dbPath = path.join(process.cwd(), '.data', 'colab-telemetry.json');
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    
    const logEntry = { timestamp: new Date().toISOString(), ...bodyData };
    
    let logs = [];
    if (fs.existsSync(dbPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      } catch (err) {
        // file might be corrupt
      }
    }
    
    logs.push(logEntry);
    
    // Keep only last 100 entries to avoid bloating
    if (logs.length > 100) logs = logs.slice(logs.length - 100);
    
    fs.writeFileSync(dbPath, JSON.stringify(logs, null, 2));
    
    res.status(200).json({ ok: true, entry: logEntry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
