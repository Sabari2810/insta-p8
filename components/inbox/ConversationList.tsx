"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/inbox/Avatar"
import type { Conversation } from "@/types/db"

interface ConversationListProps {
    userId: string
    selectedId: string | null
    refreshKey: number
    onSelect: (id: string, username: string, recipientId: string, tags: string[], profilePicUrl: string | null) => void
    initialConversationId?: string | null
}

export function ConversationList({ userId, selectedId, refreshKey, onSelect, initialConversationId }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const didAutoSelect = useRef(false)

    useEffect(() => {
        if (!userId) return

        const fetchConversations = async () => {
            try {
                const res = await fetch(`/api/inbox/conversations?userId=${userId}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setConversations(data)

                    if (!didAutoSelect.current && initialConversationId) {
                        didAutoSelect.current = true
                        const target = data.find((c: Conversation) => c.id === initialConversationId)
                        if (target) {
                            onSelect(target.id, target.recipient_username, target.recipient_id.toString(), target.tags || [], target.profile_pic_url)
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load conversations", error)
            } finally {
                setLoading(false)
            }
        }

        fetchConversations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, refreshKey])

    const allTags = useMemo(() => {
        const set = new Set<string>()
        conversations.forEach((c) => (c.tags || []).forEach((t) => set.add(t)))
        return Array.from(set).sort()
    }, [conversations])

    const visibleConversations = conversations
        .filter((c) => !activeTag || (c.tags || []).includes(activeTag))
        .filter((c) => !search.trim() || c.recipient_username.toLowerCase().includes(search.trim().toLowerCase()))

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-neutral-300 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full border-r border-black/10 bg-white/40 w-full md:w-[350px]">
            <div className="p-4 border-b border-black/10 space-y-3">
                <h2 className="text-lg font-bold text-neutral-900">Inbox</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/[0.03] border border-black/10 rounded-xl pl-10 pr-4 py-2 text-sm text-neutral-900 focus:outline-none focus:border-brand placeholder:text-muted-foreground/60 transition-all"
                        placeholder="Search by username..."
                    />
                </div>
                {allTags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={() => setActiveTag(null)}
                            className={cn(
                                "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors",
                                !activeTag ? "bg-brand text-black border-brand" : "text-neutral-500 border-black/10 hover:text-neutral-900 hover:border-black/25",
                            )}
                        >
                            All
                        </button>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                                className={cn(
                                    "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors",
                                    activeTag === tag ? "bg-brand text-black border-brand" : "text-neutral-500 border-black/10 hover:text-neutral-900 hover:border-black/25",
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {visibleConversations.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                        {conversations.length === 0
                            ? "No conversations yet."
                            : search.trim()
                              ? `No conversations matching "${search.trim()}".`
                              : `No conversations tagged "${activeTag}".`}
                    </div>
                ) : (
                    visibleConversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => onSelect(conv.id, conv.recipient_username, conv.recipient_id.toString(), conv.tags || [], conv.profile_pic_url)}
                            className={cn(
                                "p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors border border-transparent",
                                selectedId === conv.id
                                    ? "bg-brand/[0.08] border-brand/25"
                                    : "hover:bg-black/[0.03] hover:border-black/5"
                            )}
                        >
                            <Avatar src={conv.profile_pic_url} size={48} />
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={cn(
                                        "font-semibold text-sm truncate",
                                        selectedId === conv.id ? "text-brand-dark" : "text-neutral-900"
                                    )}>
                                        {conv.recipient_username}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                {conv.tags?.length > 0 ? (
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {conv.tags.map((tag) => (
                                            <span key={tag} className="text-[9px] uppercase tracking-wider text-neutral-500 bg-black/[0.04] rounded-full px-1.5 py-0.5">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground truncate">
                                        Open to view conversation
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
