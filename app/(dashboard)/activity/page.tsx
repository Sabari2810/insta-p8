"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { FiSearch as Search } from "react-icons/fi"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Spinner } from "@/components/ui/spinner"
import { PaginationControls } from "@/components/dashboard/PaginationControls"
import { activityLabel, activityPreview, activityTimestamp, type ActivityItem } from "@/lib/activity-format"

export default function ActivityPage() {
    const { userId, isLoading: isSessionLoading } = useInstagramSession()
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [loading, setLoading] = useState(true)
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")

    // Debounce the search box so we're not firing a request on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300)
        return () => clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        setPage(1)
    }, [search])

    const fetchActivity = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        try {
            const params = new URLSearchParams({ userId, page: String(page), pageSize: String(pageSize) })
            if (search) params.set("search", search)
            const res = await fetch(`/api/dashboard/activity?${params.toString()}`)
            const data = await res.json()
            if (data && !data.error) {
                setActivity(data.data || [])
                setTotal(data.total || 0)
            }
        } catch (err) {
            console.error("Failed to load activity", err)
        } finally {
            setLoading(false)
        }
    }, [userId, page, pageSize, search])

    useEffect(() => {
        fetchActivity()
    }, [fetchActivity])

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setPage(1)
    }

    if (isSessionLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f6f5f3]">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f6f5f3]">
            <div className="px-12 py-10 bg-white">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">History</p>
                <h1 className="font-serif-display text-4xl md:text-5xl text-neutral-900 leading-none">Activity</h1>
            </div>

            <div className="p-8">
                <div className="rounded-2xl border border-black/10 bg-white p-6">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full bg-black/[0.03] border border-black/10 rounded-xl pl-10 pr-4 py-2 text-sm text-neutral-900 focus:outline-none focus:border-brand placeholder:text-muted-foreground/60 transition-all"
                            placeholder="Search by message or username..."
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner />
                        </div>
                    ) : activity.length > 0 ? (
                        <div>
                            {activity.map((msg) => (
                                <Link
                                    key={msg.id}
                                    href={`/inbox?conversation=${msg.conversation_id}`}
                                    className="flex items-start gap-4 py-3.5 border-b border-black/5 last:border-b-0 hover:bg-black/[0.02] transition-colors -mx-2 px-2 rounded-md"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-neutral-900 truncate">
                                            {activityLabel(msg)}
                                        </p>
                                        <p className="text-xs text-neutral-400 truncate mt-0.5">{activityPreview(msg)}</p>
                                    </div>
                                    <span className="text-xs text-neutral-400 shrink-0 pt-0.5 whitespace-nowrap">
                                        {activityTimestamp(msg.created_at)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-muted-foreground text-sm">
                            {search ? "No activity matches your search." : "No activity yet."}
                        </div>
                    )}

                    <PaginationControls
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>
            </div>
        </div>
    )
}
