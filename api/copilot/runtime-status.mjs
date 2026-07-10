import { handleRuntimeStatus } from '../../server.mjs';

export default async function handler(req, res) {
  return handleRuntimeStatus(req, res);
}
