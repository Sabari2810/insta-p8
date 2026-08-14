import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

const ALLOWED_RANGES = [7, 30, 90] as const

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function GET(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const daysParam = Number(request.nextUrl.searchParams.get("days"))
  const days = ALLOWED_RANGES.includes(daysParam as any) ? daysParam : 30

  const supabase = await getSupabaseServerClient()
  const userId = session.userId

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const [messagesRes, conversationsRes, automationsRes] = await Promise.all([
    supabase
      .from("messages")
      .select("created_at, is_from_instagram")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("conversations")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("automations")
      .select("id, name, trigger_source, trigger_count, unlock_count, is_active")
      .eq("user_id", userId),
  ])

  // Build a continuous day-by-day series so the chart has no gaps, even on quiet days.
  const buckets = new Map<string, { date: string; sent: number; received: number; newConversations: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const key = dateKey(d)
    buckets.set(key, { date: key, sent: 0, received: 0, newConversations: 0 })
  }

  for (const msg of messagesRes.data || []) {
    const bucket = buckets.get(dateKey(new Date(msg.created_at)))
    if (!bucket) continue
    if (msg.is_from_instagram) bucket.received++
    else bucket.sent++
  }

  for (const conv of conversationsRes.data || []) {
    const bucket = buckets.get(dateKey(new Date(conv.created_at)))
    if (bucket) bucket.newConversations++
  }

  const timeSeries = Array.from(buckets.values())

  const automations: any[] = automationsRes.data || []
  const topAutomations = automations
    .filter((a: any) => (a.trigger_count || 0) > 0)
    .sort((a: any, b: any) => (b.trigger_count || 0) - (a.trigger_count || 0))
    .slice(0, 5)
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      triggerSource: a.trigger_source,
      triggerCount: a.trigger_count,
      unlockCount: a.unlock_count || 0,
    }))

  const activeAutomations = automations.filter((a: any) => a.is_active)
  const automationsBySource = {
    comment: activeAutomations.filter((a: any) => a.trigger_source === "comment").length,
    dm: activeAutomations.filter((a: any) => a.trigger_source === "dm").length,
    story: activeAutomations.filter((a: any) => a.trigger_source === "story").length,
  }

  return NextResponse.json({ timeSeries, topAutomations, automationsBySource })
}
