import { mainHandler } from '../../server.mjs';

export default async function handler(req, res) {
  return mainHandler(req, res);
}
