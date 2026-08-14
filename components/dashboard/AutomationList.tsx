"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Trash2, Globe, Instagram, Zap, ArrowRight, Lock, MessageCircle, Send,
  Pencil, Copy, Image as ImageIcon, Megaphone, EyeOff, Timer,
} from "lucide-react"
import type { Automation } from "@/lib/types"
import { toast } from "sonner"

interface AutomationListProps {
  automations: Automation[]
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onChanged: () => void
  userId: string
}

export function AutomationList({ automations, onDelete, onEdit, onChanged, userId }: AutomationListProps) {
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({})

  const globalRules = automations.filter((rule) => !rule.specific_media_id)
  const postSpecificRules = automations.filter((rule) => rule.specific_media_id)

  useEffect(() => {
    if (!userId || postSpecificRules.length === 0) return
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/instagram/media?userId=${userId}`)
        const data = await res.json()
        if (data.data && Array.isArray(data.data)) {
          const map: Record<string, string> = {}
          data.data.forEach((item: any) => { map[item.id] = item.thumbnail_url || item.media_url })
          setMediaMap(map)
        }
      } catch (e) { console.error("Failed to load thumbnails", e) }
    }
    fetchMedia()
  }, [userId, automations.length])

  const handleToggle = async (rule: Automation, active: boolean) => {
    const res = await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, is_active: active }),
    })
    if (res.ok) {
      toast.success(active ? "Automation enabled" : "Automation paused")
      onChanged()
    } else {
      toast.error("Failed to update")
    }
  }

  const handleDuplicate = async (rule: Automation) => {
    const res = await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, action: "duplicate" }),
    })
    if (res.ok) {
      toast.success("Duplicated — the copy starts paused")
      onChanged()
    } else {
      toast.error("Failed to duplicate")
    }
  }

  if (automations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-black/[0.04] rounded-2xl flex items-center justify-center border border-black/10">
          <Zap className="w-7 h-7 text-neutral-400" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-1">No automations yet</h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          Create your first automation above — it just takes 30 seconds.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
          Rules
          <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[10px]">{automations.length}</span>
        </h2>
      </div>

      <div className="space-y-3">
        {globalRules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 ml-1">
              <Globe className="w-3 h-3" /> Global
            </div>
            {globalRules.map((rule, idx) => (
              <RuleCard key={rule.id} rule={rule} onDelete={onDelete} onEdit={onEdit} onToggle={handleToggle} onDuplicate={handleDuplicate} index={idx} />
            ))}
          </div>
        )}

        {postSpecificRules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-pink-600 ml-1">
              <Instagram className="w-3 h-3" /> Post Specific
            </div>
            {postSpecificRules.map((rule, idx) => (
              <RuleCard key={rule.id} rule={rule} onDelete={onDelete} onEdit={onEdit} onToggle={handleToggle} onDuplicate={handleDuplicate} index={idx} mediaUrl={mediaMap[rule.specific_media_id || ""]} isSpecific />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RuleCard({ rule, onDelete, onEdit, onToggle, onDuplicate, index, isSpecific, mediaUrl }: {
  rule: Automation
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onToggle: (rule: Automation, active: boolean) => void
  onDuplicate: (rule: Automation) => void
  index: number
  isSpecific?: boolean
  mediaUrl?: string
}) {
  const [confirming, setConfirming] = useState(false)
  const keywords = rule.trigger_value.split(",").map(k => k.trim()).filter(Boolean)
  const content: any = rule.response_content || {}
  const isCard = !!content.card
  const isMedia = !!content.media
  const responsePreview = isCard
    ? content.card.title
    : isMedia
      ? `${content.media.type} attachment`
      : (content.message?.slice(0, 50) || "") + (content.message?.length > 50 ? "..." : "")

  const replyMode = content.reply_mode
  const isPaused = rule.is_active === false

  return (
    <div
      className={`group p-4 rounded-xl border transition-all duration-200 ${
        isPaused
          ? "border-black/5 bg-black/[0.01] opacity-60"
          : "border-black/5 bg-black/[0.015] hover:bg-black/[0.03] hover:border-black/10"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        {isSpecific ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/[0.04] shrink-0 border border-black/10">
            {mediaUrl ? (
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Instagram className="w-4 h-4 text-neutral-400" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-neutral-900 truncate">{rule.name}</h4>
            <div className="flex items-center gap-1 shrink-0">
              {confirming ? (
                <div className="flex items-center gap-1 animate-in fade-in">
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} className="h-7 text-xs text-neutral-500">Cancel</Button>
                  <Button size="sm" onClick={() => onDelete(rule.id)} className="h-7 text-xs bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-500/20">Delete</Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost" size="icon" onClick={() => onEdit(rule)} title="Edit"
                    className="h-7 w-7 text-neutral-500 hover:text-brand hover:bg-brand/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" onClick={() => onDuplicate(rule)} title="Duplicate"
                    className="h-7 w-7 text-neutral-500 hover:text-brand hover:bg-brand/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" onClick={() => setConfirming(true)} title="Delete"
                    className="h-7 w-7 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Switch
                    checked={!isPaused}
                    onCheckedChange={(v) => onToggle(rule, v)}
                    className="ml-1 scale-90"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {keywords.slice(0, 3).map((kw, i) => (
                <Badge key={i} variant="secondary" className="bg-black/[0.04] text-neutral-700 border border-black/10 text-[10px] font-mono px-1.5 py-0">
                  {kw}
                </Badge>
              ))}
              {keywords.length > 3 && (
                <span className="text-[10px] text-neutral-500">+{keywords.length - 3}</span>
              )}
            </div>

            <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />

            <div className="flex items-center gap-1.5">
              {isCard ? (
                <Send className="w-3 h-3 text-blue-500" />
              ) : isMedia ? (
                <ImageIcon className="w-3 h-3 text-pink-500" />
              ) : (
                <MessageCircle className="w-3 h-3 text-brand" />
              )}
              <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">{responsePreview}</span>
            </div>

            {replyMode === "dm_only" && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] px-1.5 py-0">
                <EyeOff className="w-2.5 h-2.5 mr-0.5" /> DM only
              </Badge>
            )}
            {replyMode === "public_only" && (
              <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 border border-pink-500/20 text-[10px] px-1.5 py-0">
                <Megaphone className="w-2.5 h-2.5 mr-0.5" /> Public only
              </Badge>
            )}
            {content.delay_seconds === "random" && (
              <Badge variant="secondary" className="bg-black/[0.04] text-neutral-500 border border-black/10 text-[10px] px-1.5 py-0">
                <Timer className="w-2.5 h-2.5 mr-0.5" /> 3–10s
              </Badge>
            )}
            {typeof content.delay_seconds === "number" && content.delay_seconds > 0 && (
              <Badge variant="secondary" className="bg-black/[0.04] text-neutral-500 border border-black/10 text-[10px] px-1.5 py-0">
                <Timer className="w-2.5 h-2.5 mr-0.5" /> {content.delay_seconds}s
              </Badge>
            )}
            {content.check_follow && (
              <Badge variant="secondary" className="bg-brand/10 text-brand border border-brand/30 text-[10px] px-1.5 py-0">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> Follow
              </Badge>
            )}
            {isPaused && (
              <Badge variant="secondary" className="bg-black/[0.04] text-neutral-500 border border-black/10 text-[10px] px-1.5 py-0">
                Paused
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
