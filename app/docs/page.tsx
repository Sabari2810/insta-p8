import Link from "next/link"

const SECTIONS = [
  { id: "getting-started", label: "Getting started" },
  { id: "automations", label: "Automations" },
  { id: "warm-ups", label: "Warm-ups" },
  { id: "inbox", label: "Inbox" },
  { id: "activity", label: "Activity" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
  { id: "data-privacy", label: "Data & privacy" },
  { id: "faq", label: "FAQ" },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#f6f5f3]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#f6f5f3]/90 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/favicon.jpeg" alt="" className="w-7 h-7 rounded-full" />
            <span className="font-mono-ui text-sm font-bold tracking-tight text-neutral-900">Wingman</span>
          </Link>
          <Link
            href="/"
            className="font-mono-ui text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            &larr; Back to Wingman
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-10 py-12 flex gap-12 items-start">
        {/* TOC */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-24 space-y-0.5">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-3">On this page</p>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block text-sm text-neutral-500 hover:text-brand transition-colors py-1"
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-2xl">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3">Documentation</p>
          <h1 className="font-serif-display text-4xl md:text-5xl text-neutral-900 leading-none mb-4">User guide</h1>
          <p className="text-neutral-500 text-lg leading-relaxed mb-16">
            Everything Wingman does and how to set it up: comment and DM automations, story triggers, warm-ups, the live inbox, and your account settings.
          </p>

          <Section id="getting-started" title="Getting started" kicker="01">
            <P>
              Wingman connects to a professional Instagram account (Business or Creator) through Instagram&apos;s own
              login. There&apos;s no password sharing and no browser extension involved. From the landing page, click{" "}
              <Strong>Connect Instagram</Strong> and approve the requested permissions on Instagram&apos;s screen.
              You&apos;ll land on your dashboard once that&apos;s done.
            </P>
            <P>
              Your account needs to be a Business or Creator account for the connection to work. Instagram&apos;s API
              doesn&apos;t expose messaging and comment automation to personal accounts. You can switch account types
              from the Instagram app under Settings &rarr; Account type.
            </P>
            <Callout>
              The dashboard home shows a snapshot of your automations, recent activity, and quick links to every
              section below.
            </Callout>
          </Section>

          <Section id="automations" title="Automations" kicker="02">
            <P>
              Automations are rules that watch for something happening on Instagram and reply automatically. Every
              rule belongs to one of three trigger types, organized into tabs on the Automations page:
            </P>
            <ul className="space-y-3 my-5">
              <ListItem title="Comments">
                Fires when someone comments on a post or reel. Target one specific post, or leave it global so it
                watches everything you publish. Optionally match a keyword, or leave it empty to reply to every comment.
              </ListItem>
              <ListItem title="DMs">
                Fires when someone sends you a direct message containing a keyword you choose.
              </ListItem>
              <ListItem title="Stories">
                Fires on a story mention, an emoji reaction, or a text reply to your story. Reactions can be
                restricted to specific emoji.
              </ListItem>
            </ul>
            <H3>Building a rule</H3>
            <P>
              Click <Strong>New Rule</Strong> and work through the three-step wizard:
            </P>
            <ol className="space-y-3 my-5 list-none">
              <NumberedItem n={1} title="Trigger">
                Choose what launches the rule: the post/keyword for comments, the keyword for DMs, or the
                interaction type and optional emoji for stories.
              </NumberedItem>
              <NumberedItem n={2} title="Reply">
                For comments, choose the flow: a public reply, a DM, or both, with rotating public-reply phrases so
                it doesn&apos;t look copy-pasted. Then compose the DM itself as plain text, a card with buttons, or an
                image/video/audio attachment. Quick-reply chips can guide the conversation further.
              </NumberedItem>
              <NumberedItem n={3} title="Settings">
                Name the rule (it suggests one from your keyword automatically), optionally require the sender to be
                a follower before they get the payload, add a typing indicator, and set a delay so the reply doesn&apos;t
                fire instantly.
              </NumberedItem>
            </ol>
            <P>
              Click <Strong>Go Live</Strong> to activate it. From the automations list you can search by name or
              keyword, edit, duplicate, pause, or delete any rule, and page through your list 10/20/30 at a time.
            </P>
          </Section>

          <Section id="warm-ups" title="Warm-ups" kicker="03">
            <P>
              Warm-ups are the quick-start questions people see the moment they open a chat with you on Instagram.
              Instagram calls this feature &ldquo;ice breakers&rdquo; on their end. Add up to four question-and-response
              pairs; tapping one sends that question and gets your set reply back automatically.
            </P>
            <P>
              Changes save and sync to your Instagram profile together. Click <Strong>Save &amp; Sync</Strong> after
              editing. It can take a few minutes for updates to appear for everyone.
            </P>
          </Section>

          <Section id="inbox" title="Inbox" kicker="04">
            <P>
              Every conversation, whether started by an automation or a real message, lands in the Inbox. Search by
              username, filter by the tags you&apos;ve added to a conversation, and jump in manually any time; automations
              keep running on the conversations you don&apos;t touch.
            </P>
          </Section>

          <Section id="activity" title="Activity" kicker="05">
            <P>
              A full, searchable history of every message your automations have sent: who it went to, what was
              sent, and when. Search by message content or recipient username, and page through results 10/20/30 at
              a time. The dashboard home shows the five most recent as a preview; Activity is the complete log.
            </P>
          </Section>

          <Section id="analytics" title="Analytics" kicker="06">
            <P>
              Track sent/received volume and new conversations over the last 7, 30, or 90 days, see which automations
              trigger most often, and check the split between comment, DM, and story rules.
            </P>
          </Section>

          <Section id="settings" title="Settings" kicker="07">
            <P>
              Settings shows your connected account, when it was connected, and how long until the access token
              needs to refresh (this happens automatically). You&apos;ll also find:
            </P>
            <ul className="space-y-3 my-5">
              <ListItem title="Webhook configuration">
                The callback URL to paste into your Meta app&apos;s Instagram webhook subscription, and whether a verify
                token is configured.
              </ListItem>
              <ListItem title="Reconnect">
                Re-runs the Instagram login if your token has expired or permissions changed.
              </ListItem>
              <ListItem title="Disconnect">
                Stops every automation and immediately clears your stored access token. You&apos;ll need to reconnect via
                Instagram login to use Wingman again.
              </ListItem>
            </ul>
          </Section>

          <Section id="data-privacy" title="Data & privacy" kicker="08">
            <P>
              This is a dedicated, single-tenant setup, never a shared tool where your data sits next to someone
              else&apos;s. Your Instagram access token is encrypted before it&apos;s stored and only decrypted in memory when
              a reply actually needs to be sent. Disconnecting from Settings clears the stored token immediately.
            </P>
            <P>
              See the full <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link> for
              details on what data is collected and how it&apos;s used.
            </P>
          </Section>

          <Section id="faq" title="FAQ" kicker="09" last>
            <FaqItem q="Why does my automation need a delay?">
              Instant replies read as bot activity. A short randomized delay (and an optional typing indicator) makes
              responses feel like a person is behind them.
            </FaqItem>
            <FaqItem q="Can I run more than one automation on the same keyword?">
              Yes. Wingman doesn&apos;t block duplicate keywords, though for clarity it&apos;s usually better to keep one
              rule per keyword per trigger type.
            </FaqItem>
            <FaqItem q="What happens if I disconnect my account?">
              Every automation stops immediately and your stored access token is cleared. Reconnecting via Instagram
              login picks up where your saved rules left off. They aren&apos;t deleted, just inactive until a token is
              connected again.
            </FaqItem>
            <FaqItem q="Does the follow-gate block non-followers entirely?">
              No, they get a prompt to follow first. Once they do, the same trigger unlocks the payload for them.
            </FaqItem>
          </Section>
        </main>
      </div>
    </div>
  )
}

function Section({
  id, title, kicker, children, last,
}: {
  id: string
  title: string
  kicker: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${last ? "" : "mb-16 pb-16 border-b border-black/10"}`}>
      <div className="flex items-baseline gap-3 mb-5">
        <span className="font-mono-ui text-xs text-brand font-bold">{kicker}</span>
        <h2 className="font-serif-display text-2xl md:text-3xl text-neutral-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-serif-display text-lg text-neutral-900 mt-8 mb-3">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-600 leading-relaxed mb-4">{children}</p>
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-neutral-900 font-semibold">{children}</strong>
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-5 text-sm text-neutral-700 leading-relaxed">
      {children}
    </div>
  )
}

function ListItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-black/10 bg-white p-4">
      <p className="text-sm font-semibold text-neutral-900 mb-1">{title}</p>
      <p className="text-sm text-neutral-500 leading-relaxed">{children}</p>
    </li>
  )
}

function NumberedItem({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 w-7 h-7 rounded-lg bg-neutral-900 text-white text-xs font-bold flex items-center justify-center font-mono-ui">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900 mb-1">{title}</p>
        <p className="text-sm text-neutral-500 leading-relaxed">{children}</p>
      </div>
    </li>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <p className="text-sm font-semibold text-neutral-900 mb-1.5">{q}</p>
      <p className="text-sm text-neutral-500 leading-relaxed">{children}</p>
    </div>
  )
}
