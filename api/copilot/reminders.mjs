import { checkDueReminders } from '../../server/tools/personalAssistantLogic.mjs'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const email = req.query.email
      if (!email) {
        return res.status(400).json({ error: 'email parameter required' })
      }
      const result = await checkDueReminders(email)
      return res.status(200).json(result)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: err.message })
    }
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
