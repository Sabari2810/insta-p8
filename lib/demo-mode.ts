// Lets `npm run dev` run against an in-memory mock database instead of Supabase, so the UI
// can be previewed locally without any real credentials. Activates only when Supabase isn't
// configured and we're not in production — never engages on a real deployment.
export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV !== "production"

export const DEMO_USER_ID = "9999999999"
export const DEMO_USERNAME = "test_creator"
