import { handleExportSkillPack } from '../../server.mjs';

export default async function handler(req, res) {
  return handleExportSkillPack(req, res);
}
