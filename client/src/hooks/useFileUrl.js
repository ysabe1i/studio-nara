import { useEffect, useState } from 'react'
import { getFileUrl } from '../api/files.js'

export default function useFileUrl(path) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    if (!path) return
    getFileUrl(path)
      .then((resolved) => { if (!cancelled) setUrl(resolved) })
      .catch(() => { if (!cancelled) setUrl(null) })
    return () => { cancelled = true }
  }, [path])

  return url
}
