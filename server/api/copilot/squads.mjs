import { createSquad, getSquads, getSquadById, runSquadStep, approveCheckpoint, generateModuleSquads } from '../../service/apexSquads.mjs';

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

export default async function handler(req, res) {
  try {
    const { method, url } = req;
    
    // Generate system modules if not done yet
    generateModuleSquads();

    // GET /api/copilot/squads
    if (method === 'GET' && !url.includes('/run') && !url.includes('/approve')) {
      const idMatch = url.match(/\/squads\/(sqd_[a-zA-Z0-9_]+)/);
      if (idMatch) {
        const squad = getSquadById(idMatch[1]);
        if (!squad) return sendJson(res, 404, { error: 'Squad não encontrado' });
        return sendJson(res, 200, squad);
      }
      return sendJson(res, 200, getSquads());
    }
    
    // POST /api/copilot/squads
    if (method === 'POST' && (!url.includes('/run') && !url.includes('/approve'))) {
      const { name, goal, skill } = req.body || {};
      if (!name || !goal) {
        return sendJson(res, 400, { error: 'Name e Goal são obrigatórios' });
      }
      const newSquad = createSquad({ name, goal, skill });
      return sendJson(res, 201, newSquad);
    }
    
    // POST /api/copilot/squads/:id/run
    if (method === 'POST' && url.includes('/run')) {
      const idMatch = url.match(/\/squads\/(sqd_[a-zA-Z0-9_]+)\/run/);
      if (!idMatch) return sendJson(res, 400, { error: 'ID inválido' });
      const squad = runSquadStep(idMatch[1]);
      return sendJson(res, 200, squad);
    }
    
    // POST /api/copilot/squads/:id/approve
    if (method === 'POST' && url.includes('/approve')) {
      const idMatch = url.match(/\/squads\/(sqd_[a-zA-Z0-9_]+)\/approve/);
      if (!idMatch) return sendJson(res, 400, { error: 'ID inválido' });
      const squad = approveCheckpoint(idMatch[1]);
      return sendJson(res, 200, squad);
    }
    
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro no /api/copilot/squads:', error);
    return sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
}
