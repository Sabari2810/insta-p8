"use client"

import { useEffect, useState, useRef } from "react"
import { FiSend as Send, FiZap as Zap, FiChevronLeft as ChevronLeft, FiPlus as Plus, FiX as X, FiPaperclip as Paperclip } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/inbox/Avatar"
import type { Message } from "@/types/db"
import { Spinner } from "../ui/spinner"

interface ChatWindowProps {
    conversationId: string | null
    recipientId?: string
    recipientName: string | null
    userId: string
    tags?: string[]
    profilePicUrl?: string | null
    onTagsChanged?: (tags: string[]) => void
    onBack?: () => void
}

export function ChatWindow({ conversationId, recipientId, recipientName, userId, tags = [], profilePicUrl, onTagsChanged, onBack }: ChatWindowProps) {
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
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center bg-white/70 h-full">
                <div className="w-16 h-16 rounded-full bg-black/[0.04] flex items-center justify-center">
                    <Send className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-neutral-900">Your Messages</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                        Select a conversation from the left to start chatting live with your audience.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white/70 relative">
            {/* Header */}
            <div className="h-16 border-b border-black/10 flex items-center justify-between px-4 md:px-6 bg-white/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 text-muted-foreground">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    )}
                    <Avatar src={profilePicUrl} size={32} />
                    <div className="min-w-0">
                        <h3 className="font-bold text-neutral-900 text-sm truncate">@{recipientName}</h3>
                    </div>
                </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap px-4 md:px-6 py-2.5 border-b border-black/10 bg-black/[0.015] shrink-0">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-700 bg-black/[0.04] border border-black/10 rounded-full pl-2.5 pr-1.5 py-1"
                    >
                        {tag}
                        <button
                            onClick={() => handleRemoveTag(tag)}
                            disabled={savingTags}
                            className="text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <div className="flex items-center gap-1 bg-black/[0.02] border border-black/10 rounded-full pl-2 pr-1 py-1">
                    <Plus className="w-3 h-3 text-neutral-400" />
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
                        className="w-16 bg-transparent text-[10px] uppercase tracking-wider text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Spinner />
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = !msg.is_from_instagram
                        const isImage = msg.attachment_type === "image" && msg.attachment_url
                        const isVideo = msg.attachment_type === "video" && msg.attachment_url
                        const isOtherAttachment = msg.attachment_url && !isImage && !isVideo
                        const isPlaceholderText = /^\[.+\]$/.test(msg.content || "")
                        const showText = msg.content && (!isPlaceholderText || (!isImage && !isVideo && !isOtherAttachment))
                        return (
                            <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm break-words space-y-2",
                                    isMe
                                        ? "bg-brand text-white rounded-br-none"
                                        : "bg-black/[0.05] text-neutral-900 rounded-bl-none border border-black/5"
                                )}>
                                    {isImage && (
                                        <img src={msg.attachment_url!} alt="" className="rounded-lg max-h-64 max-w-full object-cover" />
                                    )}
                                    {isVideo && (
                                        <video src={msg.attachment_url!} controls className="rounded-lg max-h-64 max-w-full" />
                                    )}
                                    {isOtherAttachment && (
                                        <a
                                            href={msg.attachment_url!}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn("flex items-center gap-1.5 underline underline-offset-2", isMe ? "text-white" : "text-neutral-900")}
                                        >
                                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                            {msg.attachment_type ? `Sent a ${msg.attachment_type.replace(/_/g, " ")}` : "Sent an attachment"}
                                        </a>
                                    )}
                                    {showText && <div>{msg.content}</div>}
                                    <div className={cn(
                                        "text-[10px] opacity-70",
                                        isMe ? "text-white/60 text-right" : "text-neutral-500"
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
                <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white/95 border border-black/10 rounded-xl shadow-2xl backdrop-blur-xl p-2 z-50">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Quick Responses</div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {automations.map(auto => (
                            <button
                                key={auto.id}
                                onClick={() => handleSendMessage(auto.response_content?.message || auto.name)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/[0.05] text-sm text-neutral-900 transition-colors flex items-center gap-2"
                            >
                                <Zap className="w-3 h-3 text-amber-500" />
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
            <div className="p-3 md:p-4 border-t border-black/10 bg-white/70 shrink-0">
                <div className="flex items-center gap-2 bg-black/[0.03] rounded-xl border border-black/10 p-1.5 focus-within:border-brand transition-all">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsAutomationOpen(!isAutomationOpen)}
                        className={cn("h-9 w-9 hover:bg-black/[0.06] text-muted-foreground hover:text-amber-500 transition-colors shrink-0", isAutomationOpen && "text-amber-500 bg-amber-500/10")}
                    >
                        <Zap className="w-5 h-5" />
                    </Button>
                    <input
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none placeholder:text-muted-foreground/60 min-w-0"
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
                        className="h-9 w-9 bg-brand hover:brightness-95 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {sending ? <Spinner /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
