import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

export const CODE_TOOL_NAMES = new Set([
  'read_file', 'list_dir', 'search_code', 'write_file', 'edit_file'
])

export function getCodeToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the contents of a local file in the Apex repository.',
        parameters: {
          type: 'object',
          properties: { absolutePath: { type: 'string' } },
          required: ['absolutePath']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'list_dir',
        description: 'List contents of a directory in the Apex repository.',
        parameters: {
          type: 'object',
          properties: { directoryPath: { type: 'string' } },
          required: ['directoryPath']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'search_code',
        description: 'Search for text in the Apex repository.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Write complete content to a local file in the Apex repository.',
        parameters: {
          type: 'object',
          properties: { 
            absolutePath: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['absolutePath', 'content']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'edit_file',
        description: 'Replace text within a local file in the Apex repository.',
        parameters: {
          type: 'object',
          properties: { 
            absolutePath: { type: 'string' },
            targetContent: { type: 'string' },
            replacementContent: { type: 'string' }
          },
          required: ['absolutePath', 'targetContent', 'replacementContent']
        }
      }
    }
  ]
}

export async function executeCodeToolCall(toolCall, repoRoot) {
  const name = toolCall.function.name
  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch (e) {
    return { error: 'Invalid tool arguments' }
  }

  const resolvePath = (p) => path.isAbsolute(p) ? p : path.resolve(repoRoot, p)

  try {
    if (name === 'read_file') {
      const p = resolvePath(args.absolutePath)
      const content = fs.readFileSync(p, 'utf8')
      return { success: true, content: content.substring(0, 50000) }
    }
    
    if (name === 'list_dir') {
      const p = resolvePath(args.directoryPath || '.')
      const items = fs.readdirSync(p)
      return { success: true, items }
    }
    
    if (name === 'search_code') {
       return { success: false, message: 'search_code not fully implemented. Use read_file.' }
    }
    
    if (name === 'write_file') {
      const p = resolvePath(args.absolutePath)
      fs.writeFileSync(p, args.content, 'utf8')
      return { success: true, message: `File written: ${p}` }
    }

    if (name === 'edit_file') {
      const p = resolvePath(args.absolutePath)
      const content = fs.readFileSync(p, 'utf8')
      if (content.includes(args.targetContent)) {
        const newContent = content.replace(args.targetContent, args.replacementContent)
        fs.writeFileSync(p, newContent, 'utf8')
        return { success: true, message: `File edited: ${p}` }
      }
      return { error: 'Target content not found in file.' }
    }
    
    return { error: 'Tool not implemented' }
  } catch (err) {
    return { error: err.message }
  }
}
