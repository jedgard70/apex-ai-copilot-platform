import { handleBusinessPlan } from '../../server.mjs';

export default async function handler(req, res) {
  return handleBusinessPlan(req, res);
}
