import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSession, clearSessionCookie } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await getSupabaseServerClient()
  const { data: user } = await supabase
    .from("users")
    .select("username, business_account_id, page_id, token_expires_at, created_at")
    .eq("id", session.userId)
    .single()

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    username: user.username,
    businessAccountId: user.business_account_id,
    connectedAt: user.created_at,
    tokenExpiresAt: user.token_expires_at,
    webhookVerifyTokenConfigured: Boolean(process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN),
  })
}

/**
 * DELETE /api/instagram/account
 * Disconnects the Instagram account: clears the stored token (so any further send/fetch calls
 * fail cleanly instead of using a stale token) and ends the session, forcing a fresh OAuth login
 * to reconnect.
 */
export async function DELETE(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from("users")
    .update({ access_token: "", token_expires_at: null, updated_at: new Date().toISOString() })
    .eq("id", session.userId)

  if (error) return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })

  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
