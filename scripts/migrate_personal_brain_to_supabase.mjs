import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const DATA_FILE = path.join(process.cwd(), 'local-worker', 'data', 'personal_brain.json')

async function run() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log("No personal_brain.json found. Nothing to migrate.")
    return
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  let migratedReminders = 0
  let migratedLists = 0

  for (const email of Object.keys(data.users)) {
    const user = data.users[email]
    
    // Migrate reminders
    if (user.reminders && user.reminders.length > 0) {
      for (const r of user.reminders) {
        const { error } = await supabase.from('apex_reminders').insert({
          id: r.id && r.id.length > 10 ? undefined : undefined, // let supabase generate uuid unless we have uuid
          user_email: email,
          text: r.text,
          due_time: r.due_time,
          notified: r.notified,
          created_at: r.created_at
        })
        if (error) console.error("Error migrating reminder:", error.message)
        else migratedReminders++
      }
    }

    // Migrate lists
    if (user.lists) {
      for (const listName of Object.keys(user.lists)) {
        const list = user.lists[listName]
        for (const item of list) {
          const { error } = await supabase.from('apex_lists').insert({
             user_email: email,
             list_name: listName,
             item_text: item.text,
             added_at: item.added_at
          })
          if (error) console.error("Error migrating list item:", error.message)
          else migratedLists++
        }
      }
    }
  }

  console.log(`Migration completed! Migrated ${migratedReminders} reminders and ${migratedLists} list items.`)
}

run()
