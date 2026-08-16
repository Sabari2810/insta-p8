"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useSearchParams, useRouter } from "next/navigation"

interface InstagramSessionState {
    userId: string | null
    username: string | null
    profilePic: string | null
    isLoading: boolean
    logout: () => Promise<void>
}

const InstagramSessionContext = createContext<InstagramSessionState | null>(null)

/**
 * Resolves the session exactly once per dashboard visit, at the layout level. Every page under
 * (dashboard) used to call the old useInstagramSession() hook independently, each re-running the
 * full OAuth-code-exchange-or-localStorage-restore dance from scratch on its own mount — on top
 * of being wasteful, this meant navigating straight into a page (or a fresh page load) could hit
 * that page's own copy of the race between the session cookie landing and its first authenticated
 * fetch firing, which the next page navigation just happened not to hit. Resolving it once here,
 * in a provider that persists across route changes within the layout, removes that race instead
 * of relying on it resolving itself by the second try.
 */
export function InstagramSessionProvider({ children }: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const searchParams = useSearchParams()
    const router = useRouter()
    // Guards against the same OAuth code being exchanged twice — the state cookie backing it is
    // consumed on first use, so a second attempt would always 400 regardless of why it re-fired.
    const exchangingCodeRef = useRef<string | null>(null)

    useEffect(() => {
        const code = searchParams.get("code")
        const state = searchParams.get("state")

        const handleSession = async () => {
            // CASE A: New Login from Instagram
            if (code) {
                if (exchangingCodeRef.current === code) {
                    setIsLoading(false)
                    return
                }
                exchangingCodeRef.current = code
                // Strip code/state from the URL before the exchange even resolves — a refresh
                // or re-mount while this is in flight (or after it fails) must never resend the
                // same code. Instagram codes are single-use; a resend always 400s as "Code
                // already used" with no way to recover except starting a fresh login.
                router.replace("/dashboard")
                try {
                    const res = await fetch("/api/instagram/callback", {
                        method: "POST",
                        body: JSON.stringify({ code, state }),
                    })
                    const data = await res.json()

                    if (data.success) {
                        localStorage.setItem("ig_user_id", data.userId)
                        localStorage.setItem("ig_username", data.username)
                        if (data.profilePic) localStorage.setItem("ig_profile_pic", data.profilePic)

                        setUserId(data.userId)
                        setUsername(data.username)
                        setProfilePic(data.profilePic || null)
                    } else {
                        console.error("Login failed:", data.error)
                    }
                } catch (err) {
                    console.error("Login failed:", err)
                }
            }
            // CASE B: Restore Session from LocalStorage
            else {
                const savedId = localStorage.getItem("ig_user_id")
                const savedName = localStorage.getItem("ig_username")

                if (savedId && savedName) {
                    setUserId(savedId)
                    setUsername(savedName)
                    setProfilePic(localStorage.getItem("ig_profile_pic"))
                }
            }
            setIsLoading(false)
        }

        handleSession()
    }, [searchParams, router])

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
        } catch (err) {
            console.error("Logout request failed:", err)
        }
        localStorage.removeItem("ig_user_id")
        localStorage.removeItem("ig_username")
        localStorage.removeItem("ig_profile_pic")
        setUsername(null)
        setUserId(null)
        setProfilePic(null)
        router.push("/")
    }

    return (
        <InstagramSessionContext.Provider value={{ userId, username, profilePic, isLoading, logout }}>
            {children}
        </InstagramSessionContext.Provider>
    )
}

export function useInstagramSession(): InstagramSessionState {
    const ctx = useContext(InstagramSessionContext)
    if (!ctx) {
        throw new Error("useInstagramSession must be used within an InstagramSessionProvider")
    }
    return ctx
}
