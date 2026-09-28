import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
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

  async function signup(email, password) {
    const { user: created } = await createUserWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(created)
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, loginWithGoogle, resendVerification, refreshVerification, logout }}
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
