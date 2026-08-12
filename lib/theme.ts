// Single source of truth for accent colors in contexts that can't consume a Tailwind class —
// raw SVG/chart color props (recharts, gradients). Everywhere else, use the `brand`/`violet`/
// `coral` Tailwind tokens, wired to these same values in globals.css. Keep these equal to
// --accent-green/--accent-violet/--accent-coral if the brand palette ever changes.
export const BRAND_COLOR = "#c3fb3a"
export const VIOLET_COLOR = "#b98bff"
export const CORAL_COLOR = "#ff6b81"
