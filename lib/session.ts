import crypto from "crypto"
import type { NextRequest, NextResponse } from "next/server"

export const SESSION_COOKIE_NAME = "insta_session"

export interface SessionPayload {
  userId: string
  username: string
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[session] SESSION_SECRET is not set — using an insecure development-only fallback. " +
        "Set SESSION_SECRET before deploying.",
    )
    return "dev-only-insecure-secret-do-not-use-in-production"
  }
  throw new Error("SESSION_SECRET environment variable must be set")
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url")
}

export function createSessionToken(payload: SessionPayload, maxAgeSeconds: number): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + maxAgeSeconds * 1000 }),
  ).toString("base64url")
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  const expected = Buffer.from(sign(body))
  const received = Buffer.from(signature)
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") return null
    return { userId: payload.userId, username: payload.username }
  } catch {
    return null
  }
}

export function getSession(request: NextRequest): SessionPayload | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

export function setSessionCookie(response: NextResponse, payload: SessionPayload, maxAgeSeconds: number) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(payload, maxAgeSeconds), {
    path: "/",
    maxAge: maxAgeSeconds,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}
