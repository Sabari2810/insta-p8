import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
    try {
        const session = getSession(request)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const userId = session.userId

        const supabase = await getSupabaseServerClient()

        // Fetch conversations sorted by last message
        const { data: conversations, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", userId)
            .order("last_message_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(conversations)
    } catch (error) {
        console.error("[Inbox] Conversations GET error:", error)
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }
}
