import { handleExportPackage } from '../../server.mjs';

export default async function handler(req, res) {
  return handleExportPackage(req, res);
}
