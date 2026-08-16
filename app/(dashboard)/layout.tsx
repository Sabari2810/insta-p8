"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ConnectionBanner } from "@/components/dashboard/ConnectionBanner"
import { InstagramSessionProvider, useInstagramSession } from "@/hooks/use-instagram-session"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <InstagramSessionProvider>
            <DashboardShell>{children}</DashboardShell>
        </InstagramSessionProvider>
    )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
    const { username, profilePic, logout, isLoading } = useInstagramSession()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f5f3] text-neutral-900">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#f6f5f3] text-foreground">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar
                    className="h-full border-r border-black/10 bg-white/70 backdrop-blur-xl"
                    username={username || "User"}
                    profilePic={profilePic}
                    onLogout={logout}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
                {/* Mobile Header (Visible only on small screens) */}
                <header className="md:hidden h-16 border-b border-black/10 bg-white flex items-center justify-between px-4 sticky top-0 z-40">
                    <span className="font-serif-display text-xl text-neutral-900">Wingman</span>
                    <MobileNav username={username || "User"} profilePic={profilePic} onLogout={logout} />
                </header>

                <main className="flex-1 relative overflow-auto">
                    <ConnectionBanner />
                    {children}
                </main>
            </div>
        </div>
    )
}
