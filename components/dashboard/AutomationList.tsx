"use client"

import { useEffect, useState } from "react"
import { Zap, Pencil, Copy, Trash2 } from "lucide-react"
import type { Automation } from "@/lib/types"
import { toast } from "sonner"

interface AutomationListProps {
  automations: Automation[]
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onChanged: () => void
  userId: string
}

const SOURCE_LABEL: Record<Automation["trigger_source"], string> = {
  comment: "Comment",
  dm: "Direct message",
  story: "Story",
}

function delayLabel(delaySeconds: unknown): string {
  if (delaySeconds === "random") return "Random 3–10s"
  if (typeof delaySeconds === "number" && delaySeconds > 0) return `${delaySeconds}s`
  return "Instant"
}

function triggerLabel(rule: Automation): string {
  if (rule.trigger_type === "reply_all") return "Any comment"
  if (rule.trigger_type === "mention") return "Story mention"
  if (rule.trigger_type === "reaction") return "Story reaction"
  if (rule.trigger_type === "reply") return "Story reply"
  const first = rule.trigger_value.split(",").map((t) => t.trim()).filter(Boolean)[0]
  return first ? `keyword: ${first}` : "keyword"
}

function contentLabel(rule: Automation, mediaCount: number): string {
  if (rule.trigger_source === "story") return "All stories"
  if (rule.trigger_source === "dm") return "All DMs"
  return rule.specific_media_id ? "1 post selected" : mediaCount > 0 ? `${mediaCount} posts` : "All posts & reels"
}

export function AutomationList({ automations, onDelete, onEdit, onChanged, userId }: AutomationListProps) {
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!userId || !automations.some((a) => a.specific_media_id)) return
    fetch(`/api/instagram/media?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          const map: Record<string, string> = {}
          data.data.forEach((item: any) => { map[item.id] = item.thumbnail_url || item.media_url })
          setMediaMap(map)
        }
      })
      .catch((e) => console.error("Failed to load thumbnails", e))
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
      <div className="border border-dashed border-[#201e1d]/40 p-12 text-center mt-8">
        <div className="w-14 h-14 mx-auto mb-4 bg-[#ec3013]/10 border border-[#ec3013]/25 flex items-center justify-center">
          <Zap className="w-6 h-6 text-[#ec3013]" />
        </div>
        <h3 className="text-base font-bold mb-1">No automations yet</h3>
        <p className="text-sm text-[#7d7979] max-w-sm mx-auto">
          Create your first automation above — it just takes 30 seconds.
        </p>
      </div>
    )
  }

  return (
    <table className="w-full border-collapse mt-2">
      <thead>
        <tr>
          {["Automation", "Trigger", "Content", "Delay", "Sent", ""].map((h, i) => (
            <th
              key={h || i}
              className={`text-[11px] tracking-[0.08em] uppercase text-[#7d7979] border-b-2 border-[#201e1d]/40 py-3 px-2 ${
                i === 4 ? "text-right" : i === 5 ? "text-right" : "text-left"
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {automations.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            mediaUrl={rule.specific_media_id ? mediaMap[rule.specific_media_id] : undefined}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggle={handleToggle}
            onDuplicate={handleDuplicate}
          />
        ))}
      </tbody>
    </table>
  )
}

function RuleRow({ rule, mediaUrl, onDelete, onEdit, onToggle, onDuplicate }: {
  rule: Automation
  mediaUrl?: string
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onToggle: (rule: Automation, active: boolean) => void
  onDuplicate: (rule: Automation) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const content: any = rule.response_content || {}
  const isCard = !!content.card
  const isMedia = !!content.media
  const summary = isCard
    ? content.card.title
    : isMedia
      ? `${content.media.type} attachment`
      : (content.message?.slice(0, 60) || "") + (content.message?.length > 60 ? "…" : "")
  const isPaused = rule.is_active === false

  return (
    <tr className="group border-b border-[#201e1d]/25">
      <td className="py-3.5 px-2 align-top">
        <div className="font-bold text-[15px]">{rule.name}</div>
        <div className="text-xs text-[#7d7979]">{summary || "No message set"}</div>
      </td>
      <td className="py-3.5 px-2 align-top text-[13px]">
        <span className="inline-block px-2 py-0.5 text-[11px] tracking-[0.06em] uppercase border border-[#201e1d]/40 rounded-full">
          {SOURCE_LABEL[rule.trigger_source]}
        </span>
        <div className="mt-1.5">{triggerLabel(rule)}</div>
      </td>
      <td className="py-3.5 px-2 align-top text-[13px]">
        <div className="flex items-center gap-2">
          {mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="w-6 h-6 object-cover shrink-0" />
          )}
          {contentLabel(rule, 0)}
        </div>
      </td>
      <td className="py-3.5 px-2 align-top text-[13px]">{delayLabel(content.delay_seconds)}</td>
      <td className="py-3.5 px-2 align-top text-[13px] text-right tabular-nums">{(rule.trigger_count ?? 0).toLocaleString()}</td>
      <td className="py-3.5 px-2 align-top text-right">
        <div className="flex items-center justify-end gap-1.5">
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setConfirming(false)} className="text-[11px] font-bold uppercase tracking-wider text-[#7d7979] hover:text-[#201e1d] px-2 py-1">
                Cancel
              </button>
              <button onClick={() => onDelete(rule.id)} className="text-[11px] font-bold uppercase tracking-wider text-[#f3f2f2] bg-[#ec3013] hover:bg-[#dd2b0f] px-2.5 py-1">
                Delete
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => onEdit(rule)} title="Edit" className="p-1.5 text-[#7d7979] hover:text-[#201e1d] opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDuplicate(rule)} title="Duplicate" className="p-1.5 text-[#7d7979] hover:text-[#201e1d] opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirming(true)} title="Delete" className="p-1.5 text-[#7d7979] hover:text-[#ec3013] opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onToggle(rule, isPaused)}
                className="border border-[#201e1d]/40 hover:bg-[#201e1d]/[0.06] px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ml-1"
              >
                <span className={`w-2 h-2 shrink-0 ${isPaused ? "bg-[#bab6b6]" : "bg-[#ec3013]"}`} />
                {isPaused ? "Paused" : "Active"}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
