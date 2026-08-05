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

/**
 * PATCH /api/inbox/conversations
 * Sets a conversation's tags (full replace, not incremental — the client sends the desired
 * final list). Used for contact segmentation in the inbox.
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = getSession(request)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { conversationId, tags } = await request.json()
        if (!conversationId || !Array.isArray(tags)) {
            return NextResponse.json({ error: "Missing conversationId or tags" }, { status: 400 })
        }

        const cleanTags = Array.from(
            new Set(
                tags
                    .map((t: unknown) => (typeof t === "string" ? t.trim().slice(0, 30) : ""))
                    .filter(Boolean),
            ),
        ).slice(0, 10)

        const supabase = await getSupabaseServerClient()
        const { data, error } = await supabase
            .from("conversations")
            .update({ tags: cleanTags })
            .eq("id", conversationId)
            .eq("user_id", session.userId)
            .select()
            .single()

        if (error) throw error
        if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

        return NextResponse.json(data)
    } catch (error) {
        console.error("[Inbox] Conversations PATCH error:", error)
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 })
    }
}
