import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listNotes, createNote, deleteNote, listProjects } from '../api'
import Spinner from '../components/atoms/Spinner.jsx'
import StarIcon from '../components/atoms/StarIcon.jsx'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function QuickCapture() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [notes, setNotes] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState(null)
  const [text, setText] = useState('')
  const [projectId, setProjectId] = useState('')

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
    const value = text.trim()
    const linkedId = projectId || null
    setText('')
    setProjectId('')
    try {
      const created = await createNote(value, linkedId)
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

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <form onSubmit={submit} className="space-y-2 mb-6 animate-rise motion-reduce:animate-none">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="new-note">New idea</label>
          <input
            id="new-note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="jot an idea before you forget it..."
            className="flex-1 bg-surface rounded-lg px-4 py-3 text-body outline-none"
          />
          <button
            type="submit"
            aria-label="Save note"
            className="bg-primary text-black rounded-lg px-4 border border-black"
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
            <li key={note.id} className="flex items-start justify-between bg-surface rounded-lg px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-body">{note.text}</p>
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
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                aria-label="Delete note"
                className="text-ink/50 hover:text-ink shrink-0"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
