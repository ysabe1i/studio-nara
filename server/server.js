import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { pool } from './db/pool.js'
import { requireAuth } from './authMiddleware.js'
import * as kits from './kitsRepo.js'
import * as projects from './projectsRepo.js'
import * as notes from './notesRepo.js'
import * as reflections from './reflectionsRepo.js'
import * as uploads from './uploadsRepo.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean)

// On Render the app sits behind one proxy. Without this every visitor shares
// the proxy's IP, so they'd all share one rate limit (and rate limiting would
// refuse to key by IP at all). 1 = trust exactly one proxy hop.
app.set('trust proxy', 1)

// The client is served from a different origin (GitHub Pages) and reads API
// responses with fetch, so responses must be allowed cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

const tooManyRequests = { error: 'Too many requests. Please wait a moment and try again.' }

// Broad ceiling per IP for the whole API, applied before the login check so
// it also covers unauthenticated hammering.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooManyRequests,
})

// Tighter limit on uploads (each one writes to the free database), keyed by
// the signed-in user rather than IP so one person can't burn through it
// from many addresses.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (request) => request.userId,
  message: { error: 'You are uploading too quickly. Please wait a few minutes and try again.' },
})

const USER_STORAGE_LIMIT_BYTES = 25 * 1024 * 1024

// The stored MIME type comes from this extension allow-list, never from the
// client's declared type, so "evil.html" labelled image/png is rejected.
const ALLOWED_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES[extension]) {
      callback(null, true)
    } else {
      callback(new Error('Only image and font files are allowed'))
    }
  },
})

function cleanUpOrphans(userId) {
  uploads.removeOrphans(pool, userId).catch((error) => console.error('cleanup failed:', error))
}

app.get('/healthz', (request, response) => response.json({ ok: true }))

app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// Every /api/* route below requires a verified Firebase ID token.
// request.userId is set by requireAuth and scopes all data per-owner.
app.use('/api', apiLimiter)
app.use('/api', requireAuth)

app.post('/api/uploads', uploadLimiter, (request, response) => {
  upload.single('file')(request, response, async (error) => {
    if (error) return response.status(400).json({ error: error.message })
    if (!request.file) return response.status(400).json({ error: 'No file uploaded' })
    try {
      const used = await uploads.usedBytes(pool, request.userId)
      if (used + request.file.size > USER_STORAGE_LIMIT_BYTES) {
        return response.status(413).json({
          error: 'You have used all your file storage. Remove some logos, fonts or images and try again.',
        })
      }
      const extension = path.extname(request.file.originalname).toLowerCase()
      const id = await uploads.create(pool, request.userId, {
        filename: request.file.originalname.slice(0, 200),
        mimeType: ALLOWED_TYPES[extension],
        data: request.file.buffer,
      })
      response.status(201).json({ url: `/api/files/${id}` })
    } catch (caught) {
      console.error(caught)
      response.status(500).json({ error: 'Something went wrong on the server' })
    }
  })
})

app.get('/api/files/:id', async (request, response, next) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.params.id)) {
    return response.status(404).json({ error: 'Not found' })
  }
  try {
    const file = await uploads.getById(pool, request.userId, request.params.id)
    if (!file) return response.status(404).json({ error: 'Not found' })
    response.set({
      'Content-Type': file.mime_type,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Cache-Control': 'private, max-age=86400',
    })
    response.send(file.data)
  } catch (error) {
    next(error)
  }
})

function validateKit(body) {
  const errors = []
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const tag = typeof body.tag === 'string' ? body.tag.trim() : ''
  const colors = Array.isArray(body.colors) ? body.colors : []
  const logos = Array.isArray(body.logos) ? body.logos : []
  const fonts = Array.isArray(body.fonts) ? body.fonts : []

  if (!name) errors.push('name is required')
  if (name.length > 120) errors.push('name must be 120 characters or fewer')
  if (tag.length > 60) errors.push('tag must be 60 characters or fewer')
  if (colors.length > 50 || logos.length > 50 || fonts.length > 50) {
    errors.push('a kit can have at most 50 colors, 50 logos and 50 fonts')
  }
  const tooLong = (value, max) => typeof value === 'string' && value.length > max
  for (const color of colors) {
    if (typeof color.hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color.hex)) {
      errors.push(`invalid color hex: ${color.hex}`)
    }
    if (tooLong(color.name, 60)) errors.push('color names must be 60 characters or fewer')
  }
  for (const item of [...logos, ...fonts]) {
    if (tooLong(item.label, 200) || tooLong(item.font_family_name, 200)) {
      errors.push('file and font names must be 200 characters or fewer')
    }
  }
  return { errors, value: { name, tag, colors, logos, fonts } }
}

app.get('/api/kits', async (request, response, next) => {
  try { response.json(await kits.getAll(pool, request.userId)) } catch (error) { next(error) }
})

app.get('/api/kits/:id', async (request, response, next) => {
  try {
    const row = await kits.getById(pool, request.userId, request.params.id)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) { next(error) }
})

