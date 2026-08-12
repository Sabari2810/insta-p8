"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { AutomationList } from "@/components/dashboard/AutomationList"
import { CreateRuleForm } from "@/components/dashboard/CreateRuleForm"
import type { Automation } from "@/lib/types"

interface DashboardStats {
    metrics: {
        totalAutomations: number
        activeTriggers: number
        audienceReached: number
        messagesSent: number
    }
}

export default function AutomationsPage() {
    const { userId, isLoading: isSessionLoading } = useInstagramSession()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [automations, setAutomations] = useState<Automation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editRule, setEditRule] = useState<Automation | null>(null)

    // Deep link from the dashboard's "New Rule" quick action
    useEffect(() => {
        if (searchParams.get("new") === "1") {
            setShowCreateForm(true)
            router.replace("/dashboard/automations")
        }
    }, [searchParams, router])

    const fetchAutomations = useCallback(async () => {
        if (!userId) return
        try {
            const res = await fetch(`/api/automations?userId=${userId}`)
            const data = await res.json()
            if (res.ok) setAutomations(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (userId) fetchAutomations()
    }, [userId, fetchAutomations])

    useEffect(() => {
        if (!userId) return
        fetch(`/api/dashboard/stats?userId=${userId}`)
            .then((res) => res.json())
            .then((data) => data && !data.error && setStats(data))
            .catch(() => {})
    }, [userId])

    const handleDeleteRule = async (id: string) => {
        await fetch(`/api/automations?id=${id}`, { method: "DELETE" })
        fetchAutomations()
    }

    const handleEditRule = (rule: Automation) => {
        setEditRule(rule)
        setShowCreateForm(true)
    }

    if (isSessionLoading) return <div className="h-screen flex items-center justify-center bg-[#f3f2f2]"><div className="w-6 h-6 border-2 border-[#201e1d]/20 border-t-[#201e1d] rounded-full animate-spin" /></div>
    if (!userId) return <div className="h-screen flex items-center justify-center bg-[#f3f2f2] text-[#7d7979]">Please log in</div>

    const activeCount = automations.filter((a) => a.is_active !== false).length

    const statCells = [
        { label: "Active", value: String(activeCount) },
        { label: "Total automations", value: String(stats?.metrics.totalAutomations ?? automations.length) },
        { label: "Messages sent", value: String(stats?.metrics.messagesSent ?? 0) },
        { label: "Audience reached", value: String(stats?.metrics.audienceReached ?? 0) },
    ]

    return (
        <div className="min-h-screen bg-[#f3f2f2] text-[#201e1d]">
            {showCreateForm ? (
                <CreateRuleForm
                    userId={userId}
                    editRule={editRule}
                    onCancel={() => { setShowCreateForm(false); setEditRule(null) }}
                    onSuccess={() => {
                        fetchAutomations()
                        setShowCreateForm(false)
                        setEditRule(null)
                    }}
                />
            ) : (
                <div>
                    <header className="flex items-end justify-between gap-6 px-6 md:px-8 pt-7 pb-5 border-b-2 border-[#201e1d]/40">
                        <div>
                            <h6 className="text-[11px] tracking-[0.08em] uppercase text-[#7d7979] mb-1.5">Automations</h6>
                            <h1 className="text-4xl md:text-[38px] font-black leading-none tracking-[-0.02em]">All automations</h1>
                        </div>
                        <button
                            onClick={() => { setEditRule(null); setShowCreateForm(true) }}
                            className="px-[18px] py-2.5 text-sm font-bold bg-[#ec3013] text-[#f3f2f2] hover:bg-[#dd2b0f] transition-colors shrink-0"
                        >
                            New automation
                        </button>
                    </header>

                    <div className="grid grid-cols-2 md:grid-cols-4 border-b-2 border-[#201e1d]/40">
                        {statCells.map((s, i) => (
                            <div key={s.label} className={`px-6 py-[18px] ${i < statCells.length - 1 ? "md:border-r border-[#201e1d]/25" : ""}`}>
                                <div className="text-[11px] tracking-[0.08em] uppercase text-[#7d7979]">{s.label}</div>
                                <div className="text-3xl font-black tracking-[-0.02em] mt-1">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="px-6 md:px-8 pb-10">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-6 h-6 border-2 border-[#201e1d]/20 border-t-[#201e1d] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <AutomationList
                                automations={automations}
                                onDelete={handleDeleteRule}
                                onEdit={handleEditRule}
                                onChanged={fetchAutomations}
                                userId={userId}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
