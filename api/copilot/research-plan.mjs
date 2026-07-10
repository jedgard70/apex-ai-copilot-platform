import { handleResearchPlan } from '../../server.mjs';

export default async function handler(req, res) {
  return handleResearchPlan(req, res);
}