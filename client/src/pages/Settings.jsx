import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { friendlyAuthError } from '../utils/authErrors.js'
import Button from '../components/atoms/Button.jsx'

function Notice({ tone = 'notice', children }) {
  const border = tone === 'error' ? 'border-primary' : 'border-accent'
  return (
    <p className={`text-small text-ink bg-surface border-l-4 ${border} rounded px-3 py-2`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

export default function Settings() {
  const { user, hasPasswordProvider, updateDisplayName, changePassword, changeEmail } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isPasswordAccount = hasPasswordProvider()

  // Display name
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameResult, setNameResult] = useState(null)

  // Password
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwResult, setPwResult] = useState(null)

  // Email
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailResult, setEmailResult] = useState(null)

  async function submitName(e) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) return
    setNameBusy(true)
    setNameResult(null)
    try {
      await updateDisplayName(trimmed)
      setNameResult({ tone: 'notice', text: 'display name updated.' })
    } catch (caught) {
      setNameResult({ tone: 'error', text: friendlyAuthError(caught) })
    } finally {
      setNameBusy(false)
    }
  }

  async function submitPassword(e) {
    e.preventDefault()
    setPwResult(null)
    if (newPassword !== confirmPassword) {
      setPwResult({ tone: 'error', text: "new passwords don't match." })
      return
    }
    setPwBusy(true)
    try {
      await changePassword(currentPasswordForPw, newPassword)
      setPwResult({ tone: 'notice', text: 'password updated.' })
      setCurrentPasswordForPw('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (caught) {
      setPwResult({ tone: 'error', text: friendlyAuthError(caught) })
    } finally {
      setPwBusy(false)
    }
  }

  async function submitEmail(e) {
    e.preventDefault()
    setEmailResult(null)
    setEmailBusy(true)
    try {
      await changeEmail(currentPasswordForEmail, newEmail.trim())
      setEmailResult({
        tone: 'notice',
        text: `check ${newEmail.trim()} for a link to confirm the change — your sign-in email stays the same until then.`,
      })
      setCurrentPasswordForEmail('')
      setNewEmail('')
    } catch (caught) {
      setEmailResult({ tone: 'error', text: friendlyAuthError(caught) })
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-subheading-1 font-geist">settings</h1>

      <section className="space-y-3">
        <h2 className="text-subheading-2 font-geist">display name</h2>
        <form onSubmit={submitName} className="flex gap-2">
          <label className="sr-only" htmlFor="settings-display-name">Display name</label>
          <input
            id="settings-display-name"
            type="text"
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 bg-surface rounded-lg px-3 py-2 text-body"
          />
          <Button variant="accent2" type="submit" disabled={nameBusy || !displayName.trim()}>
            {nameBusy ? 'saving...' : 'save'}
          </Button>
        </form>
        {nameResult && <Notice tone={nameResult.tone}>{nameResult.text}</Notice>}
      </section>

      <section className="space-y-3">
        <h2 className="text-subheading-2 font-geist">appearance</h2>
        <div className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3">
          <span className="text-body flex-1">{theme === 'dark' ? 'dark mode' : 'light mode'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
            className={`relative w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-ink/20'}`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 w-5 h-5 rounded-full bg-canvas transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-subheading-2 font-geist">password</h2>
        {isPasswordAccount ? (
          <form onSubmit={submitPassword} className="space-y-3">
            <div>
              <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="current-password-pw">current password</label>
              <input id="current-password-pw" type="password" required value={currentPasswordForPw}
                onChange={(e) => setCurrentPasswordForPw(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
            </div>
            <div>
              <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="new-password">new password</label>
              <input id="new-password" type="password" required minLength={6} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
            </div>
            <div>
              <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="confirm-new-password">confirm new password</label>
              <input id="confirm-new-password" type="password" required minLength={6} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
            </div>
            {pwResult && <Notice tone={pwResult.tone}>{pwResult.text}</Notice>}
            <Button variant="accent2" type="submit" disabled={pwBusy}>
              {pwBusy ? 'updating...' : 'update password'}
            </Button>
          </form>
        ) : (
          <Notice>you signed in with Google, so there's no password on this account to change.</Notice>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-subheading-2 font-geist">email</h2>
        <p className="text-small text-ink/60">current: {user?.email}</p>
        <form onSubmit={submitEmail} className="space-y-3">
          {isPasswordAccount && (
            <div>
              <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="current-password-email">current password</label>
              <input id="current-password-email" type="password" required value={currentPasswordForEmail}
                onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
            </div>
          )}
          <div>
            <label className="block text-small font-medium text-ink/60 mb-1" htmlFor="new-email">new email</label>
            <input id="new-email" type="email" required value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-surface rounded-lg px-3 py-2 text-body" />
          </div>
          {!isPasswordAccount && (
            <p className="text-small text-ink/50">
              you'll be asked to confirm with Google before this change is made.
            </p>
          )}
          {emailResult && <Notice tone={emailResult.tone}>{emailResult.text}</Notice>}
          <Button variant="accent2" type="submit" disabled={emailBusy || !newEmail.trim()}>
            {emailBusy ? 'sending...' : 'change email'}
          </Button>
        </form>
      </section>
    </main>
  )
}
