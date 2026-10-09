import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listNotes, createNote, updateNote, deleteNote, listProjects } from '../api'
import Spinner from '../components/atoms/Spinner.jsx'
import StarIcon from '../components/atoms/StarIcon.jsx'
import { useToast } from '../context/ToastContext.jsx'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function QuickCapture() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [status, setStatus] = useState('loading')
  const [notes, setNotes] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState(null)
  const [text, setText] = useState('')
  const [projectId, setProjectId] = useState('')

  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editProjectId, setEditProjectId] = useState('')

  async function load() {
    setStatus('loading')
    try {
      const [noteRows, projectRows] = await Promise.all([listNotes(), listProjects()])
      setNotes(noteRows)
      setProjects(projectRows)
      setStatus('ready')
    } catch (caught) {
      setError(caught)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!openId) return
    function onKeyDown(e) {
      if (e.key === 'Escape') closeNote()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId])

  function projectTitle(id) {
    if (!id) return null
    return projects.find((p) => String(p.id) === String(id))?.title ?? null
  }

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    const textValue = text.trim()
    const linkedId = projectId || null
    setText('')
    setProjectId('')
    try {
      const created = await createNote(textValue, linkedId)
      setNotes((prev) => [created, ...prev])
    } catch (caught) {
      setError(caught)
    }
  }

  async function handleDelete(id) {
    const previous = notes
    setNotes(notes.filter((n) => n.id !== id)) // optimistic
    if (openId === id) closeNote()
    try {
      await deleteNote(id)
    } catch (caught) {
      setNotes(previous)
      setError(caught)
    }
  }

  function openNote(note) {
    setOpenId(note.id)
    setEditing(false)
  }

  function closeNote() {
    setOpenId(null)
    setEditing(false)
  }

  function startEdit(note) {
    setEditText(note.text)
    setEditProjectId(note.project_id ? String(note.project_id) : '')
    setEditing(true)
  }

  async function saveEdit(e, id) {
    e.preventDefault()
    if (!editText.trim()) return
    try {
      const updated = await updateNote(id, editText.trim(), editProjectId || null)
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      setEditing(false)
      notify('Saved!')
    } catch (caught) {
      setError(caught)
    }
  }

  const openNoteData = openId ? notes.find((n) => n.id === openId) : null

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <form onSubmit={submit} className="space-y-2 mb-6 animate-rise motion-reduce:animate-none">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="new-note">New idea</label>
          <textarea
            id="new-note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="jot an idea before you forget it..."
            rows={2}
            maxLength={2000}
            className="flex-1 bg-surface rounded-lg px-4 py-3 text-body outline-none resize-y"
          />
          <button
            type="submit"
            aria-label="Save note"
            className="bg-primary text-black rounded-lg px-4 border border-black self-end shrink-0"
          >
            →
          </button>
        </div>
        {projects.length > 0 && (
          <label className="flex items-center gap-2 text-small text-ink/60">
            link to a project (optional)
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-surface rounded px-2 py-1 text-small text-ink"
            >
              <option value="">no project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
        )}
      </form>

      {error && (
        <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2 mb-4" role="alert">
          {error.message}
        </p>
      )}
      {status === 'loading' && <div className="flex justify-center py-10"><Spinner /></div>}

      {status === 'ready' && (
        <ul className="space-y-2 animate-rise motion-reduce:animate-none" style={{ animationDelay: '0.1s' }}>
          {notes.length === 0 && (
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-accent shrink-0" />
              <p className="text-small text-ink/50">No notes yet.</p>
            </div>
          )}
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => openNote(note)}
                className="w-full flex items-start justify-between gap-3 bg-surface rounded-lg px-4 py-3 text-left hover:bg-ink/5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-body line-clamp-2 break-words">{note.text}</p>
                  <p className="text-small text-ink/50 mt-0.5">
                    {formatDateTime(note.created_at)}
                    {projectTitle(note.project_id) && <>{' — '}{projectTitle(note.project_id)}</>}
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Delete note"
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(note.id) } }}
                  className="text-ink/50 hover:text-ink shrink-0"
                >
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openNoteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-rise motion-reduce:animate-none"
            aria-hidden="true"
            onClick={closeNote}
          />
          <div className="relative w-full max-w-lg bg-canvas border border-ink/10 rounded-2xl shadow-lg p-6 animate-rise motion-reduce:animate-none">
            <button
              type="button"
              onClick={closeNote}
              aria-label="Close"
              className="absolute top-4 right-4 text-ink/50 hover:text-ink"
            >
              ×
            </button>

            {editing ? (
              <form onSubmit={(e) => saveEdit(e, openNoteData.id)} className="space-y-3 pr-6">
                <label className="sr-only" htmlFor="edit-note-text">Note text</label>
                <textarea
                  id="edit-note-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={8}
                  maxLength={2000}
                  autoFocus
                  className="w-full bg-surface rounded-lg px-3 py-2 text-body outline-none resize-y"
                />
                {projects.length > 0 && (
                  <label className="flex items-center gap-2 text-small text-ink/60">
                    link to a project
                    <select
                      value={editProjectId}
                      onChange={(e) => setEditProjectId(e.target.value)}
                      className="bg-surface rounded px-2 py-1 text-small text-ink"
                    >
                      <option value="">no project</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </label>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-black text-small font-mono uppercase rounded px-3 py-1.5 border border-black">
                    save
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="text-small text-ink/60 hover:text-ink">
                    cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="pr-6">
                <p className="text-body whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">{openNoteData.text}</p>
                <p className="text-small text-ink/50 mt-3">
                  {formatDateTime(openNoteData.created_at)}
                  {projectTitle(openNoteData.project_id) && (
                    <>
                      {' — '}
                      <button
                        type="button"
                        onClick={() => navigate(`/project/${openNoteData.project_id}`)}
                        className="underline hover:text-ink"
                      >
                        {projectTitle(openNoteData.project_id)}
                      </button>
                    </>
                  )}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => startEdit(openNoteData)}
                    className="text-small font-mono uppercase text-ink/60 hover:text-ink"
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(openNoteData.id)}
                    className="text-small font-mono uppercase text-ink/60 hover:text-ink"
                  >
                    delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
