"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { LandingPage } from "@/components/layout/landing-page"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have an active session or a callback code
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const savedId = localStorage.getItem("ig_user_id")

    if (code) {
      // Relay to dashboard to handle the handshake (via the new hook). `state` must be
      // forwarded too — the callback validates it against the oauth state cookie.
      const params = new URLSearchParams({ code })
      if (state) params.set("state", state)
      router.replace(`/dashboard?${params.toString()}`)
    } else if (savedId) {
      router.replace("/dashboard")
    }
  }, [searchParams, router])

  return <LandingPage />
}
