import { handleAutoupgradePlan } from '../../server.mjs';

export default async function handler(req, res) {
  return handleAutoupgradePlan(req, res);
}
