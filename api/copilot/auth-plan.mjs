import { handleAuthPlan } from '../../server.mjs';

export default async function handler(req, res) {
  return handleAuthPlan(req, res);
}
