import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await getSupabaseServerClient()
  const { data: user } = await supabase
    .from("users")
    .select("token_expires_at")
    .eq("id", session.userId)
    .single()

  if (!user?.token_expires_at) {
    return NextResponse.json({ expiresAt: null, daysRemaining: null })
  }

  const expiresAt = new Date(user.token_expires_at).getTime()
  const daysRemaining = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000))

  return NextResponse.json({ expiresAt: user.token_expires_at, daysRemaining })
}
