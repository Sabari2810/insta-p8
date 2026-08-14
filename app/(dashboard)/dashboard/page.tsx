"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Activity, Users, MessageCircle, Zap, ArrowRight } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface DashboardStats {
    metrics: {
        totalAutomations: number
        activeTriggers: number
        audienceReached: number
        messagesSent: number
    }
    recentActivity: Array<{
        id: string
        content: string
        created_at: string
        conversation_id: string
        attachment_type?: string | null
        source?: "customer" | "automation" | "manual" | "echo" | null
        recipient?: {
            recipient_username: string
        }
    }>
}

const ATTACHMENT_LABELS: Record<string, string> = {
    image: "📷 Sent a photo",
    video: "🎥 Sent a video",
    audio: "🎵 Sent audio",
    file: "📎 Sent a file",
    share: "🔗 Shared a post",
    story_mention: "Mentioned in a story",
    ig_reel: "🎬 Shared a reel",
    reel: "🎬 Shared a reel",
}

const SOURCE_LABELS: Record<string, string> = {
    automation: "Automation replied to",
    manual: "You replied to",
    echo: "You messaged",
    customer: "Message from",
}

function activityLabel(item: DashboardStats["recentActivity"][number]) {
    const verb = (item.source && SOURCE_LABELS[item.source]) || "Reply sent to"
    return `${verb} @${item.recipient?.recipient_username || "user"}`
}

function activityPreview(item: DashboardStats["recentActivity"][number]) {
    if (item.attachment_type && /^\[.+\]$/.test(item.content)) {
        return ATTACHMENT_LABELS[item.attachment_type] || `📎 Sent a ${item.attachment_type.replace(/_/g, " ")}`
    }
    return item.content
}

function activityTimestamp(iso: string) {
    const date = new Date(iso)
    const isToday = date.toDateString() === new Date().toDateString()
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return isToday ? time : `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`
}

export default function DashboardPage() {
    const { username, userId, isLoading: isSessionLoading } = useInstagramSession()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    // Starts null so the server-rendered markup and the first client render match; the
    // actual clock only appears once mounted, ticking every second after that.
    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        if (!userId) return

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/dashboard/stats?userId=${userId}`)
                const data = await res.json()
                if (data && !data.error) {
                    setStats(data)
                }
            } catch (err) {
                console.error("Failed to load dashboard stats", err)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [userId])

    useEffect(() => {
        setNow(new Date())
        const interval = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    if (isSessionLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Welcome Section */}
            <div className="rounded-2xl border border-black/10 bg-white px-8 py-7 flex items-center justify-between gap-6 flex-wrap">
                <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-2">Dashboard</p>
                    <h1 className="font-serif-display text-4xl md:text-5xl text-black leading-none">Hey, {username}.</h1>
                </div>
                {now && (
                    <div className="text-right shrink-0">
                        <p className="font-mono-ui text-2xl text-black tabular-nums">
                            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                        <p className="text-neutral-400 text-xs mt-1">
                            {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Automations"
                    value={stats?.metrics.totalAutomations.toString() || "0"}
                    trend="Active"
                    icon={<Zap className="w-5 h-5 text-brand" />}
                />
                <StatCard
                    title="Messages Sent"
                    value={stats?.metrics.messagesSent.toString() || "0"}
                    trend="Lifetime"
                    icon={<MessageCircle className="w-5 h-5 text-brand" />}
                />
                <StatCard
                    title="Active Triggers"
                    value={stats?.metrics.activeTriggers.toString() || "0"}
                    trend="Running"
                    icon={<Activity className="w-5 h-5 text-brand" />}
                />
                <StatCard
                    title="Audience Reached"
                    value={stats?.metrics.audienceReached.toString() || "0"}
                    trend="Unique Users"
                    icon={<Users className="w-5 h-5 text-brand" />}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 bg-white border-black/10">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Recent activity</h3>
                        <Link href="/inbox" className="text-xs font-medium text-brand hover:underline">View all</Link>
                    </div>
                    <div>
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((msg) => (
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
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 bg-white border-black/10">
                    <h3 className="font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-4">Quick actions</h3>
                    <div className="space-y-2">
                        <QuickActionPrimary href="/automations?new=1" label="New automation" sub="Comment, DM, or story trigger" />
                        <QuickActionRow href="/inbox" label="View inbox" sub="Reply to conversations" />
                        <QuickActionRow href="/ice-breakers" label="Ice breakers" sub="Set quick-start prompts" />
                        <QuickActionRow href="/analytics" label="Analytics" sub="Track performance" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

function QuickActionPrimary({ href, label, sub }: { href: string, label: string, sub: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-xl bg-brand hover:brightness-110 px-4 py-3.5 transition-colors group"
        >
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="block text-xs text-white/70 mt-0.5">{sub}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
    )
}

function QuickActionRow({ href, label, sub }: { href: string, label: string, sub: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-xl border border-black/10 hover:bg-brand/[0.06] hover:border-brand/30 px-4 py-3.5 transition-colors group"
        >
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-neutral-900">{label}</span>
                <span className="block text-xs text-neutral-400 mt-0.5">{sub}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-brand transition-all shrink-0" />
        </Link>
    )
}

function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
    return (
        <div className="p-6 rounded-2xl border border-black/10 bg-white hover:border-black/20 transition-colors group">
            <div className="flex items-start justify-between">
                {icon}
                <span className="font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500">{trend}</span>
            </div>
            <div className="mt-6">
                <p className="font-serif-display text-5xl text-neutral-900 leading-none">{value}</p>
                <p className="font-mono-ui text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-3">{title}</p>
            </div>
        </div>
    )
}
