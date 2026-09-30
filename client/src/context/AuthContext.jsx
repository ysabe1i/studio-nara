import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
} from 'firebase/auth'
import { auth } from '../firebase.js'
import { clearFileCache } from '../api/files.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Bumped after user.reload() so consumers re-render with the fresh
  // emailVerified flag (Firebase mutates the same user object in place).
  const [, setVersion] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signup(email, password, displayName) {
    const { user: created } = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(created, { displayName })
    await sendEmailVerification(created)
    setVersion((v) => v + 1) // displayName is set on the same user object; re-render to show it
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function resendVerification() {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  }

  // Re-reads the account from Firebase and force-refreshes the ID token so
  // the server's email_verified check sees the new value.
  async function refreshVerification() {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    await auth.currentUser.getIdToken(true)
    setVersion((v) => v + 1)
    return auth.currentUser.emailVerified
  }

  async function logout() {
    clearFileCache()
    await signOut(auth)
  }

  function hasPasswordProvider() {
    return Boolean(auth.currentUser?.providerData.some((p) => p.providerId === 'password'))
  }

  // Firebase requires a "recent" sign-in before password/email changes.
  // Password accounts re-prove it with the current password; Google accounts
  // re-prove it by reopening the Google popup — there's no password to ask for.
  async function reauthenticate(currentPassword) {
    if (!auth.currentUser) throw new Error('Not signed in')
    if (hasPasswordProvider()) {
      if (!currentPassword) throw new Error('Enter your current password to confirm this change.')
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
    } else {
      await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())
    }
  }

  async function updateDisplayName(displayName) {
    if (!auth.currentUser) return
    await updateProfile(auth.currentUser, { displayName })
    setVersion((v) => v + 1)
  }

  async function changePassword(currentPassword, newPassword) {
    await reauthenticate(currentPassword)
    await updatePassword(auth.currentUser, newPassword)
  }

  // Firebase's modern flow: the account keeps its old email until the user
  // clicks the verification link sent to the new one, rather than switching
  // immediately (updateEmail) with no confirmation the new address is real.
  async function changeEmail(currentPassword, newEmail) {
    await reauthenticate(currentPassword)
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        resendVerification,
        refreshVerification,
        logout,
        hasPasswordProvider,
        updateDisplayName,
        changePassword,
        changeEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
