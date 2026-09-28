import { useEffect, useState } from 'react'
import useFileUrl from '../../hooks/useFileUrl.js'

// Loads an uploaded font file via the FontFace API so the "Aa" sample can
// render in the kit's actual font, same technique as FontPreviewCard.
function useLoadedFont(fontFamilyName, fileUrl) {
  const [ready, setReady] = useState(false)
  const resolvedUrl = useFileUrl(fileUrl)

  useEffect(() => {
    if (!resolvedUrl || !fontFamilyName) return
    let cancelled = false
    const face = new FontFace(fontFamilyName, `url(${resolvedUrl})`)
    face
      .load()
      .then((loadedFace) => {
        if (cancelled) return
        document.fonts.add(loadedFace)
        setReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [fontFamilyName, resolvedUrl])

  return ready
}

/**
 * KitPreview — molecule. Compact at-a-glance preview of a brand kit for its
 * Card on Home/Library: a palette strip, the first logo, and a live sample
 * of the first font — instead of the single flat thumbnail image projects
 * use (kits don't have one image that represents them, they have three
 * different kinds of assets).
 */
export default function KitPreview({ colors = [], logos = [], fonts = [] }) {
  const firstLogo = logos[0]
  const firstFont = fonts[0]
  const fontReady = useLoadedFont(firstFont?.font_family_name, firstFont?.file_path)
  const logoUrl = useFileUrl(firstLogo?.file_path)

  const isEmpty = colors.length === 0 && logos.length === 0 && fonts.length === 0
  if (isEmpty) {
    return <span className="text-ink/30 text-small">empty kit</span>
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex">
        {colors.length > 0 ? (
          colors.slice(0, 6).map((c, i) => (
            <span key={c.id ?? i} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))
        ) : (
          <span className="flex-1 flex items-center justify-center text-ink/30 text-small">no colors</span>
        )}
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5 bg-canvas border-t border-ink/10">
        <div className="w-6 h-6 rounded border border-ink/10 flex items-center justify-center overflow-hidden shrink-0 bg-surface">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-ink/30" style={{ fontSize: 9 }} aria-hidden="true">no logo</span>
          )}
        </div>
        <span
          className="text-small text-ink/70 truncate"
          style={fontReady ? { fontFamily: firstFont.font_family_name } : undefined}
        >
          {firstFont ? `Aa ${firstFont.font_family_name}` : 'no font'}
        </span>
      </div>
    </div>
  )
}
