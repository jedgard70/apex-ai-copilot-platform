import { handleBackgroundTask } from '../../server.mjs';

export default async function handler(req, res) {
  return handleBackgroundTask(req, res);
}
