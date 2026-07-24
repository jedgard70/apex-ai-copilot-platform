import { getGlobalLegalDashboard, recordContract } from '../../service/legal.mjs';

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

export default async function handleLegal(req, res) {
  try {
    if (req.method === 'GET') {
      const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
      const dashboard = await getGlobalLegalDashboard(tenantId);
      sendJson(res, 200, dashboard);
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body);
          
          if (parsed.action === 'record_contract') {
            const newRecord = await recordContract({
              tenantId: parsed.tenantId,
              title: parsed.title,
              type: parsed.type,
              status: parsed.status,
              parties: parsed.parties
            });
            if (newRecord.error) {
              sendJson(res, 400, { error: newRecord.error });
            } else {
              sendJson(res, 200, { success: true, ...newRecord });
            }
            return;
          }

          sendJson(res, 400, { error: 'Unknown action' });
        } catch (e) {
          sendJson(res, 500, { error: e.message });
        }
      });
      return;
    }
    
    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('[Legal API] Error:', error);
    sendJson(res, 500, { error: error.message });
  }
}
