import { useState } from 'react'
import Button from '../atoms/Button.jsx'

/**
 * ConfirmDelete — molecule. Two-step delete: a quiet text button that swaps
 * for "are you sure?" + confirm/cancel, so a stray click can't destroy data.
 * Props: label ("delete kit"), message (what will happen), onConfirm (async),
 * busy (true while the delete request is running).
 */
export default function ConfirmDelete({ label, message, onConfirm, busy = false }) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <Button variant="outline" onClick={() => setAsking(true)}>
        {label}
      </Button>
    )
  }

  return (
    <div className="bg-surface border-l-4 border-primary rounded px-4 py-3 space-y-3" role="alertdialog" aria-label={label}>
      <p className="text-small text-ink">{message}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onConfirm} disabled={busy}>
          {busy ? 'deleting...' : 'yes, delete'}
        </Button>
        <Button variant="outline" onClick={() => setAsking(false)} disabled={busy}>
          cancel
        </Button>
      </div>
    </div>
  )
}
