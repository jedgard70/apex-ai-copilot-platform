import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { executeCodeToolCall, CODE_TOOL_NAMES } from '../server/agent/codeTools.mjs'
import { executeGithubToolCall, GITHUB_TOOL_NAMES } from '../server/agent/githubTools.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function run() {
  const toolCallStr = process.argv[2]
  if (!toolCallStr) {
    console.error('Missing tool call argument')
    process.exit(1)
  }

  const toolCall = JSON.parse(toolCallStr)
  const name = toolCall?.function?.name || ''
  const repoRoot = path.resolve(__dirname, '../')

  try {
    let result
    if (CODE_TOOL_NAMES.has(name)) {
      result = await executeCodeToolCall(toolCall, repoRoot)
    } else if (GITHUB_TOOL_NAMES.has(name)) {
      result = await executeGithubToolCall(toolCall, repoRoot)
    } else {
      result = { error: 'Unknown tool call in local worker proxy.' }
    }
    
    // Log the result as JSON so the caller can parse it
    console.log('___TOOL_RESULT___:' + JSON.stringify(result))
  } catch (err) {
    console.error(err)
    console.log('___TOOL_RESULT___:' + JSON.stringify({ error: err.message }))
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
