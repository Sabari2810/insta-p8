// Single source of truth for colors in contexts that can't consume a Tailwind class — raw
// SVG/chart color props (recharts, gradients). Everywhere else, use the matching Tailwind
// token (bg-brand, text-neutral-900, etc.), wired to globals.css.
export const BRAND_COLOR = "#c3fb3a" // Reserved for actual buttons/CTAs only.
export const INK_COLOR = "#171717" // neutral-900 — the default for chart series, icons, accents.
