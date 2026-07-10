import { handleEvmSchedulerCompliance } from '../../server.mjs';

export default async function handler(req, res) {
  return handleEvmSchedulerCompliance(req, res);
}
