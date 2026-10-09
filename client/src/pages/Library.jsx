import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listKits, listProjects } from '../api'
import Card from '../components/molecules/Card.jsx'
import KitPreview from '../components/molecules/KitPreview.jsx'
import Spinner from '../components/atoms/Spinner.jsx'

export default function Library() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'projects' ? 'projects' : 'kits')
  const [status, setStatus] = useState('loading')
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function load() {
    setStatus('loading')
    setError(null)
    try {
      const rows = tab === 'kits' ? await listKits() : await listProjects()
      setItems(rows)
      setStatus('ready')
    } catch (caught) {
      setError(caught)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div
        className="flex items-center gap-2 mb-8 animate-rise motion-reduce:animate-none"
        role="tablist"
        aria-label="Library"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'kits'}
          onClick={() => setTab('kits')}
          className={`px-4 py-2 rounded-full text-small font-medium ${
            tab === 'kits' ? 'bg-primary text-black' : 'bg-surface text-ink/70'
          }`}
        >
          kits
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'projects'}
          onClick={() => setTab('projects')}
          className={`px-4 py-2 rounded-full text-small font-medium ${
            tab === 'projects' ? 'bg-primary text-black' : 'bg-surface text-ink/70'
          }`}
        >
          projects
        </button>
      </div>

      {status === 'loading' && <div className="flex justify-center py-10"><Spinner /></div>}

      {status === 'error' && (
        <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2" role="alert">
          {error.message} <button onClick={load} className="underline">try again</button>
        </p>
      )}

      {status === 'ready' && (
        <div
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 animate-rise motion-reduce:animate-none"
          style={{ animationDelay: '0.1s' }}
        >
          {items.map((item) =>
            tab === 'kits' ? (
              <Card
                key={item.id}
                title={item.name}
                subtitle={item.tag}
                preview={<KitPreview colors={item.colors} logos={item.logos} fonts={item.fonts} />}
                onClick={() => navigate(`/kit/${item.id}`)}
              />
            ) : (
              <Card
                key={item.id}
                title={item.title}
                thumbnail={item.image_url}
                onClick={() => navigate(`/project/${item.id}`)}
              />
            )
          )}

          <button
            type="button"
            onClick={() => navigate(tab === 'kits' ? '/kit/new' : '/project/new')}
            className="border-2 border-dashed border-ink/20 rounded-2xl flex items-center justify-center text-ink/50 hover:border-ink/40 hover:text-ink/70 min-h-[140px]"
          >
            + new {tab === 'kits' ? 'kit' : 'project'}
          </button>
        </div>
      )}
    </main>
  )
}
