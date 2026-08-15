"use client"

import { useState, useEffect } from "react"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FiPlus as Plus, FiSave as Save, FiRefreshCw as RefreshCw } from "react-icons/fi"
import { toast } from "sonner"
import type { IceBreaker } from "@/types/db"
import { Spinner } from "../ui/spinner"

export function IceBreakersManager() {
    const { userId, isLoading } = useInstagramSession()
    const [breakers, setBreakers] = useState<Partial<IceBreaker>[]>([])
    const [saving, setSaving] = useState(false)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!userId) return
        fetch(`/api/ice-breakers?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBreakers(data)
                setFetching(false)
            })
            .catch(err => {
                console.error(err)
                setFetching(false)
            })
    }, [userId])

    const handleAdd = () => {
        if (breakers.length >= 4) {
            toast.error("Maximum 4 Ice Breakers allowed by Instagram")
            return
        }
        setBreakers([...breakers, { question: "", response: "" }])
    }

    const handleChange = (index: number, field: "question" | "response", value: string) => {
        const newBreakers = [...breakers]
        newBreakers[index] = { ...newBreakers[index], [field]: value }
        setBreakers(newBreakers)
    }

    const handleRemove = (index: number) => {
        setBreakers(breakers.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!userId) return

        // Validation
        if (breakers.some(b => !b.question?.trim() || !b.response?.trim())) {
            toast.error("Please fill in all fields")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/ice-breakers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, iceBreakers: breakers })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Ice Breakers saved & synced usually!")
            } else {
                toast.error("Failed to save")
            }
        } catch (e) {
            toast.error("Error saving")
        } finally {
            setSaving(false)
        }
    }

    if (isLoading || fetching && !breakers.length) {
        return <div className="h-screen flex items-center justify-center bg-[#f6f5f3]"><Spinner /></div>
    }

    return (
        <div className="min-h-screen bg-[#f6f5f3]">
            {/* Header */}
            <div className="px-12 py-10 bg-white">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Conversation starters</p>
                        <h1 className="font-serif-display text-4xl md:text-5xl text-neutral-900 leading-none">Ice Breakers</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 h-9 px-5 rounded-full bg-brand text-white font-mono-ui text-[11px] font-bold uppercase tracking-widest transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Spinner /> : <Save className="w-4 h-4" />}
                        Save & Sync
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <p className="text-sm text-muted-foreground">
                    Questions people see when they start a chat with you.
                </p>

            <div className="space-y-5">
                {breakers.map((item, idx) => (
                    <div key={idx} className="bg-white border border-black/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500">Question</label>
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                        <Input
                            value={item.question}
                            onChange={e => handleChange(idx, "question", e.target.value)}
                            placeholder="e.g., What are your prices?"
                            className="bg-white border-black/10"
                            maxLength={80}
                        />
                        <div className="space-y-2">
                            <label className="font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500">Auto-response</label>
                            <Textarea
                                value={item.response}
                                onChange={e => handleChange(idx, "response", e.target.value)}
                                placeholder="The reply users will receive..."
                                className="bg-white border-black/10 resize-y"
                                rows={3}
                            />
                        </div>
                    </div>
                ))}

                {breakers.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-black/15 rounded-xl text-muted-foreground">
                        No ice breakers yet. Add one to get started!
                    </div>
                )}

                {breakers.length < 4 && (
                    <Button variant="outline" onClick={handleAdd} className="w-full border-dashed border-black/20 bg-black/[0.02] hover:bg-black/[0.04] text-neutral-900 font-semibold">
                        <Plus className="w-4 h-4 mr-2" /> Add question
                    </Button>
                )}
            </div>

            <div className="bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-3 text-sm text-neutral-500">
                <RefreshCw className="w-4 h-4 shrink-0" />
                <p>
                    Changes made here are automatically synced to your Instagram profile. It may take a few minutes for them to appear for all users.
                </p>
            </div>
            </div>
        </div>
    )
}