app.post('/api/kits', async (request, response, next) => {
  const { errors, value } = validateKit(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })
  try { response.status(201).json(await kits.create(pool, request.userId, value)) } catch (error) { next(error) }
})

app.put('/api/kits/:id', async (request, response, next) => {
  const { errors, value } = validateKit(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })
  try {
    const row = await kits.update(pool, request.userId, request.params.id, value)
    if (!row) return response.status(404).json({ error: 'Not found' })
    cleanUpOrphans(request.userId)
    response.json(row)
  } catch (error) { next(error) }
})

app.delete('/api/kits/:id', async (request, response, next) => {
  try {
    const removed = await kits.remove(pool, request.userId, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    cleanUpOrphans(request.userId)
    response.status(204).end()
  } catch (error) { next(error) }
})

function validateProject(body) {
  const errors = []
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const notesWorked = typeof body.notes_worked === 'string' ? body.notes_worked.trim() : ''
  const notesToChange = typeof body.notes_to_change === 'string' ? body.notes_to_change.trim() : ''

  if (!title) errors.push('title is required')
  if (title.length > 200) errors.push('title must be 200 characters or fewer')
  if (notesWorked.length > 4000) errors.push('reflection must be 4000 characters or fewer')
  if (notesToChange.length > 4000) errors.push('notes to change must be 4000 characters or fewer')

  return {
    errors,
    value: { title, image_url: body.image_url ?? null, kit_id: body.kit_id || null, notes_worked: notesWorked, notes_to_change: notesToChange },
  }
}

app.get('/api/projects', async (request, response, next) => {
  try { response.json(await projects.getAll(pool, request.userId)) } catch (error) { next(error) }
})

app.get('/api/projects/:id', async (request, response, next) => {
  try {
    const row = await projects.getById(pool, request.userId, request.params.id)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) { next(error) }
})

// A project may only link to a kit the caller owns; otherwise anyone could
// attach their project to (and probe for) another user's kit ids.
async function kitLinkIsValid(userId, kitId) {
  return !kitId || (await kits.ownedBy(pool, userId, kitId))
}

app.post('/api/projects', async (request, response, next) => {
  const { errors, value } = validateProject(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })
  try {
    if (!(await kitLinkIsValid(request.userId, value.kit_id))) {
      return response.status(400).json({ error: 'kit_id must be one of your own kits' })
    }
    response.status(201).json(await projects.create(pool, request.userId, value))
  } catch (error) { next(error) }
})

app.put('/api/projects/:id', async (request, response, next) => {
  const { errors, value } = validateProject(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })
  try {
    if (!(await kitLinkIsValid(request.userId, value.kit_id))) {
      return response.status(400).json({ error: 'kit_id must be one of your own kits' })
    }
    const row = await projects.update(pool, request.userId, request.params.id, value)
    if (!row) return response.status(404).json({ error: 'Not found' })
    cleanUpOrphans(request.userId)
    response.json(row)
  } catch (error) { next(error) }
})

app.delete('/api/projects/:id', async (request, response, next) => {
  try {
    const removed = await projects.remove(pool, request.userId, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    cleanUpOrphans(request.userId)
    response.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/projects/:id/reflections', async (request, response, next) => {
  try {
    if (!(await projects.ownedBy(pool, request.userId, request.params.id))) {
      return response.status(404).json({ error: 'Not found' })
    }
    response.json(await reflections.getAllForProject(pool, request.userId, request.params.id))
  } catch (error) { next(error) }
})

app.post('/api/projects/:id/reflections', async (request, response, next) => {
  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : ''
  if (!text) return response.status(400).json({ error: 'text is required' })
  if (text.length > 4000) return response.status(400).json({ error: 'entry must be 4000 characters or fewer' })
  try {
    const row = await reflections.create(pool, request.userId, request.params.id, text)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.status(201).json(row)
  } catch (error) { next(error) }
})

app.delete('/api/projects/:id/reflections/:reflectionId', async (request, response, next) => {
  try {
    const removed = await reflections.remove(pool, request.userId, request.params.id, request.params.reflectionId)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    response.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/notes', async (request, response, next) => {
  try { response.json(await notes.getAll(pool, request.userId)) } catch (error) { next(error) }
})

app.post('/api/notes', async (request, response, next) => {
  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : ''
  const projectId = request.body?.project_id || null
  if (!text) return response.status(400).json({ error: 'text is required' })
  if (text.length > 500) return response.status(400).json({ error: 'text must be 500 characters or fewer' })
  try {
    if (projectId && !(await projects.ownedBy(pool, request.userId, projectId))) {
      return response.status(400).json({ error: 'project_id must be one of your own projects' })
    }
    response.status(201).json(await notes.create(pool, request.userId, text, projectId))
  } catch (error) { next(error) }
})

app.delete('/api/notes/:id', async (request, response, next) => {
  try {
    const removed = await notes.remove(pool, request.userId, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    response.status(204).end()
  } catch (error) { next(error) }
})

app.use((request, response) => response.status(404).json({ error: 'No such route' }))

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server' })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})