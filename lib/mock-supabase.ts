import crypto from "crypto"
import { DEMO_USER_ID, DEMO_USERNAME } from "@/lib/demo-mode"

// A tiny in-memory stand-in for the handful of Supabase query-builder methods this app
// actually uses, seeded with plausible data so the dashboard looks populated in demo mode.
// Lives for the lifetime of the dev server process — resets on restart.

type Row = Record<string, any>

function isoDaysAgo(days: number, hours = 0) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000).toISOString()
}

const conversations: Row[] = [
  { id: "conv-1", user_id: DEMO_USER_ID, recipient_username: "aria.codes", last_message_at: isoDaysAgo(0, 1), tags: ["customer"], created_at: isoDaysAgo(6) },
  { id: "conv-2", user_id: DEMO_USER_ID, recipient_username: "marcus.builds", last_message_at: isoDaysAgo(0, 5), tags: ["lead"], created_at: isoDaysAgo(4) },
  { id: "conv-3", user_id: DEMO_USER_ID, recipient_username: "priya.designs", last_message_at: isoDaysAgo(1), tags: [], created_at: isoDaysAgo(9) },
  { id: "conv-4", user_id: DEMO_USER_ID, recipient_username: "leo_makes", last_message_at: isoDaysAgo(2), tags: ["vip", "customer"], created_at: isoDaysAgo(13) },
]

