import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { setSessionCookie, getOAuthState, clearOAuthStateCookie } from "@/lib/session"
import { encryptSecret } from "@/lib/crypto"

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state")

  if (error) {
    const redirectUrl = new URL("/", request.url)
    redirectUrl.searchParams.set("error", error)
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    // Go straight to /dashboard — bouncing through "/" first meant relying on that page's
    // client-side redirect to relay `code`/`state` onward, which previously dropped `state`.
    const redirectUrl = new URL("/dashboard", request.url)
    redirectUrl.searchParams.set("code", code)
    if (state) redirectUrl.searchParams.set("state", state)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.json({ error: "Invalid callback" }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, state } = body
    if (!code) return NextResponse.json({ error: "No code" }, { status: 400 })

    const expectedState = getOAuthState(request)
    if (!expectedState || !state || !timingSafeEqualStr(state, expectedState)) {
      const reason = !expectedState ? "no state cookie on request" : !state ? "no state in POST body" : "state mismatch"
      console.error(
        `[callback] 400 state check failed: ${reason}; cookieLen=${expectedState?.length ?? 0} bodyStateLen=${state?.length ?? 0} ` +
          `host=${request.headers.get("host")} origin=${request.headers.get("origin")} referer=${request.headers.get("referer")}`,
      )
      const response = NextResponse.json(
        { error: "Login attempt expired or invalid. Please try connecting again." },
        { status: 400 },
      )
      clearOAuthStateCookie(response)
      return response
    }

    // 1. Env Vars
    const clientId = process.env.INSTAGRAM_APP_ID
    const clientSecret = process.env.INSTAGRAM_APP_SECRET
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Missing Env Vars: Check INSTAGRAM_APP_ID")
    }

    // 2. Exchange Code for Short Token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    })

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      if (tokenData.error_message?.includes("authorization code has been used")) {
        // Harmless double-fire from React StrictMode or double clicks
        return NextResponse.json({ error: "Code already used" }, { status: 400 })
      }
      console.error("[v0] 🔴 Token Error:", JSON.stringify(tokenData, null, 2))
      return NextResponse.json({ error: tokenData.error_description || "Token failed" }, { status: 400 })
    }

    const shortToken = tokenData.access_token
    const loginUserId = tokenData.user_id.toString()

    // 3. Exchange for Long Token (60 Days)
    const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortToken}`
    const longRes = await fetch(longLivedUrl)
    const longData = await longRes.json()
    const accessToken = longData.access_token || shortToken
    const expiresIn = longData.expires_in || 5184000

    // 4. Get Username + IG Professional Account ID (webhook-matching ID)
    // Per Meta docs: /me?fields=user_id returns the IG_ID that matches webhook entry.id
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started
    let username = `user_${loginUserId}`
    let businessAccountId = loginUserId // fallback
    let profilePic: string | null = null

    try {
      const meRes = await fetch(
        `https://graph.instagram.com/v24.0/me?fields=user_id,username,profile_picture_url&access_token=${accessToken}`
      )
      const meData = await meRes.json()
      console.log("[v0] 📋 /me response:", JSON.stringify(meData))

      if (meData.username) username = meData.username
      if (meData.profile_picture_url) profilePic = meData.profile_picture_url
      if (meData.user_id) {
        businessAccountId = meData.user_id.toString()
        console.log(`[v0] 🎯 Got IG Professional Account ID (user_id): ${businessAccountId}`)
      } else {
        console.warn(`[v0] ⚠️ /me did not return user_id, using loginUserId: ${loginUserId}`)
      }
    } catch (e) {
      console.error("[v0] /me request failed:", e)
    }

    // 6. Save/Update User
    const supabase = await getSupabaseServerClient()

    const updates: any = {
      username,
      access_token: encryptSecret(accessToken),
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      business_account_id: businessAccountId,
      page_id: businessAccountId, // Always keep in sync
    }

    console.log(`[v0] 💾 Saving user: ${username} | id=${loginUserId} | biz_id=${businessAccountId}`)

    const { error: upsertError } = await supabase
      .from("users")
      .upsert({ id: loginUserId, ...updates }, { onConflict: "id" })

    if (upsertError) throw upsertError

    const response = NextResponse.json({ success: true, username, userId: loginUserId, profilePic })
    setSessionCookie(response, { userId: loginUserId, username }, expiresIn)
    clearOAuthStateCookie(response)
    return response

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
