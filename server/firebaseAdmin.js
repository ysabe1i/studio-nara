import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keyPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, 'firebase-service-account.json')
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'))

const app = initializeApp({ credential: cert(serviceAccount) })

export const adminAuth = getAuth(app)