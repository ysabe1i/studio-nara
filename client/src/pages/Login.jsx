import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/atoms/Button.jsx'
import StudioNaraWordmark from '../components/atoms/StudioNaraWordmark.jsx'
import naraMascot from '../assets/nara-logo.svg'
import { friendlyAuthError } from '../utils/authErrors.js'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function Login() {
  const { user, login, signup, loginWithGoogle, resendVerification, refreshVerification, logout } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const awaitingVerification = Boolean(user && !user.emailVerified)

  // Coming back from the email tab: re-check verification automatically.
  useEffect(() => {
    if (!awaitingVerification) return
    const check = () => { refreshVerification().catch(() => {}) }
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [awaitingVerification, refreshVerification])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  if (user?.emailVerified) {
    // Always land on Home after logging in, not on whatever page the
    // user was on when they logged out.
    return <Navigate to="/" replace />
  }

  function switchMode(next) {
    setMode(next)
    setError(null)
    setConfirm('')
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (mode === 'signup' && password !== confirm) {
      setError("passwords don't match.")
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, displayName.trim())
      }
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError(null)
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  async function checkVerified() {
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const verified = await refreshVerification()
      if (!verified) setNotice("not verified yet — click the link in your email first.")
    } catch (caught) {
      setError(friendlyAuthError(caught))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    setNotice(null)
    try {
      await resendVerification()
      setNotice('sent — check your inbox (and spam).')
      setResendCooldown(30)
    } catch (caught) {
      setError(friendlyAuthError(caught))
    }
  }

  return (
    <div
      className="relative overflow-hidden min-h-[calc(100vh-4.0625rem)]"
      // --u = 1/100 of the 1440px Figma frame width (capped), so the mascot
      // scales with the viewport but never grows past its Figma size.
      style={{ '--u': 'min(1vw, 14.4px)' }}
    >
      {/* Figma: 504px star tilted 7.5deg counterclockwise, sitting flush at
          the left/bottom edges (its lower leg is cut by the frame). Outer
          element slides in from the right, the middle one holds the resting
          tilt, and the image does the hops. */}
      <div
        aria-hidden="true"
        className="absolute z-0 pointer-events-none animate-mascot-cross motion-reduce:animate-none will-change-transform"
        style={{
          left: 0,
          bottom: 0,
          width: 'calc(var(--u) * 35)',
        }}
      >
        <div style={{ transform: 'rotate(-7.5deg)' }}>
          <img
            src={naraMascot}
            alt=""
            className="block w-full h-auto animate-mascot-hop motion-reduce:animate-none will-change-transform"
          />
        </div>
      </div>

    <main className="relative z-10 max-w-3xl mx-auto px-6 py-16">
      <div className="flex flex-col items-center mb-10">
        <div
          className="bg-accent flex items-center justify-center w-[273px] h-[66px] mb-1 animate-rise motion-reduce:animate-none"
          style={{ clipPath: 'polygon(12.56% 0, 100% 0, 87.44% 100%, 0 100%)' }}
        >
          <span className="font-geist font-medium text-[32px] text-black">welcome to</span>
        </div>
        <div className="w-full flex justify-center animate-rise motion-reduce:animate-none" style={{ animationDelay: '0.15s' }}>
          <StudioNaraWordmark className="w-full max-w-[696px] h-auto" />
        </div>
      </div>

      <div className="max-w-[348px] mx-auto animate-rise motion-reduce:animate-none" style={{ animationDelay: '0.3s' }}>
        {awaitingVerification ? (
          <div className="space-y-4 text-center">
            <h1 className="font-geist text-subheading-2">check your email</h1>
            <p className="text-body text-ink/70">
              we sent a verification link to <span className="font-medium text-ink break-all">{user.email}</span>.
              click it, then come back here.
            </p>

            {notice && <p className="text-small text-ink bg-surface border-l-4 border-accent rounded px-3 py-2 text-left" role="status">{notice}</p>}
            {error && <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2 text-left" role="alert">{error}</p>}

            <Button variant="accent2" onClick={checkVerified} disabled={busy} className="w-full justify-center">
              {busy ? 'checking...' : "i've verified"}
            </Button>
            <Button variant="outline" onClick={resend} disabled={resendCooldown > 0} className="w-full justify-center">
              {resendCooldown > 0 ? `resend in ${resendCooldown}s` : 'resend email'}
            </Button>
            <button type="button" onClick={logout} className="text-small text-ink/60 hover:text-ink underline">
              use a different account
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6 justify-center">
              <button type="button" onClick={() => switchMode('login')}
                className={`px-4 py-2 rounded-full text-small font-medium ${mode === 'login' ? 'bg-primary text-black' : 'bg-surface text-ink/70'}`}>
                log in
              </button>
              <button type="button" onClick={() => switchMode('signup')}
                className={`px-4 py-2 rounded-full text-small font-medium ${mode === 'signup' ? 'bg-primary text-black' : 'bg-surface text-ink/70'}`}>
                sign up
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="display-name">display name</label>
                  <input id="display-name" type="text" required maxLength={80} value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
                </div>
              )}
              <div>
                <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="email">email</label>
                <input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
              </div>
              <div>
                <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="password">password</label>
                <input id="password" type="password" required minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
              </div>
              {mode === 'signup' && (
                <div>
                  <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="confirm">confirm password</label>
                  <input id="confirm" type="password" required minLength={6} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
                </div>
              )}

              {error && <p className="text-small text-ink bg-surface border-l-4 border-primary rounded px-3 py-2" role="alert">{error}</p>}

              <Button variant="accent2" type="submit" disabled={busy} className="w-full justify-center">
                {busy ? 'please wait...' : mode === 'login' ? 'log in' : 'create account'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-4" aria-hidden="true">
              <span className="flex-1 h-px bg-ink/15" />
              <span className="text-small text-ink/50">or</span>
              <span className="flex-1 h-px bg-ink/15" />
            </div>

            <Button variant="outline" onClick={google} disabled={busy} className="w-full flex items-center justify-center gap-3">
              <GoogleMark />
              continue with google
            </Button>
          </>
        )}
      </div>
    </main>
    </div>
  )
}