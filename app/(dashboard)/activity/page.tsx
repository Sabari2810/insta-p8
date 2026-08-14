"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Spinner } from "@/components/ui/spinner"
import { activityLabel, activityPreview, activityTimestamp, type ActivityItem } from "@/lib/activity-format"

const ACTIVITY_LIMIT = 20

export default function ActivityPage() {
    const { userId, isLoading: isSessionLoading } = useInstagramSession()
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return
        fetch(`/api/dashboard/stats?userId=${userId}&activityLimit=${ACTIVITY_LIMIT}`)
            .then((res) => res.json())
            .then((data) => { if (data && !data.error) setActivity(data.recentActivity || []) })
            .catch((err) => console.error("Failed to load activity", err))
            .finally(() => setLoading(false))
    }, [userId])

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
                            No activity yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
