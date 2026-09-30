// The simulated backend.
//
// Same function names, same return types, and the same shape of failure as
// httpApi.js, so your components cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.
//
// This exists so the template's GitHub Pages link works on day one and so you
// can build the interface before your API is deployed. It is NOT a finished
// project. See content/extending-your-app page 3.

import seed from './seed.json'

const KEY = 'nara:data'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(KEY)
    }
  }
  localStorage.setItem(KEY, JSON.stringify(seed))
  return structuredClone(seed)
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}

function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`
}

// ---------- kits ----------

export async function listKits() {
  await delay()
  return read().kits.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getKit(id) {
  await delay()
  const found = read().kits.find((k) => String(k.id) === String(id))
  if (!found) throw new Error('Not found')
  return found
}

export async function createKit(input) {
  await delay()
  const data = read()
  const created = {
    id: newId('kit'),
    name: input.name ?? '',
    tag: input.tag ?? '',
    colors: input.colors ?? [],
    logos: input.logos ?? [],
    fonts: input.fonts ?? [],
    created_at: new Date().toISOString(),
  }
  data.kits.push(created)
  write(data)
  return created
}

export async function updateKit(id, input) {
  await delay()
  const data = read()
  const index = data.kits.findIndex((k) => String(k.id) === String(id))
  if (index === -1) throw new Error('Not found')
  data.kits[index] = { ...data.kits[index], ...input }
  write(data)
  return data.kits[index]
}

export async function deleteKit(id) {
  await delay()
  const data = read()
  data.kits = data.kits.filter((k) => String(k.id) !== String(id))
  // Same as the database's ON DELETE SET NULL: projects survive, unlinked.
  data.projects = data.projects.map((p) => (String(p.kit_id) === String(id) ? { ...p, kit_id: null } : p))
  write(data)
}

// ---------- projects ----------

export async function listProjects() {
  await delay()
  return read().projects.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getProject(id) {
  await delay()
  const found = read().projects.find((p) => String(p.id) === String(id))
  if (!found) throw new Error('Not found')
  return found
}

export async function createProject(input) {
  await delay()
  const data = read()
  const created = {
    id: newId('project'),
    title: input.title ?? '',
    image_url: input.image_url ?? null,
    kit_id: input.kit_id ?? null,
    notes_worked: input.notes_worked ?? '',
    notes_to_change: input.notes_to_change ?? '',
    created_at: new Date().toISOString(),
  }
  data.projects.push(created)
  write(data)
  return created
}

export async function updateProject(id, input) {
  await delay()
  const data = read()
  const index = data.projects.findIndex((p) => String(p.id) === String(id))
  if (index === -1) throw new Error('Not found')
  data.projects[index] = { ...data.projects[index], ...input }
  write(data)
  return data.projects[index]
}

export async function deleteProject(id) {
  await delay()
  const data = read()
  data.projects = data.projects.filter((p) => String(p.id) !== String(id))
  // Same as the database: reflections cascade-delete with their project,
  // but notes just lose the link (ON DELETE SET NULL).
  if (data.reflections) data.reflections = data.reflections.filter((r) => String(r.project_id) !== String(id))
  data.notes = data.notes.map((n) => (String(n.project_id) === String(id) ? { ...n, project_id: null } : n))
  write(data)
}

// ---------- project reflections ----------

export async function listReflections(projectId) {
  await delay()
  const data = read()
  if (!data.reflections) data.reflections = []
  return data.reflections
    .filter((r) => String(r.project_id) === String(projectId))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createReflection(projectId, text) {
  await delay()
  const data = read()
  if (!data.reflections) data.reflections = []
  const created = { id: newId('reflection'), project_id: projectId, text, created_at: new Date().toISOString() }
  data.reflections.push(created)
  write(data)
  return created
}

// ---------- quick notes ----------

export async function listNotes() {
  await delay()
  return read().notes.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createNote(text, projectId) {
  await delay()
  const data = read()
  const created = { id: newId('note'), text, project_id: projectId ?? null, created_at: new Date().toISOString() }
  data.notes.push(created)
  write(data)
  return created
}

export async function deleteNote(id) {
  await delay()
  const data = read()
  data.notes = data.notes.filter((n) => String(n.id) !== String(id))
  write(data)
}

// ---------- uploads ----------
// In demo mode there is nowhere to actually store a file, so this just hands
// back a browser-local object URL. It behaves like a real upload (an async
// call that returns a URL) but the file never leaves this tab and is gone on
// reload, same as everything else in demo mode.
export async function uploadFile(file) {
  await delay(100)
  return { url: URL.createObjectURL(file) }
}
