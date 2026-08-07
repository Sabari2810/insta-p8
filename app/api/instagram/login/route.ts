import crypto from "crypto"
import { NextResponse } from "next/server"
import { setOAuthStateCookie } from "@/lib/session"

/**
 * GET /api/instagram/login
 * Starts the Instagram OAuth flow. Generates a random `state` value, stores it in a short-lived
 * httpOnly cookie, and redirects to Instagram's authorize screen with that state attached — the
 * callback validates it matches before exchanging the code, preventing login CSRF.
 */
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Instagram app is not configured" }, { status: 500 })
  }

  const state = crypto.randomBytes(24).toString("base64url")

  const authorizeUrl = new URL("https://www.instagram.com/oauth/authorize")
  authorizeUrl.searchParams.set("enable_fb_login", "0")
  authorizeUrl.searchParams.set("force_authentication", "1")
  authorizeUrl.searchParams.set("client_id", clientId)
  authorizeUrl.searchParams.set("redirect_uri", redirectUri)
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
  )
  authorizeUrl.searchParams.set("state", state)

  const response = NextResponse.redirect(authorizeUrl)
  setOAuthStateCookie(response, state)
  return response
}
