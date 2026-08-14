import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"
import { decryptSecret } from "@/lib/crypto"
import { isDemoMode } from "@/lib/demo-mode"

const DEMO_MEDIA = [
  { id: "demo-media-1", caption: "New drop is live 🎉", media_type: "IMAGE", media_url: "https://placehold.co/600x600/171717/fff?text=Post+1", thumbnail_url: null, permalink: "#", timestamp: new Date().toISOString() },
  { id: "demo-media-2", caption: "Behind the scenes", media_type: "VIDEO", media_url: "https://placehold.co/600x600/7e3bed/fff?text=Reel+1", thumbnail_url: "https://placehold.co/600x600/7e3bed/fff?text=Reel+1", permalink: "#", timestamp: new Date().toISOString() },
  { id: "demo-media-3", caption: "Thank you for 10k!", media_type: "IMAGE", media_url: "https://placehold.co/600x600/171717/fff?text=Post+2", thumbnail_url: null, permalink: "#", timestamp: new Date().toISOString() },
]

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.userId

    if (isDemoMode) {
      return NextResponse.json({ data: DEMO_MEDIA })
    }

    const supabase = await getSupabaseServerClient()

    // 1. Get Access Token
    const { data: user } = await supabase
      .from("users")
      .select("access_token") // Business ID ki zaroorat nahi hai ab
      .eq("id", userId)
      .single()

    if (!user?.access_token) {
      return NextResponse.json({ error: "Instagram not connected" }, { status: 401 })
    }
    const accessToken = decryptSecret(user.access_token)

    // 2. Fetch Media (Smart Method: /me/media)
    // Ye 'instagram.com' use karega jo aapke token ke saath compatible hai.
    // Hum '/me' use kar rahe hain taaki ID mismatch ka lafda hi na ho.
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${accessToken}`

    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()

    if (data.error) {
      console.error("[v0] Instagram Media Error:", data.error)
      // Agar Token Invalid hai, to user ko Logout karne bolenge frontend pe
      if (data.error.code === 190) {
         return NextResponse.json({ error: "Session Expired. Please Logout & Login." }, { status: 401 })
      }
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data.data || [] })
  } catch (error) {
    console.error("[v0] Server Error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
