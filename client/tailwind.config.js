/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Toggled by a "dark" class on <html>, set from Settings and persisted to
  // localStorage — see src/context/ThemeContext.jsx.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary and accent are fixed hex, not variables: they're always
        // paired with literal black text/borders on their own fill (see
        // Button.jsx, Tag.jsx) per the contrast rule in
        // docs/03-design-system.md, and that rule doesn't change with theme.
        // maps to --color-primary in docs/03-design-system.md
        primary: "#FF00AE",
        // maps to --color-accent
        accent: "#C1FF1A",
        // canvas/surface/ink are CSS variables (defined in styles.css, light
        // values under :root, dark values under .dark) so every existing
        // bg-canvas/bg-surface/text-ink usage — including opacity modifiers
        // like text-ink/60 — automatically follows the theme with no
        // per-component changes. The "rgb(var(...) / <alpha-value>)" form is
        // what makes the opacity modifiers keep working.
        // maps to --color-bg — named "canvas" so it doesn't collide with
        // Tailwind's own "bg-*" utility prefix (bg-canvas, not bg-bg)
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        // maps to --color-surface
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        // maps to --color-text — named "ink" for the same reason (text-ink)
        ink: "rgb(var(--color-ink) / <alpha-value>)",
      },
      fontFamily: {
        // Heading / logo wordmark only — display sizes, never body copy
        pixel: ['"Geist Pixel"', "monospace"],
        // Subheading 1
        geist: ['"Geist"', "sans-serif"],
        // Body, Subheading 2, Small — also the default sans
        sans: ['"Inter"', "sans-serif"],
        // Button labels, per the Figma button component
        mono: ['"Geist Mono"', "monospace"],
      },
      fontSize: {
        heading: ["42px", { fontWeight: "700" }],
        "subheading-1": ["32px", { fontWeight: "500" }],
        "subheading-2": ["20px", { fontWeight: "500" }],
        body: ["16px", { fontWeight: "400" }],
        small: ["13px", { fontWeight: "400" }],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Mascot enters from off-screen right and slides to its resting spot;
        // paired with mascot-hop on an inner element for the bouncing.
        "mascot-cross": {
          "0%": { transform: "translateX(100vw)" },
          "100%": { transform: "translateX(0)" },
        },
        // Five hops with decaying height (--u is 1/100 of the design width,
        // set on the Login page). Ground keyframes ease out going up, peak
        // keyframes ease in going down, so each hop reads as gravity.
        "mascot-hop": {
          "0%, 22%, 44%, 62%, 80%, 100%": {
            transform: "translateY(0) rotate(0deg)",
            "animation-timing-function": "cubic-bezier(0.2, 0.8, 0.4, 1)",
          },
          "11%": {
            transform: "translateY(calc(var(--u) * -20)) rotate(-22deg)",
            "animation-timing-function": "cubic-bezier(0.6, 0, 0.8, 0.3)",
          },
          "33%": {
            transform: "translateY(calc(var(--u) * -14)) rotate(14deg)",
            "animation-timing-function": "cubic-bezier(0.6, 0, 0.8, 0.3)",
          },
          "52%": {
            transform: "translateY(calc(var(--u) * -9)) rotate(-9deg)",
            "animation-timing-function": "cubic-bezier(0.6, 0, 0.8, 0.3)",
          },
          "71%": {
            transform: "translateY(calc(var(--u) * -5)) rotate(5deg)",
            "animation-timing-function": "cubic-bezier(0.6, 0, 0.8, 0.3)",
          },
          "89%": {
            transform: "translateY(calc(var(--u) * -2)) rotate(-2deg)",
            "animation-timing-function": "cubic-bezier(0.6, 0, 0.8, 0.3)",
          },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "mascot-cross": "mascot-cross 2.8s cubic-bezier(0.25, 0.6, 0.35, 1) 0.3s both",
        "mascot-hop": "mascot-hop 2.8s linear 0.3s both",
      },
      // Spacing: Tailwind's default 4px-based scale already covers
      // --space-1 (8px = spacing-2) and --space-4 (32px = spacing-8) exactly,
      // so no custom spacing tokens are needed.
    },
  },
  plugins: [],
};
