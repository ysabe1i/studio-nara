import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listNotes, createNote, updateNote, deleteNote, listProjects } from '../api'
import Spinner from '../components/atoms/Spinner.jsx'
import StarIcon from '../components/atoms/StarIcon.jsx'
import { useToast } from '../context/ToastContext.jsx'

const COLLAPSE_LENGTH = 180

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

  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editProjectId, setEditProjectId] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())

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
    try {
      await deleteNote(id)
    } catch (caught) {
      setNotes(previous)
      setError(caught)
    }
  }

  function startEdit(note) {
    setEditingId(note.id)
    setEditText(note.text)
    setEditProjectId(note.project_id ? String(note.project_id) : '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(e, id) {
    e.preventDefault()
    if (!editText.trim()) return
    try {
      const updated = await updateNote(id, editText.trim(), editProjectId || null)
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      setEditingId(null)
      notify('Saved!')
    } catch (caught) {
      setError(caught)
    }
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          {notes.map((note) => {
            const isLong = note.text.length > COLLAPSE_LENGTH
            const isExpanded = expandedIds.has(note.id)
            const shown = isLong && !isExpanded ? `${note.text.slice(0, COLLAPSE_LENGTH).trimEnd()}…` : note.text

            return (
              <li key={note.id} className="bg-surface rounded-lg px-4 py-3">
                {editingId === note.id ? (
                  <form onSubmit={(e) => saveEdit(e, note.id)} className="space-y-2">
                    <label className="sr-only" htmlFor={`edit-text-${note.id}`}>Note text</label>
                    <textarea
                      id={`edit-text-${note.id}`}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      autoFocus
                      className="w-full bg-canvas rounded-lg px-3 py-2 text-body outline-none resize-y"
                    />
                    {projects.length > 0 && (
                      <label className="flex items-center gap-2 text-small text-ink/60">
                        link to a project
                        <select
                          value={editProjectId}
                          onChange={(e) => setEditProjectId(e.target.value)}
                          className="bg-canvas rounded px-2 py-1 text-small text-ink"
                        >
                          <option value="">no project</option>
                          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </label>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" className="bg-primary text-black text-small font-mono uppercase rounded px-3 py-1 border border-black">
                        save
                      </button>
                      <button type="button" onClick={cancelEdit} className="text-small text-ink/60 hover:text-ink">
                        cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body whitespace-pre-wrap break-words">{shown}</p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(note.id)}
                          className="text-small text-primary hover:underline mt-0.5"
                        >
                          {isExpanded ? 'show less' : 'show more'}
                        </button>
                      )}
                      <p className="text-small text-ink/50 mt-0.5">
                        {formatDateTime(note.created_at)}
                        {projectTitle(note.project_id) && (
                          <>
                            {' — '}
                            <button
                              type="button"
                              onClick={() => navigate(`/project/${note.project_id}`)}
                              className="underline hover:text-ink"
                            >
                              {projectTitle(note.project_id)}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        aria-label="Edit note"
                        className="text-small text-ink/50 hover:text-ink"
                      >
                        edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        aria-label="Delete note"
                        className="text-ink/50 hover:text-ink"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
