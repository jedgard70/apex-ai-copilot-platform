import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Storage path: ../data/financial_logs.json
const LOGS_FILE = path.join(__dirname, '..', 'data', 'financial_logs.json')

// Provider pricing table (USD per 1M tokens)
const PRICING = {
  'openai': {
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'o1-mini': { input: 3.00, output: 12.00 },
    'default': { input: 2.50, output: 10.00 }
  },
  'anthropic': {
    'claude-3-5-sonnet-20240620': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'default': { input: 3.00, output: 15.00 }
  },
  'gemini': {
    // Assuming free tier API key is used, but tracking theoretical cost.
    // If you want actual billing cost, use these numbers. We will track them to know the "value".
    'gemini-2.5-pro': { input: 3.50, output: 10.50 },
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'default': { input: 0.10, output: 0.40 }
  },
  'groq': {
    'default': { input: 0, output: 0 } // Free tier currently
  },
  'fal': {
    'default': { input: 0, output: 0 } // Mostly free for LLM text currently
  },
  'huggingface': {
    'default': { input: 0, output: 0 } // ZeroGPU / Inference API is free
  },
  'apex-runtime': {
    'default': { input: 0, output: 0 } // Local is free
  }
}

function calculateCost(provider, model, inputTokens, outputTokens) {
  const pData = PRICING[provider] || PRICING['openai']
  const mData = pData[model] || pData['default'] || { input: 0, output: 0 }
  
  const inputCost = (inputTokens / 1_000_000) * mData.input
  const outputCost = (outputTokens / 1_000_000) * mData.output
  
  return inputCost + outputCost
}

function loadLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('[CostTracker] Erro ao ler logs:', e)
  }
  return { transactions: [], totalsByProvider: {}, totalSpent: 0 }
}

function saveLogs(data) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('[CostTracker] Erro ao salvar logs:', e)
  }
}

export function logUsage(provider, model, usageData = {}) {
  const inputTokens = usageData.prompt_tokens || usageData.inputTokens || usageData.promptTokenCount || 0
  const outputTokens = usageData.completion_tokens || usageData.outputTokens || usageData.candidatesTokenCount || 0
  
  // If no tokens reported, exit early to avoid clutter
  if (inputTokens === 0 && outputTokens === 0) return

  const cost = calculateCost(provider, model, inputTokens, outputTokens)

  const logEntry = {
    id: `txn_${Date.now()}`,
    timestamp: new Date().toISOString(),
    provider,
    model,
    inputTokens,
    outputTokens,
    cost: parseFloat(cost.toFixed(6))
  }

  // Update State
  const state = loadLogs()
  
  // Keep last 1000 transactions to prevent file bloat
  state.transactions.unshift(logEntry)
  if (state.transactions.length > 1000) {
    state.transactions.pop()
  }

  state.totalSpent = (state.totalSpent || 0) + logEntry.cost
  
  if (!state.totalsByProvider[provider]) {
    state.totalsByProvider[provider] = { cost: 0, tokens: 0 }
  }
  state.totalsByProvider[provider].cost += logEntry.cost
  state.totalsByProvider[provider].tokens += (inputTokens + outputTokens)

  saveLogs(state)
  console.log(`[Billing] Gasto registrado: ${provider} (${model}), Input: ${inputTokens}, Output: ${outputTokens}, Custo: $${logEntry.cost.toFixed(5)}`)
}

export function getBillingStats() {
  return loadLogs()
}
