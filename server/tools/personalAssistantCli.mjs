import { addReminder, checkDueReminders, addToList, readList, clearList } from './personalAssistantLogic.mjs'

const action = process.argv[2]
const email = process.argv[3]

if (!action || !email) {
  console.error('Usage: node personalAssistantCli.mjs <action> <email> [args...]')
  process.exit(1)
}

if (action === 'add_reminder') {
  const dueTimeIso = process.argv[4]
  const text = process.argv[5]
  if (!dueTimeIso || !text) {
    console.error('Usage: add_reminder <email> <dueTimeIso> "<text>"')
    process.exit(1)
  }
  const result = addReminder(email, dueTimeIso, text)
  console.log(JSON.stringify(result))

} else if (action === 'check_reminders') {
  const result = checkDueReminders(email)
  console.log(JSON.stringify(result))

} else if (action === 'add_list') {
  const listName = process.argv[4]
  const item = process.argv[5]
  if (!listName || !item) {
    console.error('Usage: add_list <email> <listName> "<item>"')
    process.exit(1)
  }
  const result = addToList(email, listName, item)
  console.log(JSON.stringify(result))

} else if (action === 'read_list') {
  const listName = process.argv[4]
  const result = readList(email, listName)
  console.log(JSON.stringify(result))

} else if (action === 'clear_list') {
  const listName = process.argv[4]
  const result = clearList(email, listName)
  console.log(JSON.stringify(result))

} else {
  console.error('Unknown action.')
  process.exit(1)
}
