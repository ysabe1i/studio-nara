import { clampChroma, converter, displayable, formatHex, parse } from 'culori'

const toRgb = converter('rgb')
const toHsl = converter('hsl')
const toOklch = converter('oklch')

// Internal color state is always { h: 0-360, s: 0-100, l: 0-100 } — plain
// numbers, not culori's 0-1 fractions, since that's what the wheel/slider
// UI naturally produces and consumes.

export function hslToHex({ h, s, l }) {
  return formatHex({ mode: 'hsl', h, s: s / 100, l: l / 100 })
}

export function hslToRgbString({ h, s, l }) {
  const { r, g, b } = toRgb({ mode: 'hsl', h, s: s / 100, l: l / 100 })
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

export function hslToHslString({ h, s, l }) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

export function hslToOklchString({ h, s, l }) {
  const ok = toOklch({ mode: 'hsl', h, s: s / 100, l: l / 100 })
  const L = Math.round((ok.l ?? 0) * 1000) / 10
  const C = Math.round((ok.c ?? 0) * 1000) / 1000
  const H = Number.isFinite(ok.h) ? Math.round(ok.h * 10) / 10 : 0
  return `oklch(${L}% ${C} ${H})`
}

// Parses any CSS color string culori understands (hex, rgb(), hsl(),
// oklch(), named colors, ...) into our { h, s, l } shape. Returns null on
// anything unparseable so callers can reject bad input instead of crashing.
export function parseToHsl(input) {
  if (!input || typeof input !== 'string') return null
  const text = input.trim()
  // Allow hex typed without the leading "#" (e.g. "ff00ae").
  const parsed = parse(text) ?? (/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(text) ? parse(`#${text}`) : undefined)
  if (!parsed) return null
  // A typed oklch color can be outside what a screen can show. Pull it back
  // by reducing chroma (keeping lightness/hue) instead of letting the
  // out-of-range channel values skew the conversion.
  const visible = displayable(parsed) ? parsed : clampChroma(toOklch(parsed), 'oklch')
  const hsl = toHsl(visible)
  if (!hsl) return null
  const clamp = (n) => Math.min(100, Math.max(0, n))
  return {
    h: Number.isFinite(hsl.h) ? hsl.h : 0,
    s: clamp((hsl.s ?? 0) * 100),
    l: clamp((hsl.l ?? 0) * 100),
  }
}

export function hexToHsl(hex) {
  return parseToHsl(hex) ?? { h: 0, s: 0, l: 0 }
}

const HARMONY_OFFSETS = {
  complementary: [0, 180],
  'split-complementary': [0, 150, 210],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  tetradic: [0, 60, 180, 240],
  square: [0, 90, 180, 270],
}

export const HARMONY_TYPES = Object.keys(HARMONY_OFFSETS)

// Returns an array of { h, s, l } for the given harmony type, built from a
// base hue with the same saturation/lightness carried across every color.
export function getHarmonyColors(baseHsl, harmonyType) {
  const offsets = HARMONY_OFFSETS[harmonyType]
  if (!offsets) return []
  return offsets.map((offset) => ({
    h: ((baseHsl.h + offset) % 360 + 360) % 360,
    s: baseHsl.s,
    l: baseHsl.l,
  }))
}
