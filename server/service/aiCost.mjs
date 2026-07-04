import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const AICOST_FILE = path.join(process.cwd(), '.system_generated', 'ai_cost.json')
let RECORDS = []
let IS_SUPABASE = false
let supabaseClient = null

function initSupabase() {
  if (supabaseClient) return true
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      IS_SUPABASE = true
      return true
    } catch (e) {
      console.warn('[aiCost] Error init Supabase:', e.message)
    }
  }
  return false
}

export async function loadRecords() {
  if (initSupabase()) {
    try {
      const { data, error } = await supabaseClient.from('ai_cost').select('*')
      if (!error && data) {
        RECORDS = data
        return RECORDS
      }
    } catch (e) {}
  }
  
  // Fallback
  try {
    if (fs.existsSync(AICOST_FILE)) {
      RECORDS = JSON.parse(fs.readFileSync(AICOST_FILE, 'utf-8'))
    } else {
      RECORDS = []
    }
  } catch (err) {}
  return RECORDS
}

export async function saveRecords(newRecords) {
  RECORDS = newRecords
  if (IS_SUPABASE && supabaseClient) {
    try {
      // Upsert
      await supabaseClient.from('ai_cost').upsert(RECORDS)
    } catch (e) {}
  }
  try {
    fs.mkdirSync(path.dirname(AICOST_FILE), { recursive: true })
    fs.writeFileSync(AICOST_FILE, JSON.stringify(RECORDS, null, 2))
  } catch (err) {}
}

export async function recordUsage({ module = 'Chat', tokens = 0, cost = 0, model = 'gemini-2.5-flash', userProject = 'Apex Project' }) {
  await loadRecords()
  
  const newRecord = {
    id: `ai-cost-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    module,
    requestCount: 1,
    estimatedTokens: tokens,
    estimatedCost: cost,
    model,
    timestamp: new Date().toISOString(),
    userProject,
    sourceConfidence: 'PROVIDER_BILLING_SOURCE'
  }
  
  RECORDS.push(newRecord)
  await saveRecords(RECORDS)
  return newRecord
}

export async function getAiCostDashboard() {
  await loadRecords()
  
  const totalRequests = RECORDS.reduce((sum, item) => sum + (item.requestCount || 1), 0)
  const totalEstimatedTokens = RECORDS.reduce((sum, item) => sum + (item.estimatedTokens || 0), 0)
  const totalEstimatedCost = Number(RECORDS.reduce((sum, item) => sum + (item.estimatedCost || 0), 0).toFixed(4))
  
  return {
    providerStatus: IS_SUPABASE ? 'connected' : 'local-json',
    usageSummary: {
      totalRequests,
      totalEstimatedTokens,
      totalEstimatedCost,
      sourceConfidence: IS_SUPABASE ? 'PROVIDER_BILLING_SOURCE' : 'ESTIMATED_LOCAL',
      warning: IS_SUPABASE ? 'Connected to database.' : 'Local JSON fallback. Provider billing not connected to DB.',
    },
    moduleBreakdown: RECORDS,
    costWarnings: [],
    message: 'AI Cost loaded successfully.',
  }
}

