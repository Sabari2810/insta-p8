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
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-3 text-sm border-b-2",
        expired ? "bg-[#ec3013]/10 border-[#ec3013]/30 text-[#ae1800]" : "bg-[#201e1d]/[0.04] border-[#201e1d]/40 text-[#201e1d]",
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
        className="shrink-0 text-xs font-bold px-3 py-1.5 bg-[#ec3013] text-[#f3f2f2] hover:bg-[#dd2b0f] transition-colors"
      >
        Reconnect
      </button>
    </div>
  )
}
