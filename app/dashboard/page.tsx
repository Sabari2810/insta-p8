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
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        )
    }

    return (
        <div className="relative p-8 space-y-8 animate-in fade-in duration-700 overflow-hidden">
            <div className="glow-orb w-[24rem] h-[24rem] bg-brand -top-32 -right-20" />

            {/* Welcome Section */}
            <div className="relative flex items-center justify-between">
                <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-600 mb-2">Overview</p>
                    <h1 className="font-serif-display font-black text-4xl md:text-5xl text-white leading-none">Hey, <span className="gradient-text">{username}</span>.</h1>
                    <p className="text-neutral-500 text-sm mt-3">Here's what your automations did while you were away.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Automations"
                    value={stats?.metrics.totalAutomations.toString() || "0"}
                    trend="Active"
                    accent="brand"
                    icon={<Zap className="w-5 h-5" />}
                />
                <StatCard
                    title="Messages Sent"
                    value={stats?.metrics.messagesSent.toString() || "0"}
                    trend="Lifetime"
                    accent="violet"
                    icon={<MessageCircle className="w-5 h-5" />}
                />
                <StatCard
                    title="Active Triggers"
                    value={stats?.metrics.activeTriggers.toString() || "0"}
                    trend="Running"
                    accent="coral"
                    icon={<Activity className="w-5 h-5" />}
                />
                <StatCard
                    title="Audience Reached"
                    value={stats?.metrics.audienceReached.toString() || "0"}
                    trend="Unique Users"
                    accent="brand"
                    icon={<Users className="w-5 h-5" />}
                />
            </div>

            {/* Recent Activity */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glow-card p-6 bg-[#0b0b0a] border-white/10 rounded-2xl">
                    <h3 className="font-serif-display font-bold text-2xl text-white mb-5">Recent activity</h3>
                    <div className="space-y-4">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((msg) => (
                                <Link
                                    key={msg.id}
                                    href={`/dashboard/inbox?conversation=${msg.conversation_id}`}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white font-medium truncate">
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

                <Card className="glow-card p-6 bg-[#0b0b0a] border-white/10 rounded-2xl">
                    <h3 className="font-serif-display font-bold text-2xl text-white mb-5">Quick actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <QuickAction href="/dashboard/automations?new=1" icon={<Zap className="w-6 h-6" />} label="New Rule" accent="brand" />
                        <QuickAction href="/dashboard/inbox" icon={<MessageSquare className="w-6 h-6" />} label="View Inbox" accent="violet" />
                        <QuickAction href="/dashboard/ice-breakers" icon={<Snowflake className="w-6 h-6" />} label="Ice Breakers" accent="coral" />
                        <QuickAction href="/dashboard/analytics" icon={<BarChart3 className="w-6 h-6" />} label="Analytics" accent="brand" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

const ACCENT_CLASSES = {
    brand: { text: "text-brand", hoverText: "group-hover:text-brand", hoverBorder: "hover:border-brand/30", bg: "bg-brand/10" },
    violet: { text: "text-violet", hoverText: "group-hover:text-violet", hoverBorder: "hover:border-violet/30", bg: "bg-violet/10" },
    coral: { text: "text-coral", hoverText: "group-hover:text-coral", hoverBorder: "hover:border-coral/30", bg: "bg-coral/10" },
} as const

function QuickAction({ href, icon, label, accent }: { href: string, icon: React.ReactNode, label: string, accent: keyof typeof ACCENT_CLASSES }) {
    const styles = ACCENT_CLASSES[accent]
    return (
        <Link
            href={href}
            className={`h-24 rounded-xl border border-white/10 flex flex-col items-center justify-center hover:bg-white/5 ${styles.hoverBorder} transition-colors group`}
        >
            <span className={`text-muted-foreground ${styles.hoverText} mb-2 transition-colors`}>{icon}</span>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">{label}</span>
        </Link>
    )
}

function StatCard({ title, value, trend, icon, accent }: { title: string, value: string, trend: string, icon: React.ReactNode, accent: keyof typeof ACCENT_CLASSES }) {
    const styles = ACCENT_CLASSES[accent]
    return (
        <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0b0a] group">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${styles.bg} ${styles.text} flex items-center justify-center`}>
                    {icon}
                </div>
                <span className="font-mono-ui text-[10px] uppercase tracking-widest text-neutral-600">{trend}</span>
            </div>
            <div className="mt-6">
                <p className="font-serif-display font-black text-5xl text-white leading-none">{value}</p>
                <p className="font-mono-ui text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-3">{title}</p>
            </div>
        </div>
    )
}
