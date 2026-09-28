import { auth } from '../firebase.js'

const BASE = import.meta.env.VITE_API_BASE_URL || ''
const cache = new Map()

// Stored uploads look like "/api/files/<uuid>" (older rows may have the
// API host in front). Anything else, like a demo-mode blob: URL, is
// already displayable and passes straight through.
export function getFileUrl(path) {
  const match = typeof path === 'string' ? path.match(/\/api\/files\/[0-9a-f-]{36}$/i) : null
  if (!match) return Promise.resolve(path || null)

  const key = match[0]
  if (!cache.has(key)) {
    const promise = (async () => {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null
      const response = await fetch(`${BASE}${key}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      return URL.createObjectURL(await response.blob())
    })()
    promise.catch(() => cache.delete(key))
    cache.set(key, promise)
  }
  return cache.get(key)
}

// Called on log out so the next person on this browser can't reuse
// the previous account's loaded files.
export function clearFileCache() {
  for (const promise of cache.values()) {
    promise.then((url) => URL.revokeObjectURL(url)).catch(() => {})
  }
  cache.clear()
}
