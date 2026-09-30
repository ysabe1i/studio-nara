import { auth } from '../firebase.js'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null
  const headers = options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE}${path}`, { headers, ...options })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // body wasn't JSON
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

export const listKits = () => request('/api/kits')
export const getKit = (id) => request(`/api/kits/${id}`)
export const createKit = (input) => request('/api/kits', { method: 'POST', body: JSON.stringify(input) })
export const updateKit = (id, input) => request(`/api/kits/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteKit = (id) => request(`/api/kits/${id}`, { method: 'DELETE' })

export const listProjects = () => request('/api/projects')
export const getProject = (id) => request(`/api/projects/${id}`)
export const createProject = (input) => request('/api/projects', { method: 'POST', body: JSON.stringify(input) })
export const updateProject = (id, input) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteProject = (id) => request(`/api/projects/${id}`, { method: 'DELETE' })

export const listReflections = (projectId) => request(`/api/projects/${projectId}/reflections`)
export const createReflection = (projectId, text) =>
  request(`/api/projects/${projectId}/reflections`, { method: 'POST', body: JSON.stringify({ text }) })

export const listNotes = () => request('/api/notes')
export const createNote = (text, projectId) =>
  request('/api/notes', { method: 'POST', body: JSON.stringify({ text, project_id: projectId ?? null }) })
export const deleteNote = (id) => request(`/api/notes/${id}`, { method: 'DELETE' })

export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/api/uploads', { method: 'POST', body: form })
}