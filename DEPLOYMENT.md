# Deployment

Wingman runs out of the box on Vercel + Supabase — that's still the default and the only thing
that's actually been tested end-to-end. This doc covers the alternative: running the database
layer on any plain Postgres host instead of Supabase.

## How the backend is picked

[`lib/supabase-server.ts`](lib/supabase-server.ts) checks env vars in this order, every time it
hands a database client to an API route:

1. **Demo mode** — no `NEXT_PUBLIC_SUPABASE_URL` and no `DATABASE_URL`, and not production. In-memory
   mock data, resets on restart. This is what `npm run dev` uses with no `.env.local` at all.
2. **Supabase** — `NEXT_PUBLIC_SUPABASE_URL` is set. Existing behavior, completely unchanged.
   Takes priority even if `DATABASE_URL` also happens to be set.
3. **Plain Postgres** — `NEXT_PUBLIC_SUPABASE_URL` is unset and `DATABASE_URL` is set. Runs
   against [`lib/postgres-client.ts`](lib/postgres-client.ts), a small query builder that exposes
   the identical `.from(table).select().eq()...` interface, so no route code changes.

Because Supabase always wins when its URL is present, adding `DATABASE_URL` support can't affect
an existing Supabase deployment — you'd have to remove `NEXT_PUBLIC_SUPABASE_URL` first.

## Running on plain Postgres

1. Pick a host. Any Postgres 13+ works — Neon and Railway both have usable free tiers with a
   connection string handed to you directly; a self-hosted box works too.
2. Run [`schema.sql`](schema.sql) against it once, to create the 11 tables:
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```
   Skip `schema-supabase-storage.sql` — it sets up a Supabase Storage bucket and will error on
   any other host (the `storage` schema it references doesn't exist outside Supabase). Nothing in
   the app currently calls Supabase Storage anyway, so there's no feature loss.
3. Set env vars: `DATABASE_URL` to your connection string, and leave every `NEXT_PUBLIC_SUPABASE_*`
   / `SUPABASE_SERVICE_ROLE_KEY` var unset. Everything else in `.env.example`
   (`SESSION_SECRET`, `ENCRYPTION_KEY`, the Instagram app credentials) is unrelated to which
   database backend is active and works the same either way — none of that is Supabase-specific,
   since auth here is a custom signed cookie, not Supabase Auth.
4. Deploy the Next.js app anywhere that runs Node (Vercel works the same as always; so does
   Railway, Render, Fly, or a plain VPS behind `next start`).

## One gotcha: connect as the table owner

`schema.sql` turns on Postgres row-level security on every table with zero policies attached, as
defense-in-depth against a stray client-side query. On Supabase this is a non-issue — the
service-role key always bypasses RLS. On plain Postgres, RLS is bypassed by the table's *owner*
role, not by any special key. As long as `DATABASE_URL` connects as the same role that ran
`schema.sql` (true by default on Neon/Railway — the connection string they hand you owns
whatever it creates), this is automatic and invisible. If you instead create the schema as one
role and connect the app as a different, non-owner role, every query will silently return zero
rows — no error, just an empty app. If that happens, it's this.

## What this does and doesn't cover

This only changes the database layer, on purpose. Still Vercel/Supabase-specific, unchanged, and
out of scope for now:
- **Cron**: `vercel.json` schedules the daily token-refresh job via Vercel Cron. On another host
  you'd need an equivalent scheduled trigger for `GET /api/cron/refresh-tokens` (any external
  cron service that can hit a URL on a schedule works — the route itself already just checks a
  bearer token via `CRON_SECRET`, it has no Vercel-specific code in it).
- **Hosting**: Next.js itself isn't tied to Vercel (it's a standard Next app), just not verified
  elsewhere yet.
