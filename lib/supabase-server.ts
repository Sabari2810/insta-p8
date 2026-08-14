import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isDemoMode } from "@/lib/demo-mode"
import { createMockSupabaseClient } from "@/lib/mock-supabase"

/**
 * Create a Supabase server client
 * Use this in API routes and server actions
 */
export async function getSupabaseServerClient(): Promise<any> {
  // No Supabase credentials configured locally — fall back to an in-memory mock so the app
  // (and "Dev Login" on the landing page) works for UI preview without a real backend.
  if (isDemoMode) {
    return createMockSupabaseClient() as any
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
