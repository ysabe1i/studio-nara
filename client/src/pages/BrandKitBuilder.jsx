import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getKit, createKit, updateKit, deleteKit, uploadFile, listProjects } from '../api'
import ConfirmDelete from '../components/molecules/ConfirmDelete.jsx'
import ColorRow from '../components/molecules/ColorRow.jsx'
import LogoThumbnail from '../components/molecules/LogoThumbnail.jsx'
import FontPreviewCard from '../components/molecules/FontPreviewCard.jsx'
import Button from '../components/atoms/Button.jsx'
import IconButton from '../components/atoms/IconButton.jsx'

const emptyKit = { name: '', tag: '', colors: [], logos: [], fonts: [] }

function tempId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`
}

export default function BrandKitBuilder() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()

  const [status, setStatus] = useState(isNew ? 'ready' : 'loading')
  const [draft, setDraft] = useState(emptyKit)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [linkedProjects, setLinkedProjects] = useState([])
  const [deleting, setDeleting] = useState(false)

  async function load() {
    if (isNew) return
    setStatus('loading')
    try {
      const kit = await getKit(id)
      setDraft(kit)
      const projects = await listProjects()
      setLinkedProjects(projects.filter((p) => String(p.kit_id) === String(id)))
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

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const kit = await createKit(draft)
        navigate(`/kit/${kit.id}`)
      } else {
        await updateKit(id, draft)
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
      await deleteKit(id)
      navigate('/library?tab=kits')
    } catch (caught) {
      setError(caught)
      setDeleting(false)
    }
  }

  function addColor(hex = '#FF00AE') {
    setDraft((d) => ({ ...d, colors: [...d.colors, { id: tempId('color'), hex, name: '' }] }))
  }
  function updateColorName(colorId, name) {
    setDraft((d) => ({
      ...d,
      colors: d.colors.map((c) => (c.id === colorId ? { ...c, name } : c)),
    }))
  }
  function updateColorHex(colorId, hex) {
    setDraft((d) => ({
      ...d,
      colors: d.colors.map((c) => (c.id === colorId ? { ...c, hex } : c)),
    }))
  }
  function removeColor(colorId) {
    setDraft((d) => ({ ...d, colors: d.colors.filter((c) => c.id !== colorId) }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { url } = await uploadFile(file)
      setDraft((d) => ({ ...d, logos: [...d.logos, { id: tempId('logo'), file_path: url, label: file.name }] }))
    } catch (caught) {
      setError(caught)
    }
  }
  function removeLogo(logoId) {
    setDraft((d) => ({ ...d, logos: d.logos.filter((l) => l.id !== logoId) }))
  }

  async function handleFontUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { url } = await uploadFile(file)
      const familyName = file.name.replace(/\.[^/.]+$/, '')
      setDraft((d) => ({
        ...d,
        fonts: [...d.fonts, { id: tempId('font'), file_path: url, font_family_name: familyName, label: file.name }],
      }))
    } catch (caught) {
      setError(caught)
    }
  }
  function removeFont(fontId) {
    setDraft((d) => ({ ...d, fonts: d.fonts.filter((f) => f.id !== fontId) }))
  }

  if (status === 'loading') {
    return <main className="max-w-5xl mx-auto px-6 py-10"><p className="text-ink/60">loading...</p></main>
  }

  if (status === 'error') {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-primary" role="alert">
          {error.message} <button onClick={load} className="underline">try again</button>
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {error && (
        <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2 mb-4" role="alert">
          {error.message}
        </p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <IconButton ariaLabel="Back" onClick={() => navigate(-1)} icon={<span aria-hidden="true">←</span>} />
        <div className="flex-1 flex gap-3">
          <label className="sr-only" htmlFor="kit-name">Kit name</label>
          <input
            id="kit-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="kit name"
            className="text-subheading-2 font-geist bg-transparent outline-none border-b border-transparent focus:border-ink/30 flex-1"
          />
          <label className="sr-only" htmlFor="kit-tag">Tag</label>
          <input
            id="kit-tag"
            value={draft.tag}
            onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}
            placeholder="tag"
            className="text-body bg-transparent outline-none border-b border-transparent focus:border-ink/30 w-40"
          />
        </div>
        <Button variant="accent2" onClick={save} disabled={saving}>{saving ? 'saving...' : 'save'}</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <section>
          <h2 className="text-subheading-2 font-geist mb-3">colors</h2>
          <div className="space-y-2 mb-3">
            {draft.colors.map((c) => (
              <ColorRow
                key={c.id}
                hex={c.hex}
                name={c.name}
                onNameChange={(name) => updateColorName(c.id, name)}
                onHexChange={(hex) => updateColorHex(c.id, hex)}
                onAddHarmonyColor={(hex) => addColor(hex)}
                onRemove={() => removeColor(c.id)}
              />
            ))}
          </div>
          <button type="button" onClick={() => addColor()} className="text-small text-ink/60 hover:text-ink">
            + add color
          </button>
        </section>

        <section>
          <h2 className="text-subheading-2 font-geist mb-3">logos</h2>
          <div className="space-y-2 mb-3">
            {draft.logos.map((l) => (
              <LogoThumbnail key={l.id} src={l.file_path} label={l.label} onRemove={() => removeLogo(l.id)} />
            ))}
          </div>
          <label className="text-small text-ink/60 hover:text-ink cursor-pointer">
            + upload logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" />
          </label>
        </section>

        <section>
          <h2 className="text-subheading-2 font-geist mb-3">fonts</h2>
          <div className="space-y-2 mb-3">
            {draft.fonts.map((f) => (
              <FontPreviewCard
                key={f.id}
                fontFamilyName={f.font_family_name}
                fileUrl={f.file_path}
                onRemove={() => removeFont(f.id)}
              />
            ))}
          </div>
          <label className="text-small text-ink/60 hover:text-ink cursor-pointer">
            + upload font
            <input type="file" accept=".woff,.woff2,.ttf,.otf" onChange={handleFontUpload} className="sr-only" />
          </label>
        </section>
      </div>

      {!isNew && (
        <section className="mt-8 bg-surface rounded-lg p-4">
          <h2 className="text-small font-semibold text-ink/60 mb-2">linked projects</h2>
          {linkedProjects.length === 0 ? (
            <p className="text-small text-ink/50">No projects use this kit yet.</p>
          ) : (
            <ul className="text-body space-y-1">
              {linkedProjects.map((p) => <li key={p.id}>{p.title}</li>)}
            </ul>
          )}
        </section>
      )}

      {!isNew && (
        <div className="mt-8">
          <ConfirmDelete
            label="delete kit"
            message={
              linkedProjects.length > 0
                ? linkedProjects.length === 1
                  ? "delete this kit for good? its linked project will stay, but lose its kit link. this can't be undone."
                  : `delete this kit for good? its ${linkedProjects.length} linked projects will stay, but lose their kit link. this can't be undone.`
                : "delete this kit for good? this can't be undone."
            }
            onConfirm={remove}
            busy={deleting}
          />
        </div>
      )}
    </main>
  )
}
