"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Activity, Users, MessageCircle, Zap, Loader2, MessageSquare, Snowflake, BarChart3 } from "lucide-react"

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

    if (isSessionLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Overview</p>
                    <h1 className="font-serif-display text-4xl md:text-5xl text-neutral-900 leading-none">Hey, {username}.</h1>
                    <p className="text-neutral-500 text-sm mt-3">Here's what your automations did while you were away.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Automations"
                    value={stats?.metrics.totalAutomations.toString() || "0"}
                    trend="Active"
                    icon={<Zap className="w-5 h-5 text-brand-dark" />}
                />
                <StatCard
                    title="Messages Sent"
                    value={stats?.metrics.messagesSent.toString() || "0"}
                    trend="Lifetime"
                    icon={<MessageCircle className="w-5 h-5 text-brand-dark" />}
                />
                <StatCard
                    title="Active Triggers"
                    value={stats?.metrics.activeTriggers.toString() || "0"}
                    trend="Running"
                    icon={<Activity className="w-5 h-5 text-brand-dark" />}
                />
                <StatCard
                    title="Audience Reached"
                    value={stats?.metrics.audienceReached.toString() || "0"}
                    trend="Unique Users"
                    icon={<Users className="w-5 h-5 text-brand-dark" />}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 bg-white border-black/10">
                    <h3 className="font-serif-display text-2xl text-neutral-900 mb-5">Recent activity</h3>
                    <div className="space-y-4">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((msg) => (
                                <Link
                                    key={msg.id}
                                    href={`/dashboard/inbox?conversation=${msg.conversation_id}`}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/[0.03] transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-brand-dark shrink-0">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-neutral-900 font-medium truncate">
                                            {activityLabel(msg)}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate w-full max-w-[300px]">{activityPreview(msg)}</p>
                                    </div>
                                    <div className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
                                        {activityTimestamp(msg.created_at)}
                                    </div>
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
                    <h3 className="font-serif-display text-2xl text-neutral-900 mb-5">Quick actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <QuickAction href="/dashboard/automations?new=1" icon={<Zap className="w-6 h-6" />} label="New Rule" />
                        <QuickAction href="/dashboard/inbox" icon={<MessageSquare className="w-6 h-6" />} label="View Inbox" />
                        <QuickAction href="/dashboard/ice-breakers" icon={<Snowflake className="w-6 h-6" />} label="Ice Breakers" />
                        <QuickAction href="/dashboard/analytics" icon={<BarChart3 className="w-6 h-6" />} label="Analytics" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

function QuickAction({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link
            href={href}
            className="h-24 rounded-xl border border-black/10 flex flex-col items-center justify-center hover:bg-black/[0.03] hover:border-black/20 transition-colors group"
        >
            <span className="text-muted-foreground group-hover:text-neutral-900 mb-2 transition-colors">{icon}</span>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-neutral-900 transition-colors">{label}</span>
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
