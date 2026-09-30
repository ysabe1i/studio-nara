const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'an account with this email already exists — try logging in.',
  'auth/invalid-credential': 'wrong email or password.',
  'auth/wrong-password': 'wrong password.',
  'auth/invalid-email': "that email doesn't look right.",
  'auth/weak-password': 'password needs at least 6 characters.',
  'auth/too-many-requests': 'too many attempts — wait a bit and try again.',
  'auth/network-request-failed': "couldn't reach the server — check your connection.",
  'auth/requires-recent-login': 'please confirm your current password to make this change.',
}

// Returns null for a closed popup (not really an error) or an already-friendly
// message thrown by our own code (e.g. "enter your current password...").
export function friendlyAuthError(caught) {
  if (caught?.code === 'auth/popup-closed-by-user' || caught?.code === 'auth/cancelled-popup-request') return null
  if (!caught?.code) return caught?.message || 'something went wrong.'
  return ERROR_MESSAGES[caught.code] || caught.message || 'something went wrong.'
}
