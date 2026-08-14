"use client"

import { useRouter } from "next/navigation"
import {
  MessageCircle, Sparkles, ArrowUpRight,
  Send, AtSign, Inbox, Lock, Terminal, ShieldCheck
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
    <div className="min-h-screen bg-white text-[#171717] selection:bg-brand selection:text-black overflow-x-hidden antialiased">
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 30s linear infinite; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up .7s cubic-bezier(.2,.7,.2,1) both; }
      `}</style>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-5 md:px-10 h-16 border-b border-black/[0.08]">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.jpeg" alt="" className="w-7 h-7 rounded-full" />
          <span className="font-mono-ui text-sm font-bold tracking-tight">Wingman</span>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={handleTestLogin}
              className="font-mono-ui text-xs font-bold text-brand-dark border border-brand/50 rounded-full px-4 py-1.5 hover:bg-brand/10 transition-colors"
            >
              Dev Login
            </button>
          )}
          <button
            onClick={handleLogin}
            className="font-mono-ui text-xs font-bold bg-[#171717] text-white rounded-full px-4 py-1.5 hover:bg-brand hover:text-black transition-colors"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="px-5 md:px-10 pt-16 md:pt-28 pb-16 max-w-6xl mx-auto">
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.25em] text-neutral-500 mb-6">
              Instagram automation // your own private setup // built for creators & brands
            </p>
          </div>

          <h1 className="fade-up font-serif-display text-[15vw] md:text-[7.5rem] leading-[0.95] tracking-tight" style={{ animationDelay: "80ms" }}>
            Your DMs,
            <br />
            <span className="italic text-brand-dark">on autopilot.</span>
          </h1>

          <div className="fade-up mt-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-16" style={{ animationDelay: "160ms" }}>
            <p className="text-neutral-500 text-base md:text-lg max-w-md leading-relaxed">
              Comment-to-DM funnels, keyword triggers, story reactions, and a live inbox —
              automation that converts, running on your own dedicated setup, never shared with anyone else's data.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLogin}
                className="group flex items-center gap-2 bg-brand text-black font-mono-ui text-sm font-bold px-7 py-4 rounded-full hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                Connect Instagram
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={handleTestLogin}
                  className="group flex items-center gap-2 font-mono-ui text-sm font-bold text-brand-dark border border-brand/50 px-7 py-4 rounded-full hover:bg-brand/10 active:scale-[0.98] transition-all"
                >
                  <Terminal className="w-4 h-4" />
                  Dev Login
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="border-y border-black/[0.08] py-3 overflow-hidden">
          <div className="marquee-track flex whitespace-nowrap font-mono-ui text-xs uppercase tracking-[0.2em] text-neutral-500 gap-8 w-max">
            {Array.from({ length: 2 }).map((_, copy) => (
              <div key={copy} className="flex gap-8">
                {["comment → DM", "keyword triggers", "story reactions", "live inbox", "ice breakers", "follow gate", "quick replies", "media attachments", "public + private replies"].map((t) => (
                  <span key={t} className="flex items-center gap-8">
                    {t} <span className="text-brand-dark">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <section className="px-5 md:px-10 py-20 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-serif-display text-4xl md:text-5xl">Everything the paid tools do.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-black/[0.08] border border-black/[0.08]">
            <Feature icon={<MessageCircle className="w-4 h-4" />} title="Comment → DM funnels"
              desc="Keyword or reply-all triggers on any post. Choose DM only, public reply only, or both — with your own rotating public replies." />
            <Feature icon={<Send className="w-4 h-4" />} title="DM keyword automation"
              desc="Auto-respond to DMs with text, media, or rich cards with buttons. Quick-reply chips guide people through your funnel." />
            <Feature icon={<AtSign className="w-4 h-4" />} title="Story triggers"
              desc="React to story mentions, emoji reactions, and story replies. Filter by emoji or keyword." />
            <Feature icon={<Inbox className="w-4 h-4" />} title="Live inbox"
              desc="Every conversation in one dashboard. Jump in manually anytime, fire quick responses from your saved automations." />
            <Feature icon={<Lock className="w-4 h-4" />} title="Follow gate"
              desc="Lock content behind a follow. Non-followers get a follow prompt; one tap later they unlock the goods." />
            <Feature icon={<Sparkles className="w-4 h-4" />} title="Human-like sending"
              desc="Optional typing indicators and randomized delays so replies land natural, not botty." />
            <Feature icon={<ShieldCheck className="w-4 h-4" />} title="Dedicated & private"
              desc="Your own private setup, encrypted end to end — never a shared tool where your data sits next to someone else's." />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.08] px-5 md:px-10 py-8 flex items-center justify-center">
        <span className="font-mono-ui text-[11px] text-neutral-500">
          Wingman - Instagram automation.
        </span>
      </footer>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white p-7 group hover:bg-neutral-50 transition-colors">
      <div className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center text-neutral-500 group-hover:text-neutral-900 group-hover:border-black/30 transition-colors mb-5">
        {icon}
      </div>
      <h3 className="font-mono-ui text-sm font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-[13px] text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  )
}
