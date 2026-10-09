import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listKits, listProjects } from '../api'
import Card from '../components/molecules/Card.jsx'
import KitPreview from '../components/molecules/KitPreview.jsx'
import Button from '../components/atoms/Button.jsx'
import Spinner from '../components/atoms/Spinner.jsx'
import StarIcon from '../components/atoms/StarIcon.jsx'

export default function Home() {
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [kits, setKits] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function load() {
    setStatus('loading')
    setError(null)
    try {
      const [kitRows, projectRows] = await Promise.all([listKits(), listProjects()])
      setKits(kitRows)
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

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-geist text-subheading-1 mb-8 animate-rise motion-reduce:animate-none">welcome back</h1>

      {status === 'loading' && <div className="flex justify-center py-10"><Spinner /></div>}

      {status === 'error' && (
        <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2" role="alert">
          {error.message} <button onClick={load} className="underline">try again</button>
        </p>
      )}

      {status === 'ready' && (
        <>
          <div
            className="grid md:grid-cols-2 gap-8 animate-rise motion-reduce:animate-none"
            style={{ animationDelay: '0.1s' }}
          >
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-subheading-2 font-geist">recent kits</h2>
                <button
                  type="button"
                  onClick={() => navigate('/library?tab=kits')}
                  className="text-small text-ink/60 hover:text-ink"
                >
                  view all →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {kits.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center gap-2 py-6 text-center">
                    <StarIcon className="w-6 h-6 text-accent" />
                    <p className="text-small text-ink/50">No kits yet.</p>
                  </div>
                )}
                {kits.slice(0, 4).map((kit) => (
                  <Card
                    key={kit.id}
                    title={kit.name}
                    subtitle={kit.tag}
                    preview={<KitPreview colors={kit.colors} logos={kit.logos} fonts={kit.fonts} />}
                    onClick={() => navigate(`/kit/${kit.id}`)}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-subheading-2 font-geist">recent projects</h2>
                <button
                  type="button"
                  onClick={() => navigate('/library?tab=projects')}
                  className="text-small text-ink/60 hover:text-ink"
                >
                  view all →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {projects.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center gap-2 py-6 text-center">
                    <StarIcon className="w-6 h-6 text-accent" />
                    <p className="text-small text-ink/50">No projects yet.</p>
                  </div>
                )}
                {projects.slice(0, 4).map((project) => (
                  <Card
                    key={project.id}
                    title={project.title}
                    thumbnail={project.image_url}
                    onClick={() => navigate(`/project/${project.id}`)}
                  />
                ))}
              </div>
            </section>
          </div>

          <div
            className="flex gap-3 mt-10 animate-rise motion-reduce:animate-none"
            style={{ animationDelay: '0.2s' }}
          >
            <Button variant="accent2" onClick={() => navigate('/kit/new')}>new kit</Button>
            <Button variant="accent1" onClick={() => navigate('/project/new')}>new project</Button>
          </div>
        </>
      )}
    </main>
  )
}
