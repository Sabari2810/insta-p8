"use client"

import { useEffect, useState, useRef } from "react"
import { Send, Loader2, Zap, ChevronLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/db"

interface ChatWindowProps {
    conversationId: string | null
    recipientId?: string
    recipientName: string | null
    userId: string
    tags?: string[]
    onTagsChanged?: (tags: string[]) => void
    onBack?: () => void
}

export function ChatWindow({ conversationId, recipientId, recipientName, userId, tags = [], onTagsChanged, onBack }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [inputText, setInputText] = useState("")
    const [sending, setSending] = useState(false)
    const [isAutomationOpen, setIsAutomationOpen] = useState(false)
    const [automations, setAutomations] = useState<any[]>([])
    const [tagInput, setTagInput] = useState("")
    const [savingTags, setSavingTags] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!conversationId) return

        const fetchMessages = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/inbox/messages?conversationId=${conversationId}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setMessages(data)
                }
            } catch (error) {
                console.error("Failed to load messages", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMessages()
    }, [conversationId])

    // Fetch automations for quick reply
    useEffect(() => {
        if (userId) {
            fetch(`/api/automations?userId=${userId}`).then(res => res.json()).then(data => {
                if (Array.isArray(data)) setAutomations(data)
            })
        }
    }, [userId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSendMessage = async (text: string = inputText) => {
        if (!text.trim() || !recipientId || !userId) return

        setSending(true)
        try {
            const res = await fetch("/api/inbox/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    recipientId,
                    message: text
                })
            })

            if (res.ok) {
                setInputText("")
                // Optimistic update
                const newMsg: Message = {
                    id: `temp_${Date.now()}`,
                    conversation_id: conversationId!,
                    user_id: userId,
                    sender_id: "me",
                    sender_username: "Me",
                    content: text,
                    is_from_instagram: false,
                    created_at: new Date().toISOString()
                }
                setMessages(prev => [...prev, newMsg])
            }
        } catch (e) {
            console.error("Send failed", e)
        } finally {
            setSending(false)
            setIsAutomationOpen(false)
        }
    }

    const saveTags = async (nextTags: string[]) => {
        if (!conversationId) return
        setSavingTags(true)
        try {
            const res = await fetch("/api/inbox/conversations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, tags: nextTags }),
            })
            if (res.ok) {
                const data = await res.json()
                onTagsChanged?.(data.tags || nextTags)
            }
        } catch (e) {
            console.error("Failed to save tags", e)
        } finally {
            setSavingTags(false)
        }
    }

    const handleAddTag = () => {
        const value = tagInput.trim()
        if (!value || tags.includes(value)) {
            setTagInput("")
            return
        }
        setTagInput("")
        saveTags([...tags, value])
    }

    const handleRemoveTag = (tag: string) => {
        saveTags(tags.filter((t) => t !== tag))
    }

    if (!conversationId) {
        return (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center bg-black/40 h-full">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Send className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Your Messages</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                        Select a conversation from the left to start chatting live with your audience.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-black/40 relative">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-black/20 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 text-muted-foreground">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    )}
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 shrink-0" />
                    <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">@{recipientName}</h3>
                    </div>
                </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap px-4 md:px-6 py-2.5 border-b border-white/5 bg-black/10 shrink-0">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-300 bg-white/5 border border-white/10 rounded-full pl-2.5 pr-1.5 py-1"
                    >
                        {tag}
                        <button
                            onClick={() => handleRemoveTag(tag)}
                            disabled={savingTags}
                            className="text-neutral-500 hover:text-white disabled:opacity-50"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full pl-2 pr-1 py-1">
                    <Plus className="w-3 h-3 text-neutral-600" />
                    <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddTag()
                            }
                        }}
                        placeholder="Add tag"
                        disabled={savingTags}
                        className="w-16 bg-transparent text-[10px] uppercase tracking-wider text-white placeholder:text-neutral-600 focus:outline-none disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = !msg.is_from_instagram
                        return (
                            <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm break-words",
                                    isMe
                                        ? "bg-[#ffe14d] text-black rounded-br-none"
                                        : "bg-white/10 text-white rounded-bl-none border border-white/5"
                                )}>
                                    {msg.content}
                                    <div className={cn(
                                        "text-[10px] mt-1 opacity-70",
                                        isMe ? "text-black/50 text-right" : "text-neutral-500"
                                    )}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Automation Popup */}
            {isAutomationOpen && (
                <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl p-2 z-50">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Quick Responses</div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {automations.map(auto => (
                            <button
                                key={auto.id}
                                onClick={() => handleSendMessage(auto.response_content?.message || auto.name)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white transition-colors flex items-center gap-2"
                            >
                                <Zap className="w-3 h-3 text-yellow-400" />
                                <span className="truncate">{auto.name}</span>
                            </button>
                        ))}
                        {automations.length === 0 && (
                            <div className="px-3 py-4 text-center text-muted-foreground text-xs">No automations found.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-white/5 bg-black/40 shrink-0">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 p-1.5 focus-within:border-[#ffe14d]/50 transition-all">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsAutomationOpen(!isAutomationOpen)}
                        className={cn("h-9 w-9 hover:bg-white/10 text-muted-foreground hover:text-yellow-400 transition-colors shrink-0", isAutomationOpen && "text-yellow-400 bg-yellow-400/10")}
                    >
                        <Zap className="w-5 h-5" />
                    </Button>
                    <input
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-muted-foreground/50 min-w-0"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !sending) {
                                e.preventDefault()
                                handleSendMessage()
                            }
                        }}
                        disabled={sending}
                    />
                    <Button
                        onClick={() => handleSendMessage()}
                        disabled={sending || !inputText.trim()}
                        size="icon"
                        className="h-9 w-9 bg-[#ffe14d] hover:brightness-95 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
