import fs from 'node:fs'
import path from 'node:path'

const DATA_FILE = path.join(process.cwd(), 'local-worker', 'data', 'personal_brain.json')

function initDataFile() {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2))
  }
}

function getUserBrain(email) {
  initDataFile()
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  if (!data.users[email]) {
    data.users[email] = { reminders: [], lists: {} }
  }
  return { data, userBrain: data.users[email] }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
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
