// Single source of truth for the brand accent color in contexts that can't consume a Tailwind
// class — raw SVG/chart color props (recharts, gradients). Everywhere else, use the `brand`
// Tailwind token (bg-brand, text-brand, border-brand, etc.), wired to --accent-green in
// globals.css. Keep this value equal to --accent-green if the brand color ever changes.
export const BRAND_COLOR = "#c3fb3a"
