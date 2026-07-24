const fs = require('fs');
let code = fs.readFileSync('server/agent/codeTools.mjs', 'utf8');

const toolCode = \
async function toolMcpLocalExecute(args) {
  const workerUrl = process.env.LOCAL_WORKER_URL || process.env.Local_Worker_URL
  const workerToken = process.env.LOCAL_WORKER_TOKEN || process.env.Local_Worker_TOKEN

  if (!workerUrl || !workerToken) {
    return { ok: false, error: 'MCP connection to local machine is not configured (missing LOCAL_WORKER_URL or TOKEN).' }
  }

  const command = String(args.command || '').trim()
  if (!command) return { ok: false, error: 'command is required.' }

  try {
    const response = await fetch(\\\\/execute\\\, {
      method: 'POST',
      headers: {
        'Authorization': \\\Bearer \\\\,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command,
        args: args.args || [],
        cwd: args.cwd,
        timeout: 60000,
      }),
      signal: AbortSignal.timeout(65000),
    })

    if (!response.ok) {
      return { ok: false, error: \\\Local worker failed with status \: \\\\ }
    }

    const result = await response.json()
    return {
      ok: result.exitCode === 0,
      status: result.exitCode === 0 ? 'completed' : 'failed',
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: result.duration,
    }
  } catch (err) {
    return { ok: false, error: \\\MCP local execution failed: \\\\ }
  }
}
\;

code = code.replace('// Execute a single tool call.', toolCode + '\n// Execute a single tool call.');

code = code.replace(
  /export const CODE_TOOL_NAMES = new Set\\(\\[([\\s\\S]*?)\\]\\)/,
  (match, p1) => {
    if (!p1.includes('mcp_local_execute')) {
      return \export const CODE_TOOL_NAMES = new Set([\, 'mcp_local_execute'])\;
    }
    return match;
  }
);

const toolDef = \
    tools.push({
      type: 'function',
      function: {
        name: 'mcp_local_execute',
        description: 'MCP Proxy: Execute a shell command or git command ON THE USER\\'S LOCAL COMPUTER. Use this to do local operations (git push/pull, file edits on the local machine) when the website AI is asked to change the project.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            command: { type: 'string', description: 'The command to run, e.g. \"git\" or \"npm\".' },
            args: { type: 'array', items: { type: 'string' }, description: 'Array of command arguments.' },
            cwd: { type: 'string', description: 'Optional relative working directory on the local machine.' }
          },
          required: ['command'],
        },
      },
    })
\;
code = code.replace('// --- External Tools ---', '// --- External Tools ---' + toolDef);

code = code.replace(
  \"case 'run_command': return await toolRunCommand(rootDir, args)\",
  \"case 'run_command': return await toolRunCommand(rootDir, args)\\n      case 'mcp_local_execute': return await toolMcpLocalExecute(args)\"
);

fs.writeFileSync('server/agent/codeTools.mjs', code);
console.log('Modified codeTools.mjs successfully');
