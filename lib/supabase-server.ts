import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isDemoMode } from "@/lib/demo-mode"
import { createMockSupabaseClient } from "@/lib/mock-supabase"
import { createPostgresClient } from "@/lib/postgres-client"

/**
 * Create a database client for API routes and server actions. Three backends, checked in order:
 *  1. Demo mode — in-memory mock, no database needed.
 *  2. Supabase — used automatically when NEXT_PUBLIC_SUPABASE_URL is set, unchanged from before.
 *  3. Plain Postgres — used when only DATABASE_URL is set, so the app runs against any Postgres
 *     host (Neon, Railway, self-hosted, etc.) without depending on Supabase specifically.
 * All three expose the identical .from(table).select().eq()... chainable interface, so no API
 * route needs to know or care which backend is active.
 */
export async function getSupabaseServerClient(): Promise<any> {
  if (isDemoMode) {
    return createMockSupabaseClient() as any
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.DATABASE_URL) {
    return createPostgresClient() as any
  }

  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: async () => cookieStore.getAll(),
      setAll: async (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          console.error("[v0] Error setting cookies:", error)
        }
      },
    },
  })
}
