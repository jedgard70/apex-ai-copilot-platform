import { handleOperatorPreview } from '../../server.mjs';

export default async function handler(req, res) {
  const action = req.query?.action || 'preview';
  if (action === 'preview') {
    return handleOperatorPreview(req, res);
  }
  // Fallback for execution/status if needed later, but preview is what breaks the UI usually
  return res.status(404).json({ error: 'Action not implemented in serverless mode' });
}
