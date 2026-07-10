import { handleContractsPlan } from '../../server.mjs';

export default async function handler(req, res) {
  return handleContractsPlan(req, res);
}
