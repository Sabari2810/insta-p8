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

        const supabase = await getSupabaseServerClient()
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, count, error } = await supabase
            .from("messages")
            .select(
                "id, content, created_at, conversation_id, attachment_type, source, recipient:conversations(recipient_username)",
                { count: "exact" },
            )
            .eq("user_id", session.userId)
            .eq("is_from_instagram", false)
            .order("created_at", { ascending: false })
            .range(from, to)

        if (error) throw error

        return NextResponse.json({ data: data || [], total: count || 0, page, pageSize })
    } catch (error) {
        console.error("[Dashboard] Activity GET error:", error)
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }
}
