import fetch from 'node-fetch'
// Google Workspace API Tool (Contacts and Calendar)

const [,, action, email, ...args] = process.argv;

if (!action || !email) {
  console.error('Usage: node googleWorkspaceCli.mjs <action> <email> [args...]')
  process.exit(1)
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function run() {
  try {
    if (action === 'get_contacts') {
      const res = await fetch(`${API_URL}/api/google/contacts?email=${email}`)
      const data = await res.json()
      console.log(JSON.stringify(data))
    } else if (action === 'get_calendar') {
      const res = await fetch(`${API_URL}/api/google/calendar?email=${email}`)
      const data = await res.json()
      console.log(JSON.stringify(data))
    } else if (action === 'add_event') {
      const title = args[0]
      const timeIso = args[1]
      const res = await fetch(`${API_URL}/api/google/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, title, timeIso })
      })
      const data = await res.json()
      console.log(JSON.stringify(data))
    } else {
      console.error(JSON.stringify({ error: 'Ação desconhecida' }))
    }
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }))
  }
}

run()
