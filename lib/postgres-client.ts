import { Pool } from "pg"

// A thin query-builder that mirrors the handful of Supabase (PostgREST) chainable methods this
// app actually uses (.from().select().eq()...), but talks to any plain Postgres database over
// `pg`. This is what makes the app portable: point DATABASE_URL at Neon, Railway, a self-hosted
// box, whatever — no Supabase-specific API involved. See lib/supabase-server.ts for how this
// slots in as a third branch alongside the real Supabase client and the in-memory demo mock.

let pool: Pool | undefined

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString)
    const sslDisabled = /sslmode=disable/.test(connectionString)
    pool = new Pool({
      connectionString,
      ssl: isLocal || sslDisabled ? undefined : { rejectUnauthorized: false },
    })
  }
  return pool
}

// Columns that hold JSONB in schema.sql — values written to these need JSON.stringify() since
// `pg` only auto-serializes for types it can infer, which it can't from a bare JS value. Reads
// don't need the inverse: `pg` parses json/jsonb columns back into objects automatically.
const JSONB_COLUMNS = new Set(["response_content", "media_selection", "follow_up_steps", "data", "automation_template"])

function serializeValue(col: string, val: any) {
  if (val !== null && val !== undefined && JSONB_COLUMNS.has(col)) return JSON.stringify(val)
  return val
}

function qi(name: string) {
  return `"${name.replace(/"/g, '""')}"`
}

/** Splits on commas that aren't inside parens, so `.or()`'s `col.in.(a,b,c)` stays one condition. */
function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""
  for (const ch of s) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

type WhereFilter = { op: "eq" | "gte" | "lte" | "gt" | "ilike"; col: string; val: any } | { op: "not-is-null"; col: string }
type OrCondition = { col: string; op: "eq" | "ilike" | "in"; val: string }

