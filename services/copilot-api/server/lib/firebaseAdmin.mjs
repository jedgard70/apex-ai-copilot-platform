import '../env.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadServiceAccount() {
  const localPath = path.join(__dirname, '..', 'service-account.json')
  if (fs.existsSync(localPath)) {
    try {
      return JSON.parse(fs.readFileSync(localPath, 'utf-8'))
    } catch (err) {
      console.error('Failed to parse server/service-account.json:', err.message)
    }
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (json) {
    try {
      return JSON.parse(json)
    } catch {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON')
      return null
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }
  }

  return null
}

let firebaseApp = null

export function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp

  const serviceAccount = loadServiceAccount()
  if (!serviceAccount) {
    console.warn('Firebase Admin not configured. Place server/service-account.json or set FIREBASE_SERVICE_ACCOUNT_JSON env var.')
    return null
  }

  try {
    firebaseApp = initializeApp({ credential: cert(serviceAccount) })
    return firebaseApp
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err.message)
    return null
  }
}

export function getFirebaseMessaging() {
  try {
    const app = getFirebaseAdmin()
    if (!app) return null
    return getMessaging(app)
  } catch {
    return null
  }
}

export function getFirebaseFirestore() {
  try {
    const app = getFirebaseAdmin()
    if (!app) return null
    return getFirestore(app)
  } catch {
    return null
  }
}
