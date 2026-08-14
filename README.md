# Sovex

Instagram DM/comment/story automation — internal reference for setup, architecture, and per-client deployment. This is not a public-facing README; it's documentation for working in this repo.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Supabase (Postgres + Storage) · Instagram Graph API (`graph.instagram.com`, "Instagram API with Instagram Login") · Tailwind v4 · Recharts

## Delivery model

One codebase (this repo), maintained centrally. Each client runs their own independent stack on top of it: their own Supabase project, their own Vercel project, their own Meta app. Nothing is shared between clients today — deliberately single-tenant per deployment while the product is being built out. Multi-tenancy (one shared app serving many clients) is a planned later phase; see the note at the bottom.

Because each client's Meta app stays in Development mode, only Instagram accounts added as **testers** in that specific app can complete OAuth login. Onboarding a new client always starts with adding their Instagram account as a tester — nothing else works until that's done.

## New client setup — step by step

### 1. Supabase project

- Create a new project at [supabase.com](https://supabase.com).
- Open the SQL editor, paste in [`schema.sql`](schema.sql), run it. It's written idempotently (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`) — safe to re-run in full any time the schema changes, including against a project that already has data.
- From Project Settings → API, copy the project URL, the `anon` public key, and the `service_role` key. You'll need all three.

### 2. Meta app + Instagram product

- Go to [developers.facebook.com/apps](https://developers.facebook.com/apps/) → Create App.
- Add the **Instagram** product → "API setup with Instagram business login" (not Instagram Basic Display, not Facebook Login — those are different products with different token formats).
- Under Instagram → Roles → Roles, add the client's Instagram account as a **tester**. They'll need to accept the invite from their Instagram app before login will work.
- Note the *Instagram app ID and secret* shown on that Instagram product page specifically — not the parent Meta app's ID/secret from Settings → Basic. These are different values and mixing them up is the most common setup mistake.
- Under Instagram → Business login settings, add the OAuth redirect URI (see step 3 for the exact value).
- Scopes used by the app: `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`.

### 3. Environment variables

Set these in the Vercel project (Project Settings → Environment Variables) and, for local testing, in `.env.local`. Full descriptions also live in `.env.example`.

```env
# Supabase (from step 1)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App secrets — generate each with: openssl rand -hex 32
SESSION_SECRET=
ENCRYPTION_KEY=
CRON_SECRET=

# Instagram / Meta app (from step 2)
NEXT_PUBLIC_INSTAGRAM_APP_ID=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://<client-domain>/api/instagram/callback
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=
```

See [Environment variables](#environment-variables) below for what each one does — several of these (`SESSION_SECRET`, `ENCRYPTION_KEY`) are required in production; the app will refuse to start critical flows without them rather than falling back to something insecure.

### 4. Deploy to Vercel

- Create a new Vercel project from this repo (or redeploy the existing one to a new project — either way, one Vercel project per client).
- Add all env vars from step 3.
- `vercel.json` wires up the daily token-refresh cron automatically on deploy — no extra setup needed beyond `CRON_SECRET` being set.
- Deploy.

### 5. Webhook subscription

- In the Meta app's Instagram → Webhooks settings, subscribe to `messages` and `comments` (and any other fields you need).
- Callback URL: `https://<client-domain>/api/instagram/webhook`
- Verify token: same value as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.
- Once connected, the deployed app's own **Settings** page shows this exact callback URL (with a copy button) and a live status dot for whether the verify token is actually configured — check there first if the subscription fails.

### 6. Connect the account

- Client visits the deployed app and clicks "Connect Instagram" — standard OAuth flow, redirects to Instagram, comes back logged in.
- First login creates their `users` row and starts the 60-day token clock (auto-refreshed well before expiry — see Architecture below).

### 7. Pre-launch checklist

- [ ] Log in with the client's Instagram Business/Creator account
- [ ] Create a DM keyword automation, send a test DM from a different Instagram account, confirm the reply
- [ ] Create a comment automation on a real post, comment the trigger word, confirm both the public reply and the private DM
- [ ] Add ice breakers, confirm they show up in the actual Instagram DM composer (they sync to the Messenger profile on save)
- [ ] Open the live inbox, confirm the test conversation shows up, try a manual reply and a tag
- [ ] Check Settings — connection status should read "Active," webhook verify token should show as configured

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project connection. The app only ever queries the DB server-side with the service-role key — the anon key is unused by app code today. |
| `SESSION_SECRET` | Signs the session cookie (`lib/session.ts`). Required in production — the app refuses to sign anyone in without it rather than falling back to a weak default. |
| `ENCRYPTION_KEY` | Encrypts Instagram access tokens at rest (`lib/crypto.ts`, AES-256-GCM). Also required in production. Rotating this key makes previously-stored tokens unreadable — connected accounts would need to reconnect. |
| `CRON_SECRET` | Protects `/api/cron/refresh-tokens`. Vercel sends this automatically as a Bearer token when it triggers the scheduled job. |
| `NEXT_PUBLIC_INSTAGRAM_APP_ID`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | The Instagram product's app ID/secret (not the parent Meta app's). |
| `META_APP_SECRET` | Optional fallback — only needed if webhook signature validation 401s because Meta signed the delivery with the parent app secret instead. |
| `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI` | Must exactly match an OAuth redirect URI configured in the Instagram product's business login settings — character-for-character, including scheme and trailing slash. |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Any random string, entered identically in both the env var and Meta's webhook subscription form. |

## Architecture

- **`app/api/instagram/webhook/route.ts`** — the core event handler. Verifies Meta's HMAC signature, resolves the incoming webhook ID to a user row (direct match → fallback ID match → self-healing token-verify loop), matches comment/DM/story events against that user's automations, and sends the configured response. Also increments each automation's `trigger_count` for analytics.
- **`lib/session.ts`** — HMAC-signed, httpOnly session cookie. Every data-fetching API route requires a valid session and scopes queries/mutations to `session.userId` — never trusts a client-supplied user ID.
- **`lib/crypto.ts`** — AES-256-GCM encryption for access tokens stored in the `users` table. Backward-compatible with legacy plaintext (detects the encryption prefix; passes through unchanged if absent).
- **`lib/instagram-api.ts`** — thin wrapper around Instagram Graph API calls (send DM, reply to comment, refresh token, etc.), all taking an access token as a parameter rather than touching the DB directly.
- **`app/api/cron/refresh-tokens/route.ts`** — daily Vercel Cron job (`vercel.json`) that proactively refreshes any token expiring within 10 days, so a client's automations shouldn't ever silently die from an expired token. `components/dashboard/ConnectionBanner.tsx` is the UI fallback for when that doesn't catch it in time.
- **`schema.sql`** — full schema, written idempotently so it can be re-run against a live project after changes. A few tables (`content_pool`, `reels_posts`, `scheduler_config`, `dm_queue`, `webhook_events`) are defined but currently unused — leftover from a removed content-scheduling feature. Safe to ignore; not wired to any code path.

## Features

- Comment-to-DM funnels — keyword or reply-all triggers, optionally scoped to a specific post
- DM keyword automation — text, media, or button-card responses, with quick replies
- Story triggers — mention, reaction, or reply, optionally scoped to a specific story
- Follow gate — locks a response behind following the account first
- Ice breakers (Instagram's native DM entry-point questions)
- Live inbox — manual reply, automation quick-fire, and contact tagging/segmentation (filter conversations by tag)
- Human-like sending — randomized 3–10s delay, typing indicator, read receipts
- Analytics — messages sent/received trend, audience growth, top automations by trigger count, active automations by channel
- Settings — connected account status, webhook config/debug info, disconnect
- Automatic token refresh + expiry warning banner

## What's deliberately not built

- **Bulk/broadcast messaging.** Instagram's 24-hour messaging window policy restricts free-form messages to contacts who've messaged you recently; a naive "message everyone" feature risks the client's account getting flagged. Tags/segmentation exist as the groundwork for doing this safely later (message only contacts tagged X who are still in-window) — not built yet.
- **AI auto-reply.** Was present in an earlier version, backend was stripped, frontend was left dangling (calling a 404 route) until it was removed. Could be rebuilt for real (LLM provider + API key + per-message cost) if wanted.

## Local development

```bash
npm install
npm run dev
```

Three lockfiles exist in the repo (`package-lock.json`, `bun.lock`, `pnpm-lock.yaml`) — use `npm`; the others are stale and should eventually be removed.

In development, a "Dev Login" button on the landing page bypasses Instagram OAuth entirely (`app/api/instagram/test-login`) — gated behind `NODE_ENV !== "production"`, unavailable in any real deployment.

## Things that bite

- Webhooks must be reachable from the public internet — Meta can't call `localhost`. Test webhook flows against a real deployment, not local dev.
- The client's account must be an Instagram **Business or Creator** account, not personal — Business Login won't work otherwise.
- Respect Instagram's platform terms and anti-spam policies. Automated replies must be triggered by a genuine user action (comment, DM, story interaction) — no scraping, no unsolicited mass messaging.

## Roadmap note

Single-tenant per client is the current, deliberate phase. Multi-tenant (one shared app, many clients, self-serve onboarding) is planned for later — the main prerequisite is getting a Meta app through App Review to go Live, which removes the tester-gated onboarding bottleneck described above. Doing multi-tenant work before that review is done would still leave onboarding manual per client either way.
