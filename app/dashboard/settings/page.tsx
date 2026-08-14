"use client"

import { useEffect, useState } from "react"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { toast } from "sonner"
import {
    Loader2, User, Webhook, ShieldAlert, Copy, Check,
    ExternalLink, LogOut, Unplug, RefreshCw,
} from "lucide-react"

interface AccountInfo {
    username: string
    businessAccountId: string | null
    connectedAt: string
    tokenExpiresAt: string | null
    webhookVerifyTokenConfigured: boolean
}

function formatDate(iso: string | null) {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

export default function SettingsPage() {
    const { userId, profilePic, logout, isLoading: isSessionLoading } = useInstagramSession()
    const [account, setAccount] = useState<AccountInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
    const [disconnecting, setDisconnecting] = useState(false)

    useEffect(() => {
        if (!userId) return
        fetch("/api/instagram/account")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setAccount(data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [userId])

    useEffect(() => {
        if (!confirmingDisconnect) return
        const t = setTimeout(() => setConfirmingDisconnect(false), 4000)
        return () => clearTimeout(t)
    }, [confirmingDisconnect])

    const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/instagram/webhook` : ""

    const handleCopyWebhookUrl = async () => {
        await navigator.clipboard.writeText(webhookUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleReconnect = () => {
        window.location.href = "/api/instagram/login"
    }

    const handleDisconnect = async () => {
        if (!confirmingDisconnect) {
            setConfirmingDisconnect(true)
            return
        }
        setDisconnecting(true)
        try {
            const res = await fetch("/api/instagram/account", { method: "DELETE" })
            if (res.ok) {
                window.location.href = "/"
            } else {
                toast.error("Failed to disconnect. Please try again.")
                setDisconnecting(false)
                setConfirmingDisconnect(false)
            }
        } catch {
            toast.error("Failed to disconnect. Please try again.")
            setDisconnecting(false)
            setConfirmingDisconnect(false)
        }
    }

    if (isSessionLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
            </div>
        )
    }

    const daysRemaining = account?.tokenExpiresAt
        ? Math.ceil((new Date(account.tokenExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null
    const expired = daysRemaining !== null && daysRemaining <= 0

    return (
        <>
            <div className="p-20 bg-white">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Configuration</p>
                <h1 className="font-serif-display text-4xl md:text-5xl text-neutral-900 leading-none">Settings</h1>
            </div>
            <div className="p-8 space-y-8 max-w-3xl mx-auto animate-in fade-in duration-700">
                {/* Connected Account */}
                <section className="rounded-2xl border border-black/10 bg-white p-6 space-y-5">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-neutral-900" />
                        <h2 className="text-sm font-semibold text-neutral-900">Connected account</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-black/[0.06] border border-black/10 shrink-0 overflow-hidden">
                            {profilePic && <img src={profilePic} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-neutral-900 font-semibold truncate">@{account?.username || "—"}</p>
                            <p className="text-xs text-neutral-500 truncate">Business ID: {account?.businessAccountId || "—"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1">Connected since</p>
                            <p className="text-neutral-700">{formatDate(account?.connectedAt ?? null)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1">Connection status</p>
                            <p className={expired ? "text-red-600" : "text-green-600"}>
                                {expired ? "Expired — reconnect needed" : `Active${daysRemaining !== null ? ` (renews in ${daysRemaining}d)` : ""}`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleReconnect}
                        className="flex items-center gap-2 h-9 px-4 rounded-full border border-black/10 text-neutral-700 hover:text-neutral-900 hover:border-black/25 font-mono-ui text-[11px] font-bold uppercase tracking-widest transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reconnect Instagram
                    </button>
                </section>

                {/* Webhook Configuration */}
                <section className="rounded-2xl border border-black/10 bg-white p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Webhook className="w-4 h-4 text-neutral-900" />
                        <h2 className="text-sm font-semibold text-neutral-900">Webhook configuration</h2>
                    </div>
                    <p className="text-xs text-neutral-500">
                        Paste this callback URL into your Meta app's Instagram webhook subscription settings.
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 min-w-0 truncate bg-black/[0.04] border border-black/10 rounded-xl px-4 py-2.5 text-xs text-neutral-700">
                            {webhookUrl}
                        </code>
                        <button
                            onClick={handleCopyWebhookUrl}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-black/10 text-neutral-500 hover:text-neutral-900 hover:border-black/25 transition-colors"
                            title="Copy"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${account?.webhookVerifyTokenConfigured ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span className="text-neutral-500">
                            Verify token {account?.webhookVerifyTokenConfigured ? "configured" : "not set — webhook subscription will fail"}
                        </span>
                    </div>
                    <a
                        href="https://developers.facebook.com/apps/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                        Open Meta Developer dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                </section>

                {/* Danger Zone */}
                <section className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-sm text-neutral-900">Log out</p>
                            <p className="text-xs text-neutral-500">Ends your session on this device. Automations keep running.</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 h-9 px-4 rounded-full border border-black/10 text-neutral-700 hover:text-neutral-900 hover:border-black/25 font-mono-ui text-[11px] font-bold uppercase tracking-widest transition-colors shrink-0"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Log out
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-black/10">
                        <div>
                            <p className="text-sm text-neutral-900">Disconnect Instagram</p>
                            <p className="text-xs text-neutral-500">Stops all automations and clears the stored access token. You'll need to reconnect via Instagram login to use the app again.</p>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="flex items-center gap-2 h-9 px-4 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20 font-mono-ui text-[11px] font-bold uppercase tracking-widest transition-colors shrink-0 disabled:opacity-50"
                        >
                            {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                            {confirmingDisconnect ? "Click again to confirm" : "Disconnect"}
                        </button>
                    </div>
                </section>
            </div>
        </>
    )
}
