"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { AutomationList } from "@/components/dashboard/AutomationList"
import { CreateRuleForm } from "@/components/dashboard/CreateRuleForm"
import { PaginationControls } from "@/components/dashboard/PaginationControls"
import { MessageCircle, Send, Sparkles, Zap, Plus } from "lucide-react"
import type { Automation } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

export default function AutomationsPage() {
    const { userId, isLoading: isSessionLoading } = useInstagramSession()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [automations, setAutomations] = useState<Automation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'comment' | 'dm' | 'story'>('comment')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editRule, setEditRule] = useState<Automation | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Deep link from the dashboard's "New Rule" quick action
    useEffect(() => {
        if (searchParams.get("new") === "1") {
            setShowCreateForm(true)
            router.replace("/automations")
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

    const handleDeleteRule = async (id: string) => {
        await fetch(`/api/automations?id=${id}`, { method: "DELETE" })
        fetchAutomations()
    }

    const handleEditRule = (rule: Automation) => {
        setEditRule(rule)
        setShowCreateForm(true)
    }

    // Changing tabs invalidates whatever page we were on.
    useEffect(() => {
        setPage(1)
    }, [activeTab])

    if (isSessionLoading) return <div className="h-screen flex items-center justify-center bg-[#f6f5f3]">
        <Spinner />
    </div>
    if (!userId) return <div className="h-screen flex items-center justify-center bg-[#f6f5f3] text-neutral-500">Please log in</div>

    const filteredAutomations = automations.filter(a => a.trigger_source === activeTab)
    const pageCount = Math.max(1, Math.ceil(filteredAutomations.length / pageSize))
    const currentPage = Math.min(page, pageCount)
    const paginatedAutomations = filteredAutomations.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    const counts = {
        comment: automations.filter(a => a.trigger_source === 'comment').length,
        dm: automations.filter(a => a.trigger_source === 'dm').length,
        story: automations.filter(a => a.trigger_source === 'story').length,
    }

    const tabs = [
        { key: 'comment' as const, icon: <MessageCircle className="w-4 h-4" />, label: 'Comments', count: counts.comment },
        { key: 'dm' as const, icon: <Send className="w-4 h-4" />, label: 'DMs', count: counts.dm },
        { key: 'story' as const, icon: <Sparkles className="w-4 h-4" />, label: 'Stories', count: counts.story },
    ]

    return (
        <div className="min-h-screen bg-[#f6f5f3]">
            {/* Header */}
            <div className="px-12 py-10 bg-white">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Rules engine</p>
                        <h1 className="font-serif-display text-4xl md:text-5xl text-neutral-900 leading-none">Automations</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (showCreateForm) setEditRule(null)
                                setShowCreateForm(!showCreateForm)
                            }}
                            className={`flex items-center gap-2 h-9 px-5 rounded-full font-mono-ui text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${showCreateForm
                                ? 'border border-black/15 text-neutral-900 hover:border-black/30'
                                : 'bg-brand text-white hover:brightness-95'
                                }`}
                        >
                            <Plus className={`w-4 h-4 transition-transform duration-200 ${showCreateForm ? 'rotate-45' : ''}`} />
                            {showCreateForm ? 'Close' : 'New Rule'}
                        </button>
                    </div>
                </div>

                {/* Tabs — editorial underline */}
                <div className="flex items-center gap-6 border-b border-black/10 mt-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative flex items-center gap-2 pb-3 -mb-px font-mono-ui text-xs uppercase tracking-widest transition-colors border-b-2 ${activeTab === tab.key
                                ? 'text-brand border-brand'
                                : 'text-neutral-500 border-transparent hover:text-neutral-700'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-brand text-white' : 'bg-black/[0.06] text-neutral-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-8 space-y-8">

                {/* Create Form (Collapsible) */}
                {showCreateForm && (
                    <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CreateRuleForm
                            userId={userId}
                            triggerSource={editRule ? editRule.trigger_source : activeTab}
                            editRule={editRule}
                            onSuccess={() => {
                                fetchAutomations()
                                setShowCreateForm(false)
                                setEditRule(null)
                            }}
                        />
                    </div>
                )}


                {/* Automation List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AutomationList
                            automations={paginatedAutomations}
                            onDelete={handleDeleteRule}
                            onEdit={handleEditRule}
                            onChanged={fetchAutomations}
                            userId={userId}
                        />

                        {filteredAutomations.length > 0 && (
                            <PaginationControls
                                page={currentPage}
                                pageSize={pageSize}
                                total={filteredAutomations.length}
                                onPageChange={setPage}
                                onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
