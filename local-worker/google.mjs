import fs from 'node:fs/promises'
import path from 'node:path'
import { google } from 'googleapis'

let authClient = null

export async function initGoogleAuth(projectPath) {
  try {
    const keyPath = path.join(projectPath, 'local-worker', 'google-credentials.json')
    await fs.access(keyPath)
    
    // Configura o cliente de autenticação via Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    })

    authClient = await auth.getClient()
    console.log('✅ [Google Cloud] Conectores ativados via google-credentials.json')
    return true
  } catch (error) {
    console.log('⚠️ [Google Cloud] Chave google-credentials.json não encontrada. Conectores desativados.')
    return false
  }
}

// ─── Ferramentas do Google (Conectores) ──────────────────────────────────────

export async function lerPlanilhaGoogle(spreadsheetId, range) {
  if (!authClient) throw new Error('Autenticação do Google Cloud não configurada.')
  const sheets = google.sheets({ version: 'v4', auth: authClient })
  
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  return response.data.values
}

export async function adicionarLinhaPlanilha(spreadsheetId, range, valores) {
  if (!authClient) throw new Error('Autenticação do Google Cloud não configurada.')
  const sheets = google.sheets({ version: 'v4', auth: authClient })
  
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [valores] }
  })
  return response.data
}

export async function criarEventoAgenda(calendarId, resumo, inicio, fim) {
  if (!authClient) throw new Error('Autenticação do Google Cloud não configurada.')
  const calendar = google.calendar({ version: 'v3', auth: authClient })
  
  const evento = {
    summary: resumo,
    start: { dateTime: inicio, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: fim, timeZone: 'America/Sao_Paulo' }
  }
  
  const response = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    requestBody: evento
  })
  return response.data
}
