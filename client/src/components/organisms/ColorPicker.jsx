import { useEffect, useRef, useState } from 'react'
import ColorWheel from '../molecules/ColorWheel.jsx'
import {
  HARMONY_TYPES,
  getHarmonyColors,
  hexToHsl,
  hslToHex,
  hslToHslString,
  hslToOklchString,
  hslToRgbString,
  parseToHsl,
} from '../../utils/color.js'

// A single editable "hex" / "rgb(...)" / "hsl(...)" / "oklch(...)" text
// field. Keeps its own draft text while typing and only commits (parses +
// calls onCommit) on blur/Enter, reverting to the last valid formatted
// value if what was typed doesn't parse as a color.
function FormatField({ label, value, onCommit }) {
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    setDraft(value)
    setInvalid(false)
  }, [value])

  // Enter keeps invalid text on screen (flagged) so it can be fixed;
  // blur quietly reverts to the current color instead.
  function commit({ revertIfInvalid }) {
    // Untouched field (e.g. just clicked in and out): nothing to save, and
    // re-parsing its rounded text would nudge the color.
    if (draft === value) return
    const parsed = parseToHsl(draft)
    if (parsed) {
      setInvalid(false)
      onCommit(parsed)
    } else if (revertIfInvalid) {
      setDraft(value)
      setInvalid(false)
    } else {
      setInvalid(true)
    }
  }

  return (
    <label className="flex items-center gap-2 text-small">
      <span className="w-12 text-ink/50 shrink-0">{label}</span>
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setInvalid(false)
        }}
        onBlur={() => commit({ revertIfInvalid: true })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit({ revertIfInvalid: false })
          }
        }}
        aria-invalid={invalid}
        title={invalid ? "that doesn't look like a color" : undefined}
        className={`flex-1 min-w-0 bg-canvas border rounded px-2 py-1 font-mono text-small ${
          invalid ? 'border-primary border-2' : 'border-ink/15'
        }`}
      />
    </label>
  )
}

/**
 * ColorPicker — organism. A swatch button that opens a popover with an
 * HSL color wheel, a lightness slider, editable hex/rgb/hsl/oklch fields,
 * and a color-harmony dropdown (analogous, triadic, etc.) that suggests
 * related colors to add to the palette.
 *
 * Props: hex (current value), onChange(hex) fires as the color is edited,
 * onAddHarmonyColor(hex) fires when a suggested harmony swatch is clicked.
 */
export default function ColorPicker({ hex, onChange, onAddHarmonyColor }) {
  const [open, setOpen] = useState(false)
  const [hsl, setHsl] = useState(() => hexToHsl(hex))
  const [harmony, setHarmony] = useState('none')
  const containerRef = useRef(null)

  function openPicker() {
    setHsl(hexToHsl(hex))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDocPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function commitHsl(next) {
    setHsl(next)
    onChange(hslToHex(next))
  }

  const harmonyColors = harmony === 'none' ? [] : getHarmonyColors(hsl, harmony)

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-label={`Edit color ${hex}`}
        aria-expanded={open}
        className="w-6 h-6 rounded-full border border-ink/20 shrink-0"
        style={{ backgroundColor: hex }}
      />

      {open && (
        <div className="absolute z-20 top-8 left-0 w-72 bg-canvas border border-ink/15 rounded-lg shadow-lg p-4 space-y-3">
          <div className="flex gap-4">
            <ColorWheel
              h={hsl.h}
              s={hsl.s}
              onChange={({ h, s }) =>
                // At l: 0 or 100 every hue/saturation renders as the same
                // black/white, so picking on the wheel would be a no-op —
                // nudge off that degenerate edge so the pick is visible.
                commitHsl({ h, s, l: hsl.l <= 0 || hsl.l >= 100 ? 50 : hsl.l })
              }
              harmonyPoints={harmonyColors}
            />
            <div className="flex-1 flex flex-col justify-between">
              <label className="text-small text-ink/50">
                lightness
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hsl.l}
                  onChange={(e) => commitHsl({ ...hsl, l: Number(e.target.value) })}
                  className="lightness-slider w-full mt-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, black, hsl(${hsl.h} ${hsl.s}% 50%), white)`,
                  }}
                />
              </label>
              <div
                className="rounded-md border border-ink/10 h-10 mt-2"
                style={{ backgroundColor: hslToHex(hsl) }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FormatField label="hex" value={hslToHex(hsl)} onCommit={commitHsl} />
            <FormatField label="rgb" value={hslToRgbString(hsl)} onCommit={commitHsl} />
            <FormatField label="hsl" value={hslToHslString(hsl)} onCommit={commitHsl} />
            <FormatField label="oklch" value={hslToOklchString(hsl)} onCommit={commitHsl} />
          </div>

          <div className="pt-1 border-t border-ink/10 space-y-2">
            <label className="flex items-center gap-2 text-small">
              <span className="text-ink/50 shrink-0">harmony</span>
              <select
                value={harmony}
                onChange={(e) => setHarmony(e.target.value)}
                className="flex-1 bg-canvas border border-ink/15 rounded px-2 py-1 text-small capitalize"
              >
                <option value="none">none</option>
                {HARMONY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </label>

            {harmonyColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {harmonyColors.map((c, i) => {
                  const swatchHex = hslToHex(c)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onAddHarmonyColor?.(swatchHex)}
                      title={`Add ${swatchHex} to palette`}
                      className="w-7 h-7 rounded-full border border-ink/20 hover:scale-110 transition-transform"
                      style={{ backgroundColor: swatchHex }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
