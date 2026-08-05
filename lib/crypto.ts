import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const PREFIX = "enc:v1:"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (key) {
    const buf = Buffer.from(key, "hex")
    if (buf.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 hex characters)")
    }
    return buf
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[crypto] ENCRYPTION_KEY is not set — using an insecure development-only fallback. " +
        "Set ENCRYPTION_KEY before deploying.",
    )
    return crypto.createHash("sha256").update("dev-only-insecure-encryption-key").digest()
  }
  throw new Error("ENCRYPTION_KEY environment variable must be set")
}

/** Encrypts a secret (e.g. an Instagram access token) before it's written to the database. */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

/**
 * Decrypts a secret read from the database. Values written before this change are still
 * plaintext (no PREFIX) — those pass through unchanged so existing connected accounts don't
 * break; they're re-encrypted the next time the row is upserted (e.g. re-login).
 */
export function decryptSecret(value: string | null | undefined): string {
  if (!value) return ""
  if (!value.startsWith(PREFIX)) return value

  const raw = Buffer.from(value.slice(PREFIX.length), "base64")
  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}
