import { handleAnalyzeSkillUpdate } from '../../server.mjs';

export default async function handler(req, res) {
  return handleAnalyzeSkillUpdate(req, res);
}