class PgQueryBuilder implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select"
  private payload: any
  private onConflict = "id"
  private filters: WhereFilter[] = []
  private orConditions: OrCondition[] = []
  private orderCol?: string
  private orderAsc = true
  private limitN?: number
  private rangeFrom?: number
  private rangeTo?: number
  private singleRow = false
  private countMode = false
  private headOnly = false
  private selectCols = "*"
  private needsRecipientJoin = false

  constructor(private table: string) {}

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    this.needsRecipientJoin = cols.includes("recipient:conversations")
    this.selectCols = cols.replace(/,?\s*recipient:conversations\([^)]*\)/, "").trim() || "*"
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
  gt(col: string, val: any) {
    this.filters.push({ op: "gt", col, val })
    return this
  }
  ilike(col: string, val: string) {
    this.filters.push({ op: "ilike", col, val })
    return this
  }
  /** Only `.not(col, "is", null)` is used anywhere in the app — that's the only shape supported. */
  not(col: string, op: string, val: any) {
    if (op !== "is" || val !== null) throw new Error(`Unsupported .not() usage: ${col}.${op}.${val}`)
    this.filters.push({ op: "not-is-null", col })
    return this
  }
  /** Mirrors Supabase's `.or("col.op.val,col2.op2.val2")` string syntax. ANDs with other filters. */
  or(conditions: string) {
    this.orConditions = splitTopLevel(conditions).map((cond) => {
      const [col, op, ...rest] = cond.split(".")
      return { col, op: op as OrCondition["op"], val: rest.join(".") }
    })
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
  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
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

  /** Builds "col = $1 AND col2 >= $2 AND (col3 = $3 OR col4 ILIKE $4)", appending values to `params`. */
  private buildWhere(params: any[]): string {
    const clauses: string[] = []
    for (const f of this.filters) {
      if (f.op === "not-is-null") {
        clauses.push(`${qi(f.col)} IS NOT NULL`)
        continue
      }
      const sqlOp = { eq: "=", gte: ">=", lte: "<=", gt: ">", ilike: "ILIKE" }[f.op]
      params.push(f.val)
      clauses.push(`${qi(f.col)} ${sqlOp} $${params.length}`)
    }
    if (this.orConditions.length > 0) {
      const orClauses = this.orConditions.map((c) => {
        if (c.op === "in") {
          const ids = c.val.replace(/^\(|\)$/g, "").split(",").filter(Boolean)
          const placeholders = ids.map((id) => {
            params.push(id)
            return `$${params.length}`
          })
          return `${qi(c.col)} IN (${placeholders.join(", ")})`
        }
        const sqlOp = c.op === "ilike" ? "ILIKE" : "="
        params.push(c.val)
        return `${qi(c.col)} ${sqlOp} $${params.length}`
      })
      clauses.push(`(${orClauses.join(" OR ")})`)
    }
    return clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""
  }

  private async attachRecipientJoin(rows: any[]) {
    if (!this.needsRecipientJoin || rows.length === 0) return rows
    const convoIds = [...new Set(rows.map((r) => r.conversation_id).filter(Boolean))]
    if (convoIds.length === 0) return rows.map((r) => ({ ...r, recipient: { recipient_username: "user" } }))
    const params: any[] = [convoIds]
    const { rows: convos } = await getPool().query(
      `SELECT id, recipient_username FROM ${qi("conversations")} WHERE id = ANY($1)`,
      params,
    )
    const byId = new Map(convos.map((c: any) => [c.id, c.recipient_username]))
    return rows.map((r) => ({ ...r, recipient: { recipient_username: byId.get(r.conversation_id) ?? "user" } }))
  }

  private async execute(): Promise<{ data: any; error: any; count: number | null }> {
    try {
      if (this.mode === "insert" || this.mode === "upsert") {
        const rowsIn: any[] = Array.isArray(this.payload) ? this.payload : [this.payload]
        const cols = Object.keys(rowsIn[0])
        const params: any[] = []
        const valueRows = rowsIn.map((r) => {
          const placeholders = cols.map((c) => {
            params.push(serializeValue(c, r[c]))
            return `$${params.length}`
          })
          return `(${placeholders.join(", ")})`
        })
        let sql = `INSERT INTO ${qi(this.table)} (${cols.map(qi).join(", ")}) VALUES ${valueRows.join(", ")}`
        if (this.mode === "upsert") {
          const updateSet = cols
            .filter((c) => c !== this.onConflict)
            .map((c) => `${qi(c)} = EXCLUDED.${qi(c)}`)
            .join(", ")
          sql += ` ON CONFLICT (${qi(this.onConflict)}) DO UPDATE SET ${updateSet}`
        }
        sql += " RETURNING *"
        const { rows } = await getPool().query(sql, params)
        return { data: this.singleRow ? rows[0] ?? null : rows, error: null, count: null }
      }

      if (this.mode === "update") {
        const params: any[] = []
        const cols = Object.keys(this.payload)
        const setClauses = cols.map((c) => {
          params.push(serializeValue(c, this.payload[c]))
          return `${qi(c)} = $${params.length}`
        })
        setClauses.push(`${qi("updated_at")} = NOW()`)
        const where = this.buildWhere(params)
        const { rows } = await getPool().query(
          `UPDATE ${qi(this.table)} SET ${setClauses.join(", ")} ${where} RETURNING *`,
          params,
        )
        return { data: this.singleRow ? rows[0] ?? null : rows, error: null, count: null }
      }

      if (this.mode === "delete") {
        const params: any[] = []
        const where = this.buildWhere(params)
        const { rows } = await getPool().query(`DELETE FROM ${qi(this.table)} ${where} RETURNING *`, params)
        return { data: null, error: null, count: rows.length }
      }

      // select
      const params: any[] = []
      const where = this.buildWhere(params)

      let count: number | null = null
      if (this.countMode) {
        const { rows: countRows } = await getPool().query(`SELECT COUNT(*) FROM ${qi(this.table)} ${where}`, params)
        count = Number(countRows[0].count)
      }
      if (this.countMode && this.headOnly) {
        return { data: null, error: null, count }
      }

      const cols = this.selectCols === "*" ? "*" : this.selectCols
      let sql = `SELECT ${cols} FROM ${qi(this.table)} ${where}`
      if (this.orderCol) sql += ` ORDER BY ${qi(this.orderCol)} ${this.orderAsc ? "ASC" : "DESC"}`
      if (this.rangeFrom != null && this.rangeTo != null) {
        sql += ` LIMIT ${this.rangeTo - this.rangeFrom + 1} OFFSET ${this.rangeFrom}`
      } else if (this.limitN != null) {
        sql += ` LIMIT ${this.limitN}`
      }

      let { rows } = await getPool().query(sql, params)
      rows = await this.attachRecipientJoin(rows)

      if (this.singleRow) {
        return { data: rows[0] ?? null, error: null, count }
      }
      return { data: rows, error: null, count: this.countMode ? count : rows.length }
    } catch (error) {
      return { data: null, error, count: null }
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createPostgresClient() {
  return { from: (table: string) => new PgQueryBuilder(table) }
}
