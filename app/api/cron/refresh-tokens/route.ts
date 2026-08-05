import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { encryptSecret, decryptSecret } from "@/lib/crypto"
import { refreshLongLivedToken } from "@/lib/instagram-api"

// How far ahead of actual expiry to proactively refresh. Running daily with a wide window means
// a token gets several chances to refresh before it's ever at real risk of expiring.
const REFRESH_WINDOW_DAYS = 10

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`
  // Vercel Cron always sends this header when CRON_SECRET is set. Without it, only allow
  // running this outside production (e.g. manual local testing).
  return process.env.NODE_ENV !== "production"
}

/**
 * GET /api/cron/refresh-tokens
 * Scheduled by vercel.json. Proactively refreshes any Instagram long-lived token expiring within
 * REFRESH_WINDOW_DAYS, so clients' automations don't silently die every ~60 days. Tokens that
 * have already expired can't be refreshed this way — those are left for the dashboard's
 * reconnect banner to prompt a full re-auth.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()
  const now = Date.now()
  const windowEnd = new Date(now + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const nowIso = new Date(now).toISOString()

  const { data: users, error } = await supabase
    .from("users")
    .select("id, access_token, token_expires_at")
    .not("token_expires_at", "is", null)
    .lte("token_expires_at", windowEnd)
    .gt("token_expires_at", nowIso)

  if (error) {
    console.error("[cron/refresh-tokens] query failed", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  let refreshed = 0
  let failed = 0

  for (const user of users || []) {
    const currentToken = decryptSecret(user.access_token)
    const result = await refreshLongLivedToken(currentToken)

    if (!result) {
      failed++
      console.warn(`[cron/refresh-tokens] refresh failed for user ${user.id} — needs manual reconnect`)
      continue
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        access_token: encryptSecret(result.access_token),
        token_expires_at: new Date(now + result.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      failed++
      console.error(`[cron/refresh-tokens] failed to save refreshed token for user ${user.id}`, updateError)
      continue
    }

    refreshed++
  }

  return NextResponse.json({ checked: users?.length || 0, refreshed, failed })
}
