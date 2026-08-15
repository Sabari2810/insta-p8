"use client"

import { useRouter } from "next/navigation"
import { FiTerminal as Terminal } from "react-icons/fi"

const ACCENT = "#5b46f2"
const ACCENT_HOVER = "#4735d2"
const INK = "#191817"
const MUTED = "#5f5a54"
const FAINT = "#8b847c"
const BORDER = "#e6e2dd"
const BG = "#f6f5f3"

const STEPS = [
  { n: "1", title: "Connect your account", body: "Sign in with your professional Instagram account. No password sharing, no browser extension." },
  { n: "2", title: "Pick the trigger", body: "Choose a reel or post and the keywords to watch for, or listen on every new DM and story interaction." },
  { n: "3", title: "Write the reply", body: "One public reply, one DM with a link button, and a delay so it reads like you typed it." },
]

const FEATURES = [
  { title: "Comment → DM funnels", body: "Keyword or reply-all triggers on any post.", points: ["DM only, public reply only, or both", "Your own public reply copy", "First-time commenters only"] },
  { title: "DM keyword automation", body: "Auto-respond with text, media, or rich cards with buttons.", points: ["Keyword routing", "Link buttons in the reply", "Quick-reply chips guide the funnel"] },
  { title: "Story triggers", body: "React to mentions, emoji reactions and story replies.", points: ["Filter by emoji or keyword", "Reply inside the DM thread", "Tag contacts for follow-up"] },
  { title: "Live inbox", body: "Every conversation in one dashboard.", points: ["Jump in manually anytime", "Fire saved quick responses", "Conversation tags"] },
  { title: "Follow gate", body: "Lock content behind a follow.", points: ["Non-followers get a prompt", "One tap later they unlock it", "Works on any automation"] },
  { title: "Human-like sending", body: "Replies land natural, not botty.", points: ["Optional typing indicators", "Randomized delays", "Per-account rate limits"] },
]

const FACTS = [
  { k: "Dedicated setup", v: "Never a shared multi-tenant tool" },
  { k: "Encrypted token", v: "Decrypted in memory only when sending" },
  { k: "Disconnect anytime", v: "Clears the stored token immediately" },
  { k: "No data selling", v: "Your tags stay with your account" },
]

