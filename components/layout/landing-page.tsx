"use client"

import { useRouter } from "next/navigation"
import {
  MessageCircle, Sparkles, ArrowUpRight,
  Send, AtSign, Inbox, Lock, Terminal, ShieldCheck,
  Loader2,
} from "lucide-react"

export function LandingPage() {
  const router = useRouter()

  const handleLogin = () => {
    // Server route generates a CSRF state token and redirects to Instagram's authorize screen.
    window.location.href = "/api/instagram/login"
  }

  const handleTestLogin = async () => {
    try {
      const res = await fetch("/api/instagram/test-login", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("ig_user_id", data.userId)
        localStorage.setItem("ig_username", data.username)
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Dev login failed:", err)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] selection:bg-brand selection:text-black overflow-x-hidden antialiased">
      <div className="grain" />

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-5 md:px-10 h-16 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.jpeg" alt="" className="w-7 h-7 rounded-full" />
          <span className="font-mono-ui text-sm font-bold tracking-tight">Wingman</span>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={handleTestLogin}
              className="font-mono-ui text-xs font-bold text-brand border border-brand/30 rounded-full px-4 py-1.5 hover:bg-brand/10 transition-colors"
            >
              Dev Login
            </button>
          )}
          <button
            onClick={handleLogin}
            className="font-mono-ui text-xs font-bold bg-white text-black rounded-full px-4 py-1.5 hover:bg-brand transition-colors"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="relative px-5 md:px-10 pt-16 md:pt-28 pb-16 max-w-6xl mx-auto overflow-hidden">
          <div className="glow-orb orb-animate w-[32rem] h-[32rem] bg-brand -top-40 -left-40" />
          <div className="glow-orb orb-animate w-[26rem] h-[26rem] bg-violet top-10 right-0" style={{ animationDelay: "-6s" }} />
          <div className="glow-orb orb-animate w-[20rem] h-[20rem] bg-coral bottom-0 left-1/3" style={{ animationDelay: "-10s" }} />

          <div className="fade-up relative" style={{ animationDelay: "0ms" }}>
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.25em] text-neutral-500 mb-6">
              Instagram automation // your own private setup // built for creators & brands
            </p>
          </div>

          <h1 className="fade-up relative font-serif-display font-black text-[15vw] md:text-[7.5rem] leading-[0.95] tracking-tight" style={{ animationDelay: "80ms" }}>
            Your DMs,
            <br />
            <span className="italic gradient-text">on autopilot.</span>
          </h1>

          <div className="fade-up relative mt-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-16" style={{ animationDelay: "160ms" }}>
            <p className="text-neutral-400 text-base md:text-lg max-w-md leading-relaxed">
              Comment-to-DM funnels, keyword triggers, story reactions, and a live inbox —
              automation that converts, running on your own dedicated setup, never shared with anyone else's data.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLogin}
                className="group flex items-center gap-2 bg-brand text-black font-mono-ui text-sm font-bold px-7 py-4 rounded-full shadow-[0_0_40px_-8px_var(--accent-green)] hover:scale-[1.03] hover:shadow-[0_0_56px_-6px_var(--accent-green)] active:scale-[0.98] transition-all"
              >
                Connect Instagram
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={handleTestLogin}
                  className="group flex items-center gap-2 font-mono-ui text-sm font-bold text-brand border border-brand/25 px-7 py-4 rounded-full hover:bg-brand/10 active:scale-[0.98] transition-all"
                >
                  <Terminal className="w-4 h-4" />
                  Dev Login
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="relative border-y border-white/[0.08] py-3 overflow-hidden bg-gradient-to-r from-brand/[0.06] via-violet/[0.06] to-coral/[0.06]">
          <div className="marquee-track flex whitespace-nowrap font-mono-ui text-xs uppercase tracking-[0.2em] text-neutral-500 gap-8 w-max">
            {Array.from({ length: 2 }).map((_, copy) => (
              <div key={copy} className="flex gap-8">
                {["comment → DM", "keyword triggers", "story reactions", "live inbox", "ice breakers", "follow gate", "quick replies", "media attachments", "public + private replies"].map((t, i) => (
                  <span key={t} className="flex items-center gap-8">
                    {t} <span style={{ color: ACCENT_ROTATION[i % ACCENT_ROTATION.length] }}>✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <section className="relative px-5 md:px-10 py-20 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-serif-display font-black text-4xl md:text-5xl">Everything the paid tools do.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Feature accent="brand" icon={<MessageCircle className="w-4 h-4" />} title="Comment → DM funnels"
              desc="Keyword or reply-all triggers on any post. Choose DM only, public reply only, or both — with your own rotating public replies." />
            <Feature accent="violet" icon={<Send className="w-4 h-4" />} title="DM keyword automation"
              desc="Auto-respond to DMs with text, media, or rich cards with buttons. Quick-reply chips guide people through your funnel." />
            <Feature accent="coral" icon={<AtSign className="w-4 h-4" />} title="Story triggers"
              desc="React to story mentions, emoji reactions, and story replies. Filter by emoji or keyword." />
            <Feature accent="violet" icon={<Inbox className="w-4 h-4" />} title="Live inbox"
              desc="Every conversation in one dashboard. Jump in manually anytime, fire quick responses from your saved automations." />
            <Feature accent="coral" icon={<Lock className="w-4 h-4" />} title="Follow gate"
              desc="Lock content behind a follow. Non-followers get a follow prompt; one tap later they unlock the goods." />
            <Feature accent="brand" icon={<Sparkles className="w-4 h-4" />} title="Human-like sending"
              desc="Optional typing indicators and randomized delays so replies land natural, not botty." />
            <Feature accent="violet" icon={<ShieldCheck className="w-4 h-4" />} title="Dedicated & private"
              desc="Your own private setup, encrypted end to end — never a shared tool where your data sits next to someone else's." />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-5 md:px-10 py-8 flex items-center justify-center">
        <span className="font-mono-ui text-[11px] text-neutral-600">
          Wingman - Instagram automation.
        </span>
      </footer>
    </div>
  )
}

const ACCENT_ROTATION = ["var(--accent-green)", "var(--accent-violet)", "var(--accent-coral)"]

const ACCENT_STYLES = {
  brand: { text: "text-brand", border: "group-hover:border-brand/40", bg: "bg-brand/10" },
  violet: { text: "text-violet", border: "group-hover:border-violet/40", bg: "bg-violet/10" },
  coral: { text: "text-coral", border: "group-hover:border-coral/40", bg: "bg-coral/10" },
} as const

function Feature({ icon, title, desc, accent }: { icon: React.ReactNode; title: string; desc: string; accent: keyof typeof ACCENT_STYLES }) {
  const styles = ACCENT_STYLES[accent]
  return (
    <div className="glow-card bg-[#0d0d0c] border border-white/[0.08] rounded-2xl p-7 group">
      <div className={`w-10 h-10 rounded-xl border border-white/10 ${styles.bg} flex items-center justify-center text-neutral-400 ${styles.text} ${styles.border} transition-colors mb-5`}>
        {icon}
      </div>
      <h3 className="font-mono-ui text-sm font-bold text-white mb-2">{title}</h3>
      <p className="text-[13px] text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  )
}
