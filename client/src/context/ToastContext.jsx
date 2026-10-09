import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

// Lives above the router, so a toast fired right before a redirect (saving a
// new kit navigates to /kit/:id immediately) still has somewhere to render.
export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null)
  const timerRef = useRef(null)

  const notify = useCallback((text = 'Saved!') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(text)
    timerRef.current = setTimeout(() => setMessage(null), 1600)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" role="status" aria-live="polite">
          <div className="absolute inset-0 bg-ink/10 backdrop-blur-sm animate-rise motion-reduce:animate-none" aria-hidden="true" />
          <div className="relative bg-canvas/80 backdrop-blur-md border border-ink/10 rounded-2xl px-8 py-5 shadow-lg animate-rise motion-reduce:animate-none">
            <p className="text-subheading-2 font-geist text-ink">{message}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
