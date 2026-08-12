"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ConnectionBanner } from "@/components/dashboard/ConnectionBanner"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { username, profilePic, logout, isLoading } = useInstagramSession()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f3f2f2] text-[#201e1d]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#f3f2f2] text-[#201e1d]">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-[216px] md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar
                    className="h-full border-r-2 border-[#201e1d]/40"
                    username={username || "User"}
                    profilePic={profilePic}
                    onLogout={logout}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:pl-[216px] transition-all duration-300">
                {/* Mobile Header (Visible only on small screens) */}
                <header className="md:hidden h-16 border-b-2 border-[#201e1d]/40 bg-[#f3f2f2] flex items-center justify-between px-4 sticky top-0 z-40">
                    <span className="font-black text-xl">WINGMAN</span>
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
