// Lets `npm run dev` run against an in-memory mock database instead of a real one, so the UI
// can be previewed locally without any credentials. Activates only when neither Supabase nor a
// plain DATABASE_URL is configured, and we're not in production — never engages on a real deployment.
export const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DATABASE_URL && process.env.NODE_ENV !== "production"

export const DEMO_USER_ID = "9999999999"
export const DEMO_USERNAME = "test_creator"