const LISTENING_KEYWORDS = ["price", "link", "preset", "info", "@mention", "🔥 reaction", "story reply", "dm", "guide", "book"]
const LISTENING_MARQUEE = [...LISTENING_KEYWORDS, ...LISTENING_KEYWORDS]

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
    <div style={{ background: BG, color: INK, fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <style>{`
        .landing h1, .landing h2, .landing h3 { font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-weight: 600; letter-spacing: -0.03em; }
        .landing button { font-family: 'Instrument Sans', system-ui, sans-serif; }
        @keyframes wm-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes wm-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.8); } }
      `}</style>
      <div className="landing">

        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(246,245,243,0.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/favicon.jpeg" alt="" style={{ width: 28, height: 28, borderRadius: "50%", display: "block" }} />
              <span style={{ display: "block", fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 600, fontSize: 19, letterSpacing: "-0.02em" }}>Wingman</span>
            </div>
            <nav style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <a href="#how" className="hidden md:inline transition-colors hover:text-[#191817]" style={{ fontSize: 14, color: FAINT }}>How it works</a>
              <a href="#features" className="hidden md:inline transition-colors hover:text-[#191817]" style={{ fontSize: 14, color: FAINT }}>Features</a>
              <a href="#ownership" className="hidden md:inline transition-colors hover:text-[#191817]" style={{ fontSize: 14, color: FAINT }}>Your data</a>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={handleTestLogin}
                  className="inline-flex items-center gap-1.5 transition-colors hover:bg-[#5b46f2]/10"
                  style={{ fontSize: 13, fontWeight: 600, color: ACCENT, border: `1px solid ${ACCENT}80`, borderRadius: 10, padding: "7px 12px" }}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Dev Login
                </button>
              )}
              <button
                onClick={handleLogin}
                className="transition-colors hover:bg-[#4735d2]"
                style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#ffffff", background: ACCENT, borderRadius: 10 }}
              >
                Connect Instagram
              </button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 32px 72px", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "center" }}>
          <div style={{ flex: "1 1 460px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, flex: "none", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: FAINT }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0b8f6a", display: "block", animation: "wm-pulse 1.8s ease-in-out infinite" }} />
                <span style={{ display: "block" }}>Listening</span>
              </span>
              <span
                style={{
                  display: "block", flex: 1, minWidth: 0, overflow: "hidden",
                  maskImage: "linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 48px), transparent)",
                  WebkitMaskImage: "linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 48px), transparent)",
                }}
              >
                <span style={{ display: "flex", gap: 8, width: "max-content", animation: "wm-marquee 26s linear infinite" }}>
                  {LISTENING_MARQUEE.map((kw, i) => (
                    <span key={i} style={{ display: "block", flex: "none", background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: 999, padding: "4px 11px", fontSize: 12, color: MUTED }}>{kw}</span>
                  ))}
                </span>
              </span>
            </div>
            <h1 style={{ margin: "22px 0 0", fontSize: "clamp(40px, 5.2vw, 60px)", lineHeight: 1.02 }}>Rules that reply for you.</h1>
            <p style={{ margin: "20px 0 0", maxWidth: 520, fontSize: 17, lineHeight: 1.6, color: MUTED, textWrap: "pretty" as any }}>
              Choose a reel or post, set the keywords to watch for, and write the reply once. Wingman handles comments, DMs and story interactions on your own dedicated setup — with delays and typing indicators so replies read like you sent them.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              <button
                onClick={handleLogin}
                className="transition-colors hover:bg-[#4735d2]"
                style={{ padding: "13px 22px", fontSize: 15, fontWeight: 600, color: "#ffffff", background: ACCENT, borderRadius: 11, boxShadow: "0 1px 2px rgba(24,20,50,0.16)" }}
              >
                Connect Instagram
              </button>
              <a
                href="#how"
                className="transition-colors hover:bg-[#f1efec]"
                style={{ padding: "13px 22px", fontSize: 15, fontWeight: 600, color: INK, background: "#ffffff", border: "1px solid #e2ded9", borderRadius: 11 }}
              >
                See how it works
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginTop: 36, fontSize: 13, color: FAINT }}>
              <span style={{ display: "block" }}>Comment → DM</span>
              <span style={{ display: "block" }}>Keyword triggers</span>
              <span style={{ display: "block" }}>Live inbox</span>
              <span style={{ display: "block" }}>Follow gate</span>
            </div>
          </div>

          <div style={{ flex: "0 1 300px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 270, background: "#0f0f10", borderRadius: 34, padding: 10, boxShadow: "0 20px 44px rgba(24,20,50,0.2)" }}>
              <div style={{ background: "#141416", borderRadius: 26, overflow: "hidden", display: "flex", flexDirection: "column", height: 432 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 6px", fontSize: 10, color: "#8e8b88" }}>
                  <span style={{ display: "block" }}>9:41</span>
                  <span style={{ display: "block" }}>▮▮▮</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px 12px", borderBottom: "1px solid #26262a" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#2c2c31", display: "block" }} />
                  <span style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#f4f3f1" }}>priya.makes</span>
                    <span style={{ display: "block", fontSize: 10, color: "#6f6c69" }}>Commented on your reel</span>
                  </span>
                </div>
                <div style={{ flex: 1, minHeight: 0, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ alignSelf: "flex-start", maxWidth: "78%", background: "#26262a", color: "#f4f3f1", borderRadius: "16px 16px 16px 4px", padding: "9px 12px", fontSize: 12 }}>PRESET please 🙏</div>
                  <div style={{ alignSelf: "flex-end", maxWidth: "78%", background: "#2c2c31", color: "#f4f3f1", borderRadius: 16, padding: "9px 12px", fontSize: 12 }}>↩ Sent! Check your DMs 📩</div>
                  <div style={{ alignSelf: "flex-end", maxWidth: "78%", background: ACCENT, color: "#ffffff", borderRadius: "16px 16px 4px 16px", padding: "9px 12px", fontSize: 12 }}>Here's the preset pack I promised — tap below to grab it.</div>
                  <div style={{ alignSelf: "flex-end", width: "78%", textAlign: "center", border: "1px solid #3a3a40", borderRadius: 12, padding: "9px 12px", fontSize: 12, color: "#f4f3f1" }}>Download the presets</div>
                  <div style={{ alignSelf: "flex-end", fontSize: 10, color: "#6f6c69" }}>sent after 1 min</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" style={{ borderTop: `1px solid ${BORDER}`, background: "#ffffff" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 32px" }}>
            <h6 style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: FAINT }}>How it works</h6>
            <h2 style={{ margin: "0 0 40px", fontSize: 36, maxWidth: 520 }}>Three steps, then it runs without you.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
              {STEPS.map((s) => (
                <div key={s.n} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, background: INK, color: "#ffffff", fontSize: 12, fontWeight: 600 }}>{s.n}</div>
                  <h3 style={{ margin: "16px 0 6px", fontSize: 19 }}>{s.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: MUTED, textWrap: "pretty" as any }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 32px" }}>
            <h6 style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: FAINT }}>Features</h6>
            <h2 style={{ margin: "0 0 40px", fontSize: 36, maxWidth: 600 }}>Everything the paid tools do.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
              {FEATURES.map((t) => (
                <div key={t.title} style={{ background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>{t.title}</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6, color: MUTED, textWrap: "pretty" as any }}>{t.body}</p>
                  {t.points.map((p) => (
                    <div key={p} style={{ display: "flex", gap: 9, padding: "6px 0", fontSize: 13, color: INK }}>
                      <span style={{ display: "block", color: ACCENT }}>—</span>
                      <span style={{ display: "block" }}>{p}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ownership */}
        <section id="ownership" style={{ borderTop: `1px solid ${BORDER}`, background: "#ffffff" }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 32px", gap: 56, alignItems: "center" }}>
            <div>
              <h6 style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: FAINT }}>Your data</h6>
              <h2 style={{ margin: "0 0 16px", fontSize: 36 }}>Dedicated and private.</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: MUTED, maxWidth: 460, textWrap: "pretty" as any }}>
                Your own private setup, never a shared tool where your data sits next to someone else's. Your Instagram access token is encrypted before it is stored and only decrypted in memory when a reply needs to be sent. Disconnect from Settings at any time and the stored token is cleared immediately.
              </p>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 16 }}>
              {FACTS.map((f) => (
                <div key={f.k} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 15, fontWeight: 600 }}>{f.k}</div>
                  <div style={{ fontSize: 13, color: FAINT, marginTop: 4, lineHeight: 1.5 }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ borderTop: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
            <h2 style={{ margin: 0, fontSize: 40, maxWidth: 600 }}>Set up your first automation today.</h2>
            <p style={{ margin: 0, maxWidth: 440, fontSize: 16, color: MUTED }}>Connect your professional Instagram account and write your first reply in a couple of minutes.</p>
            <button
              onClick={handleLogin}
              className="transition-colors hover:bg-[#4735d2]"
              style={{ marginTop: 6, padding: "14px 26px", fontSize: 15, fontWeight: 600, color: "#ffffff", background: ACCENT, borderRadius: 11 }}
            >
              Connect Instagram
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${BORDER}`, background: "#ffffff" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "26px 32px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 13, color: FAINT }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/favicon.jpeg" alt="" style={{ width: 20, height: 20, borderRadius: "50%", display: "block" }} />
              <span style={{ display: "block" }}>Wingman — Instagram automation</span>
            </span>
            <div style={{ display: "flex", gap: 22 }}>
              <a href="/privacy" className="transition-colors hover:text-[#191817]" style={{ color: FAINT }}>Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
