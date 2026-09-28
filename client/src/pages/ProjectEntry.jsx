import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProject, createProject, updateProject, deleteProject, uploadFile, listKits } from '../api'
import ConfirmDelete from '../components/molecules/ConfirmDelete.jsx'
import Button from '../components/atoms/Button.jsx'
import IconButton from '../components/atoms/IconButton.jsx'
import useFileUrl from '../hooks/useFileUrl.js'

const emptyProject = { title: '', image_url: null, kit_id: '', notes_worked: '', notes_to_change: '' }

export default function ProjectEntry() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()

  const [status, setStatus] = useState(isNew ? 'ready' : 'loading')
  const [draft, setDraft] = useState(emptyProject)
  const [kits, setKits] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const imageUrl = useFileUrl(draft.image_url)

  async function load() {
    try {
      const kitRows = await listKits()
      setKits(kitRows)
      if (!isNew) {
        const project = await getProject(id)
        setDraft(project)
      }
      setStatus('ready')
    } catch (caught) {
      setError(caught)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { url } = await uploadFile(file)
      setDraft((d) => ({ ...d, image_url: url }))
    } catch (caught) {
      setError(caught)
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const project = await createProject(draft)
        navigate(`/project/${project.id}`)
      } else {
        await updateProject(id, draft)
      }
    } catch (caught) {
      setError(caught)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (deleting) return
    setDeleting(true)
    setError(null)
    try {
      await deleteProject(id)
      navigate('/library?tab=projects')
    } catch (caught) {
      setError(caught)
      setDeleting(false)
    }
  }

  if (status === 'loading') {
    return <main className="max-w-2xl mx-auto px-6 py-10"><p className="text-ink/60">loading...</p></main>
  }

  if (status === 'error') {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-primary" role="alert">
          {error.message} <button onClick={load} className="underline">try again</button>
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      {error && (
        <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2 mb-4" role="alert">
          {error.message}
        </p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <IconButton ariaLabel="Back to library" onClick={() => navigate('/library?tab=projects')} icon={<span aria-hidden="true">←</span>} />
        <label className="sr-only" htmlFor="project-title">Project title</label>
        <input
          id="project-title"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="project title"
          className="text-subheading-2 font-geist bg-transparent outline-none border-b border-transparent focus:border-ink/30 flex-1"
        />
        <Button variant="accent2" onClick={save}>{saving ? 'saving...' : 'save'}</Button>
      </div>

      <label
        htmlFor="project-image"
        className="block aspect-video bg-surface border border-dashed border-ink/20 rounded-lg mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Project draft" className="w-full h-full object-cover" />
        ) : (
          <span className="text-small text-ink/50">upload draft image (optional)</span>
        )}
        <input id="project-image" type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
      </label>

      <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="project-kit">brand kit</label>
      <select
        id="project-kit"
        value={draft.kit_id ?? ''}
        onChange={(e) => setDraft((d) => ({ ...d, kit_id: e.target.value || null }))}
        className="w-full bg-surface rounded-lg px-3 py-2 mb-4 text-body"
      >
        <option value="">no kit linked</option>
        {kits.map((kit) => <option key={kit.id} value={kit.id}>{kit.name}</option>)}
      </select>

      <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="project-reflection">
        reflection — what worked, what you'd change
      </label>
      <textarea
        id="project-reflection"
        value={draft.notes_worked}
        onChange={(e) => setDraft((d) => ({ ...d, notes_worked: e.target.value }))}
        rows={5}
        className="w-full bg-surface rounded-lg px-3 py-2 text-body resize-none"
        placeholder="what worked, what you'd change next time..."
      />

      {!isNew && (
        <div className="mt-8">
          <ConfirmDelete
            label="delete project"
            message="delete this project for good? this can't be undone."
            onConfirm={remove}
            busy={deleting}
          />
        </div>
      )}
    </main>
  )
}
