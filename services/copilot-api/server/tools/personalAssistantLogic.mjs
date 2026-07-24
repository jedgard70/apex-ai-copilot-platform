import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

// === Lembretes ===
export function addReminder(email, dueTimeIso, text) {
  try {
    const { data, userBrain } = getUserBrain(email)
    const id = Date.now().toString()
    userBrain.reminders.push({
      id,
      text,
      due_time: dueTimeIso,
      notified: false,
      created_at: new Date().toISOString()
    })
    saveData(data)
    return { ok: true, message: `Lembrete agendado com sucesso para ${dueTimeIso}.` }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function checkDueReminders(email) {
  try {
    const { data, userBrain } = getUserBrain(email)
    const now = new Date()
    const dueReminders = []

    let hasChanges = false
    for (const rem of userBrain.reminders) {
      if (!rem.notified) {
        const dueDate = new Date(rem.due_time)
        // Se a data de entrega é menor ou igual a agora
        if (dueDate <= now) {
          dueReminders.push(rem)
          rem.notified = true
          hasChanges = true
        }
      }
    }

    if (hasChanges) {
      saveData(data)
    }
    return { ok: true, reminders: dueReminders }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// === Listas ===
export function addToList(email, listName, itemText) {
  try {
    const { data, userBrain } = getUserBrain(email)
    if (!userBrain.lists[listName]) {
      userBrain.lists[listName] = []
    }
    userBrain.lists[listName].push({
      id: Date.now().toString(),
      text: itemText,
      added_at: new Date().toISOString()
    })
    saveData(data)
    return { ok: true, message: `"${itemText}" adicionado à lista "${listName}".` }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function readList(email, listName) {
  try {
    const { userBrain } = getUserBrain(email)
    const list = userBrain.lists[listName] || []
    return { ok: true, items: list }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function clearList(email, listName) {
  try {
    const { data, userBrain } = getUserBrain(email)
    userBrain.lists[listName] = []
    saveData(data)
    return { ok: true, message: `Lista "${listName}" esvaziada.` }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
