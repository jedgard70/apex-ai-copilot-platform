import { getTenantInfraCosts } from '../../service/infraOrchestrator.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-apex-identity');

  if (req.method === 'OPTIONS') {
    return res.writeHead(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const identity = JSON.parse(req.headers['x-apex-identity'] || '{}');
  const tenantId = identity.tenantId;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required for infrastructure metrics.' });
  }

  try {
    const data = await getTenantInfraCosts(tenantId);

    return res.status(200).json({
      metrics: {
        total_usd: data.grandTotalUsd,
        ai_usd: data.totalAiUsd,
        infra_usd: data.totalInfraUsd,
        providers: data.aiProviders,
        infra_details: data.infraMetrics
      }
    });
  } catch (err) {
    console.error('Error fetching infra metrics:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