const messages: Row[] = [
  { id: "msg-1", user_id: DEMO_USER_ID, conversation_id: "conv-1", content: "Hey! Saw your reel, is the guide still available?", created_at: isoDaysAgo(0, 2), is_from_instagram: true, source: "customer", attachment_type: null },
  { id: "msg-2", user_id: DEMO_USER_ID, conversation_id: "conv-1", content: "Yep! Here's your link 🎉", created_at: isoDaysAgo(0, 1), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-3", user_id: DEMO_USER_ID, conversation_id: "conv-2", content: "Do you offer bulk pricing?", created_at: isoDaysAgo(0, 6), is_from_instagram: true, source: "customer", attachment_type: null },
  { id: "msg-4", user_id: DEMO_USER_ID, conversation_id: "conv-2", content: "Sent over our rate card", created_at: isoDaysAgo(0, 5), is_from_instagram: false, source: "manual", attachment_type: null },
  { id: "msg-5", user_id: DEMO_USER_ID, conversation_id: "conv-3", content: "[image]", created_at: isoDaysAgo(1, 1), is_from_instagram: true, source: "customer", attachment_type: "image" },
  { id: "msg-6", user_id: DEMO_USER_ID, conversation_id: "conv-3", content: "Love this, thanks for sharing!", created_at: isoDaysAgo(1), is_from_instagram: false, source: "echo", attachment_type: null },
  { id: "msg-7", user_id: DEMO_USER_ID, conversation_id: "conv-4", content: "Just dropped the code — enjoy!", created_at: isoDaysAgo(2), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-8", user_id: DEMO_USER_ID, conversation_id: "conv-1", content: "Thank you so much!!", created_at: isoDaysAgo(3), is_from_instagram: true, source: "customer", attachment_type: null },
  { id: "msg-9", user_id: DEMO_USER_ID, conversation_id: "conv-2", content: "Following up on our chat", created_at: isoDaysAgo(5), is_from_instagram: false, source: "manual", attachment_type: null },
  { id: "msg-10", user_id: DEMO_USER_ID, conversation_id: "conv-4", content: "[ig_reel]", created_at: isoDaysAgo(8), is_from_instagram: true, source: "customer", attachment_type: "ig_reel" },
  { id: "msg-11", user_id: DEMO_USER_ID, conversation_id: "conv-3", content: "Here's the discount code!", created_at: isoDaysAgo(0, 9), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-12", user_id: DEMO_USER_ID, conversation_id: "conv-4", content: "Glad you liked it! Check the link in bio.", created_at: isoDaysAgo(0, 14), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-13", user_id: DEMO_USER_ID, conversation_id: "conv-2", content: "Rate card attached", created_at: isoDaysAgo(0, 20), is_from_instagram: false, source: "manual", attachment_type: null },
  { id: "msg-14", user_id: DEMO_USER_ID, conversation_id: "conv-1", content: "[image]", created_at: isoDaysAgo(1, 3), is_from_instagram: false, source: "echo", attachment_type: "image" },
  { id: "msg-15", user_id: DEMO_USER_ID, conversation_id: "conv-3", content: "Thanks for the follow!", created_at: isoDaysAgo(1, 8), is_from_instagram: false, source: "manual", attachment_type: null },
  { id: "msg-16", user_id: DEMO_USER_ID, conversation_id: "conv-4", content: "Here's your free guide! 🎉", created_at: isoDaysAgo(1, 16), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-17", user_id: DEMO_USER_ID, conversation_id: "conv-2", content: "Following up — still interested?", created_at: isoDaysAgo(2, 4), is_from_instagram: false, source: "manual", attachment_type: null },
  { id: "msg-18", user_id: DEMO_USER_ID, conversation_id: "conv-1", content: "Use code WELCOME10 at checkout!", created_at: isoDaysAgo(3, 2), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-19", user_id: DEMO_USER_ID, conversation_id: "conv-3", content: "[ig_reel]", created_at: isoDaysAgo(4), is_from_instagram: false, source: "echo", attachment_type: "ig_reel" },
  { id: "msg-20", user_id: DEMO_USER_ID, conversation_id: "conv-4", content: "Here's your free guide! 🎉", created_at: isoDaysAgo(6), is_from_instagram: false, source: "automation", attachment_type: null },
  { id: "msg-21", user_id: DEMO_USER_ID, conversation_id: "conv-2", content: "Thanks for reaching out!", created_at: isoDaysAgo(7), is_from_instagram: false, source: "manual", attachment_type: null },
  { id: "msg-22", user_id: DEMO_USER_ID, conversation_id: "conv-1", content: "Here's your free guide! 🎉", created_at: isoDaysAgo(10), is_from_instagram: false, source: "automation", attachment_type: null },
]

const automations: Row[] = [
  { id: "auto-1", user_id: DEMO_USER_ID, name: "Free guide DM", trigger_source: "comment", trigger_type: "keyword", trigger_value: "guide", response_type: "pro", response_content: "Here's your free guide! 🎉 {link}", is_active: true, specific_media_id: null, trigger_count: 128, unlock_count: 96, created_at: isoDaysAgo(20) },
  { id: "auto-2", user_id: DEMO_USER_ID, name: "Pricing FAQ", trigger_source: "dm", trigger_type: "keyword", trigger_value: "price", response_type: "pro", response_content: "Our rate card is linked below 👇", is_active: true, specific_media_id: null, trigger_count: 54, unlock_count: 41, created_at: isoDaysAgo(15) },
  { id: "auto-3", user_id: DEMO_USER_ID, name: "Story reaction", trigger_source: "story", trigger_type: "keyword", trigger_value: "🔥", response_type: "pro", response_content: "Glad you liked it! Check the link in bio.", is_active: true, specific_media_id: null, trigger_count: 33, unlock_count: 20, created_at: isoDaysAgo(10) },
  { id: "auto-4", user_id: DEMO_USER_ID, name: "Collab inquiries", trigger_source: "comment", trigger_type: "keyword", trigger_value: "collab", response_type: "pro", response_content: "Thanks for reaching out — sending details now!", is_active: false, specific_media_id: null, trigger_count: 9, unlock_count: 4, created_at: isoDaysAgo(3) },
  { id: "auto-5", user_id: DEMO_USER_ID, name: "Discount code", trigger_source: "dm", trigger_type: "keyword", trigger_value: "discount", response_type: "pro", response_content: "Use code WELCOME10 at checkout!", is_active: true, specific_media_id: null, trigger_count: 71, unlock_count: 58, created_at: isoDaysAgo(1) },
]

const iceBreakers: Row[] = [
  { id: "ib-1", user_id: DEMO_USER_ID, question: "What's your best offer?", response: "Great question! Here's what we've got 👇", is_active: true, created_at: isoDaysAgo(12) },
  { id: "ib-2", user_id: DEMO_USER_ID, question: "How do I get started?", response: "Just reply here and I'll walk you through it!", is_active: true, created_at: isoDaysAgo(12) },
]

const users: Row[] = [
  {
    id: DEMO_USER_ID,
    username: DEMO_USERNAME,
    // Plaintext — decryptSecret() passes non-"enc:v1:"-prefixed values through unchanged, and
    // demo mode never makes a real Instagram API call with it, so no encryption round-trip needed.
    access_token: "DEMO_TOKEN_NOT_REAL",
    token_expires_at: isoDaysAgo(-45),
    business_account_id: DEMO_USER_ID,
    page_id: DEMO_USER_ID,
    created_at: isoDaysAgo(20),
    updated_at: isoDaysAgo(0),
  },
]

const mockTables: Record<string, Row[]> = { users, automations, conversations, messages, ice_breakers: iceBreakers }

type Filter = { op: "eq" | "gte" | "lte"; col: string; val: any }

class MockQueryBuilder implements PromiseLike<{ data: any; error: null; count: number | null }> {
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select"
  private payload: any
  private onConflict = "id"
  private filters: Filter[] = []
  private orderCol?: string
  private orderAsc = true
  private limitN?: number
  private singleRow = false
  private countMode = false
  private headOnly = false
  private selectCols = "*"

  constructor(private table: string) {}

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    this.selectCols = cols
    if (opts?.count) this.countMode = true
    if (opts?.head) this.headOnly = true
    return this
  }
  eq(col: string, val: any) {
    this.filters.push({ op: "eq", col, val })
    return this
  }
  gte(col: string, val: any) {
    this.filters.push({ op: "gte", col, val })
    return this
  }
  lte(col: string, val: any) {
    this.filters.push({ op: "lte", col, val })
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAsc = opts?.ascending !== false
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  single() {
    this.singleRow = true
    return this
  }
  insert(payload: any) {
    this.mode = "insert"
    this.payload = payload
    return this
  }
  update(payload: any) {
    this.mode = "update"
    this.payload = payload
    return this
  }
  upsert(payload: any, opts?: { onConflict?: string }) {
    this.mode = "upsert"
    this.payload = payload
    this.onConflict = opts?.onConflict ?? "id"
    return this
  }
  delete() {
    this.mode = "delete"
    return this
  }

  private matches(row: Row) {
    return this.filters.every(({ op, col, val }) => {
      const rv = row[col]
      if (op === "eq") return rv === val
      if (op === "gte") return rv >= val
      if (op === "lte") return rv <= val
      return true
    })
  }

  private attachJoins(rows: Row[]) {
    if (this.table === "messages" && this.selectCols.includes("recipient:conversations")) {
      return rows.map((r) => ({
        ...r,
        recipient: { recipient_username: mockTables.conversations.find((c) => c.id === r.conversation_id)?.recipient_username ?? "user" },
      }))
    }
    return rows
  }

  private execute(): { data: any; error: null; count: number | null } {
    const table = (mockTables[this.table] ??= [])

    if (this.mode === "insert") {
      const rowsIn = Array.isArray(this.payload) ? this.payload : [this.payload]
      const inserted = rowsIn.map((r) => ({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...r,
      }))
      table.push(...inserted)
      return { data: this.singleRow ? inserted[0] : inserted, error: null, count: null }
    }

    if (this.mode === "upsert") {
      const rowsIn = Array.isArray(this.payload) ? this.payload : [this.payload]
      const key = this.onConflict
      const upserted: Row[] = []
      for (const r of rowsIn) {
        const idx = table.findIndex((t) => t[key] === r[key])
        if (idx >= 0) {
          table[idx] = { ...table[idx], ...r }
          upserted.push(table[idx])
        } else {
          const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }
          table.push(row)
          upserted.push(row)
        }
      }
      return { data: this.singleRow ? upserted[0] : upserted, error: null, count: null }
    }

    if (this.mode === "update") {
      const matched = table.filter((r) => this.matches(r))
      matched.forEach((r) => Object.assign(r, this.payload, { updated_at: new Date().toISOString() }))
      return { data: this.singleRow ? matched[0] ?? null : matched, error: null, count: null }
    }

    if (this.mode === "delete") {
      const remaining = table.filter((r) => !this.matches(r))
      const removedCount = table.length - remaining.length
      mockTables[this.table] = remaining
      return { data: null, error: null, count: removedCount }
    }

    // select
    let rows = table.filter((r) => this.matches(r))
    if (this.orderCol) {
      const col = this.orderCol
      rows = [...rows].sort((a, b) => {
        if (a[col] < b[col]) return this.orderAsc ? -1 : 1
        if (a[col] > b[col]) return this.orderAsc ? 1 : -1
        return 0
      })
    }
    if (this.countMode) {
      return { data: this.headOnly ? null : rows, error: null, count: rows.length }
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN)
    rows = this.attachJoins(rows)
    if (this.singleRow) {
      return { data: rows[0] ?? null, error: null, count: null }
    }
    return { data: rows, error: null, count: rows.length }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

export function createMockSupabaseClient() {
  return { from: (table: string) => new MockQueryBuilder(table) }
}
