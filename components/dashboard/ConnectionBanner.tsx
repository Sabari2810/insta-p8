"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Only surfaces once a token is close to (or past) expiry — the cron job at
// /api/cron/refresh-tokens should keep this from ever being seen in normal operation.
const WARNING_THRESHOLD_DAYS = 7

export function ConnectionBanner() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/instagram/connection-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.daysRemaining === "number") setDaysRemaining(data.daysRemaining)
      })
      .catch(() => {})
  }, [])

  if (daysRemaining === null || daysRemaining > WARNING_THRESHOLD_DAYS) return null

  const expired = daysRemaining <= 0

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-3 text-sm border-b",
        expired ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-black/[0.03] border-black/10 text-neutral-900",
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          {expired
            ? "Your Instagram connection expired. Automations are paused until you reconnect."
            : `Your Instagram connection expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. It should refresh automatically, but you can reconnect now to be safe.`}
        </span>
      </div>
      <button
        onClick={() => {
          window.location.href = "/api/instagram/login"
        }}
        className="shrink-0 font-mono-ui text-xs font-bold px-3 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
      >
        Reconnect
      </button>
    </div>
  )
}
