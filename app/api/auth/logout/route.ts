import { NextResponse } from "next/server"
import { clearSessionCookie, clearOAuthStateCookie } from "@/lib/session"

export async function POST() {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  // Defensive — removes any stale login-attempt state so a fresh login always starts clean.
  clearOAuthStateCookie(response)
  return response
}
