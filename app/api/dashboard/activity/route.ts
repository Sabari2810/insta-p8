import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

const PAGE_SIZES = [10, 20, 30] as const

export async function GET(request: NextRequest) {
    try {
        const session = getSession(request)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1)
        const requestedPageSize = Number(request.nextUrl.searchParams.get("pageSize"))
        const pageSize = (PAGE_SIZES as readonly number[]).includes(requestedPageSize) ? requestedPageSize : 20
        // Strip characters that are structural in PostgREST's or()/in() filter syntax so a
        // search term can't break out of the filter string.
        const search = (request.nextUrl.searchParams.get("search") || "").trim().replace(/[,()%]/g, "").slice(0, 100)

        const supabase = await getSupabaseServerClient()
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from("messages")
            .select(
                "id, content, created_at, conversation_id, attachment_type, source, recipient:conversations(recipient_username)",
                { count: "exact" },
            )
            .eq("user_id", session.userId)
            .eq("is_from_instagram", false)

        if (search) {
            // Match either the message content or the recipient's username (via a
            // conversation-id lookup, since the username lives on the joined table).
            const { data: matchingConvos } = await supabase
                .from("conversations")
                .select("id")
                .eq("user_id", session.userId)
                .ilike("recipient_username", `%${search}%`)

            const convoIds = (matchingConvos || []).map((c: any) => c.id)
            const orParts = [`content.ilike.%${search}%`]
            if (convoIds.length > 0) orParts.push(`conversation_id.in.(${convoIds.join(",")})`)
            query = query.or(orParts.join(","))
        }

        const { data, count, error } = await query
            .order("created_at", { ascending: false })
            .range(from, to)

        if (error) throw error

        return NextResponse.json({ data: data || [], total: count || 0, page, pageSize })
    } catch (error) {
        console.error("[Dashboard] Activity GET error:", error)
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }
}
