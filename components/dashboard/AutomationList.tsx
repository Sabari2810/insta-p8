"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { FiEdit2 as Pencil, FiCopy as Copy, FiTrash2 as Trash2, FiZap as Zap } from "react-icons/fi"
import type { Automation } from "@/lib/types"
import { toast } from "sonner"

interface AutomationListProps {
  automations: Automation[]
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onChanged: () => void
  userId: string
  emptyTitle?: string
  emptyHint?: string
}

function triggerLabel(rule: Automation) {
  if (rule.trigger_type === "postback") return "Button tap"
  if (rule.trigger_type === "reply_all") return "Any reply"
  if (rule.trigger_type === "mention") return "Mention"
  if (rule.trigger_type === "reaction") return "Story reaction"
  const keywords = rule.trigger_value.split(",").map((k) => k.trim()).filter(Boolean)
  const shown = keywords.slice(0, 3).join(", ")
  const extra = keywords.length > 3 ? ` +${keywords.length - 3}` : ""
  return `keyword: ${shown}${extra}`
}

function subtitleLabel(rule: Automation) {
  const content: any = rule.response_content || {}
  const parts: string[] = []
  if (rule.trigger_source === "comment") {
    if (content.reply_mode === "dm_only") parts.push("DM only")
    else if (content.reply_mode === "public_only") parts.push("Public reply only")
    else parts.push("Public reply + DM")
  } else if (rule.trigger_source === "story") {
    parts.push("Story reply")
  } else {
    parts.push("DM trigger")
  }
  if (content.check_follow) parts.push("follow gate")
  return parts.join(", ")
}

function contentLabel(rule: Automation) {
  const content: any = rule.response_content || {}
  if (content.card) return "Card"
  if (content.media) return content.media.type.charAt(0).toUpperCase() + content.media.type.slice(1)
  return "Message"
}

function delayLabel(rule: Automation) {
  const delay = (rule.response_content as any)?.delay_seconds
  if (delay === "random") return "3–10s"
  if (typeof delay === "number" && delay > 0) {
    return delay >= 60 ? `${Math.round(delay / 60)} min` : `${delay}s`
  }
  return "Instant"
}

export function AutomationList({
  automations, onDelete, onEdit, onChanged, userId,
  emptyTitle = "No automations yet", emptyHint = "Create your first automation above — it just takes 30 seconds.",
}: AutomationListProps) {
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
        <h3 className="text-base font-bold text-neutral-900 mb-1">{emptyTitle}</h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
          {emptyHint}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-left font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold px-6 py-3">Automation</th>
              <th className="text-left font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold px-6 py-3">Trigger</th>
              <th className="text-left font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold px-6 py-3">Content</th>
              <th className="text-left font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold px-6 py-3">Delay</th>
              <th className="text-right font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold px-6 py-3">Sent</th>
              <th className="text-right font-mono-ui text-[10px] uppercase tracking-widest text-neutral-500 font-semibold px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {automations.map((rule) => (
              <AutomationRow
                key={rule.id}
                rule={rule}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggle={handleToggle}
                onDuplicate={handleDuplicate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AutomationRow({ rule, onDelete, onEdit, onToggle, onDuplicate }: {
  rule: Automation
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onToggle: (rule: Automation, active: boolean) => void
  onDuplicate: (rule: Automation) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const isPaused = rule.is_active === false

  return (
    <tr className="group border-b border-black/5 last:border-b-0 hover:bg-black/[0.015] transition-colors">
      <td className="px-6 py-4 align-top">
        <p className="text-sm font-bold text-neutral-900">{rule.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{subtitleLabel(rule)}</p>
      </td>
      <td className="px-6 py-4 align-top text-xs text-neutral-500 font-mono-ui whitespace-nowrap">{triggerLabel(rule)}</td>
      <td className="px-6 py-4 align-top text-xs font-medium text-amber-600 whitespace-nowrap">{contentLabel(rule)}</td>
      <td className="px-6 py-4 align-top text-xs text-neutral-500 whitespace-nowrap">{delayLabel(rule)}</td>
      <td className="px-6 py-4 align-top text-xs text-neutral-700 text-right tabular-nums whitespace-nowrap">
        {(rule.trigger_count || 0).toLocaleString()}
      </td>
      <td className="px-6 py-4 align-top">
        <div className="flex items-center justify-end gap-1.5">
          {confirming ? (
            <div className="flex items-center gap-1 animate-in fade-in">
              <button onClick={() => setConfirming(false)} className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1">Cancel</button>
              <button onClick={() => onDelete(rule.id)} className="text-xs text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full px-2.5 py-1">Delete</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(rule)} title="Edit" className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-brand hover:bg-brand/10 transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => onDuplicate(rule)} title="Duplicate" className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-brand hover:bg-brand/10 transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={() => setConfirming(true)} title="Delete" className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
                <Switch checked={!isPaused} onCheckedChange={(v) => onToggle(rule, v)} className="ml-1 scale-90" />
              </div>
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                isPaused ? "border-black/15 text-neutral-500" : "border-brand/30 text-brand"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-neutral-300" : "bg-brand"}`} />
                {isPaused ? "Paused" : "Active"}
              </span>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
