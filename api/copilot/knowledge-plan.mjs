import { handleKnowledgePlan } from '../../server.mjs';

export default async function handler(req, res) {
  return handleKnowledgePlan(req, res);
}
