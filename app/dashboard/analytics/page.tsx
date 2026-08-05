"use client"

import { useEffect, useMemo, useState } from "react"
import * as RechartsPrimitive from "recharts"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Loader2, MessageCircle, Send, Sparkles, TrendingUp, Trophy } from "lucide-react"

interface AnalyticsData {
    timeSeries: { date: string; sent: number; received: number; newConversations: number }[]
    topAutomations: { id: string; name: string; triggerSource: string; triggerCount: number; unlockCount: number }[]
    automationsBySource: { comment: number; dm: number; story: number }
}

const RANGES = [7, 30, 90] as const

const messagesChartConfig: ChartConfig = {
    sent: { label: "Sent", color: "#ffe14d" },
    received: { label: "Received", color: "#60a5fa" },
}

const audienceChartConfig: ChartConfig = {
    newConversations: { label: "New conversations", color: "#ffe14d" },
}

const SOURCE_META = {
    comment: { label: "Comments", icon: MessageCircle },
    dm: { label: "DMs", icon: Send },
    story: { label: "Stories", icon: Sparkles },
} as const

function formatDateTick(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export default function AnalyticsPage() {
    const { userId, isLoading: isSessionLoading } = useInstagramSession()
    const [range, setRange] = useState<(typeof RANGES)[number]>(30)
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return
        setLoading(true)
        fetch(`/api/dashboard/analytics?days=${range}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((d) => d && setData(d))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [userId, range])

    const totals = useMemo(() => {
        if (!data) return { sent: 0, received: 0, newConversations: 0 }
        return data.timeSeries.reduce(
            (acc, day) => ({
                sent: acc.sent + day.sent,
                received: acc.received + day.received,
                newConversations: acc.newConversations + day.newConversations,
            }),
            { sent: 0, received: 0, newConversations: 0 },
        )
    }, [data])

    const hasActivity = totals.sent > 0 || totals.received > 0 || totals.newConversations > 0

    if (isSessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-600 mb-2">Deep dive</p>
                    <h1 className="font-serif-display text-4xl md:text-5xl text-white leading-none">Analytics</h1>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-white/10 p-1">
                    {RANGES.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`h-8 px-4 rounded-full font-mono-ui text-[11px] font-bold uppercase tracking-widest transition-colors ${
                                range === r ? "bg-[#ffe14d] text-black" : "text-neutral-500 hover:text-white"
                            }`}
                        >
                            {r}d
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                </div>
            ) : !hasActivity ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center">
                    <TrendingUp className="w-8 h-8 text-neutral-600 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-1">No activity in the last {range} days</p>
                    <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        Once your automations start replying to comments, DMs, or stories, you'll see trends here.
                    </p>
                </div>
            ) : (
                <>
                    {/* Messages sent vs received */}
                    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-sm font-semibold text-white">Messages sent vs received</h2>
                                <p className="text-xs text-neutral-500 mt-0.5">{totals.sent} sent · {totals.received} received in the last {range} days</p>
                            </div>
                        </div>
                        <ChartContainer config={messagesChartConfig} className="aspect-auto h-[260px] w-full">
                            <RechartsPrimitive.AreaChart data={data?.timeSeries}>
                                <defs>
                                    <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ffe14d" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ffe14d" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <RechartsPrimitive.CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                                <RechartsPrimitive.XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateTick}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#737373", fontSize: 11 }}
                                    minTickGap={24}
                                />
                                <RechartsPrimitive.YAxis tickLine={false} axisLine={false} tick={{ fill: "#737373", fontSize: 11 }} allowDecimals={false} width={28} />
                                <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => formatDateTick(String(v))} />} />
                                <RechartsPrimitive.Area dataKey="sent" type="monotone" stroke="#ffe14d" fill="url(#fillSent)" strokeWidth={2} />
                                <RechartsPrimitive.Area dataKey="received" type="monotone" stroke="#60a5fa" fill="url(#fillReceived)" strokeWidth={2} />
                            </RechartsPrimitive.AreaChart>
                        </ChartContainer>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* New conversations */}
                        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-white">Audience growth</h2>
                                <p className="text-xs text-neutral-500 mt-0.5">{totals.newConversations} new conversation{totals.newConversations === 1 ? "" : "s"} started</p>
                            </div>
                            <ChartContainer config={audienceChartConfig} className="aspect-auto h-[220px] w-full">
                                <RechartsPrimitive.BarChart data={data?.timeSeries}>
                                    <RechartsPrimitive.CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                                    <RechartsPrimitive.XAxis
                                        dataKey="date"
                                        tickFormatter={formatDateTick}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#737373", fontSize: 11 }}
                                        minTickGap={24}
                                    />
                                    <RechartsPrimitive.YAxis tickLine={false} axisLine={false} tick={{ fill: "#737373", fontSize: 11 }} allowDecimals={false} width={28} />
                                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => formatDateTick(String(v))} />} />
                                    <RechartsPrimitive.Bar dataKey="newConversations" fill="#ffe14d" radius={[4, 4, 0, 0]} />
                                </RechartsPrimitive.BarChart>
                            </ChartContainer>
                        </section>

                        {/* Top automations */}
                        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-[#ffe14d]" />
                                    <h2 className="text-sm font-semibold text-white">Top automations</h2>
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-neutral-600">All-time</span>
                            </div>
                            {!data?.topAutomations.length ? (
                                <p className="text-sm text-neutral-500 py-8 text-center">No automations have triggered yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.topAutomations.map((a, i) => {
                                        const max = data.topAutomations[0].triggerCount || 1
                                        const pct = Math.max(8, Math.round((a.triggerCount / max) * 100))
                                        return (
                                            <div key={a.id}>
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span className="text-sm text-neutral-300 truncate">
                                                        <span className="text-neutral-600 font-mono-ui text-xs mr-2">#{i + 1}</span>
                                                        {a.name}
                                                    </span>
                                                    <span className="text-xs font-mono-ui text-neutral-500 shrink-0">
                                                        {a.unlockCount > 0
                                                            ? `${a.triggerCount} shown · ${a.unlockCount} unlocked (${Math.round((a.unlockCount / a.triggerCount) * 100)}%)`
                                                            : `${a.triggerCount}×`}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                    <div className="h-full rounded-full bg-[#ffe14d]" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Automations by channel */}
                    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Active automations by channel</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {(Object.keys(SOURCE_META) as Array<keyof typeof SOURCE_META>).map((key) => {
                                const Icon = SOURCE_META[key].icon
                                const count = data?.automationsBySource[key] ?? 0
                                return (
                                    <div key={key} className="rounded-xl border border-white/10 p-4 text-center">
                                        <Icon className="w-4 h-4 text-neutral-500 mx-auto mb-2" />
                                        <p className="text-2xl font-serif-display text-white">{count}</p>
                                        <p className="text-[11px] uppercase tracking-wider text-neutral-600 mt-1">{SOURCE_META[key].label}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
