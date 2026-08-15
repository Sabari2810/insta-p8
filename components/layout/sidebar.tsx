"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import {
  FiGitBranch as Workflow, FiHome as Home, FiLogOut as LogOut, FiSettings as Settings, FiTrendingUp as LineChart,
  FiInbox as Inbox, FiStar as Sparkles, FiClock as History,
} from "react-icons/fi"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/activity", icon: History, label: "Activity" },
  { href: "/automations", icon: Workflow, label: "Automations" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/ice-breakers", icon: Sparkles, label: "Warm-ups" },
  { href: "/analytics", icon: LineChart, label: "Analytics" },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  username?: string
  profilePic?: string | null
  className?: string
  onLogout?: () => void
  onNavigate?: () => void
}

export function Sidebar({ className, username = "creator", profilePic, onLogout, onNavigate, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex flex-col bg-white", className)} {...props}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <img src="/favicon.jpeg" alt="" className="w-7 h-7 rounded-full shrink-0" />
        <span className="font-mono-ui text-sm font-bold tracking-tight text-neutral-900">Wingman</span>
      </div>

      <div className="mx-5 h-px bg-black/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors relative",
                active
                  ? "text-brand bg-brand/10"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-black/[0.03]",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand" />}
              <div className="flex gap-3">
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-brand" : "")} strokeWidth={active ? 2.2 : 1.8} />
                <span className={active ? "font-medium" : ""}>{label}</span>
              </div>
            </Link>
          )
        })}

        <div className="pt-5 pb-1 px-3">
          <div className="h-px bg-black/[0.06]" />
        </div>

        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors relative",
            pathname === "/settings"
              ? "text-brand bg-brand/10"
              : "text-neutral-500 hover:text-neutral-800 hover:bg-black/[0.03]",
          )}
        >
          {pathname === "/settings" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand" />}
          <div className="flex gap-3">
            <Settings className={cn("w-4 h-4 shrink-0", pathname === "/settings" && "text-brand")} strokeWidth={1.8} />
            <span>Settings</span>
          </div>
        </Link>
      </nav>

      {/* Account */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm border border-black/[0.08] group">
          <div className="w-7 h-7 rounded-sm bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-sm bg-white flex items-center justify-center overflow-hidden">
              {profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePic} alt={username} className="w-full h-full rounded-sm object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-neutral-900">{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-900 truncate">@{username}</p>
            <p className="font-mono-ui text-[9px] uppercase tracking-wider text-neutral-500">connected</p>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 rounded-md text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
