import fs from 'fs'
import path from 'path'

// POST /api/google/auth
// Simples endpoint para receber o código do Google OAuth ou armazenar chaves
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body || {}
  const clientId = process.env.GOOGLE_CLIENT_ID || body.clientId
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || body.clientSecret

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Faltam credenciais do Google Workspace' })
  }

  // Futuro: Trocar o código de autorização por tokens e salvar no Supabase
  res.status(200).json({ success: true, message: 'Google Auth preparado' })
}
