"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import {
  Zap, LayoutDashboard, LogOut, Settings, BarChart3,
  MessageSquare, Snowflake,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview", accent: "var(--accent-green)" },
  { href: "/dashboard/automations", icon: Zap, label: "Automations", accent: "var(--accent-violet)" },
  { href: "/dashboard/inbox", icon: MessageSquare, label: "Inbox", accent: "var(--accent-coral)" },
  { href: "/dashboard/ice-breakers", icon: Snowflake, label: "Ice breakers", accent: "var(--accent-green)" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics", accent: "var(--accent-violet)" },
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
    <aside className={cn("flex flex-col bg-[#0a0a09]", className)} {...props}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <img src="/favicon.jpeg" alt="" className="w-7 h-7 rounded-full shrink-0 shadow-[0_0_16px_-2px_var(--accent-green)]" />
        <span className="font-mono-ui text-sm font-bold tracking-tight text-white">Wingman</span>
      </div>

      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label, accent }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all relative",
                active
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]",
              )}
              style={active ? { backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)` } : undefined}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ backgroundColor: accent }} />}
              <Icon className="w-4 h-4 shrink-0" style={active ? { color: accent } : undefined} strokeWidth={active ? 2.2 : 1.8} />
              <span className={active ? "font-medium" : ""}>{label}</span>
            </Link>
          )
        })}

        <div className="pt-5 pb-1 px-3">
          <div className="h-px bg-white/[0.06]" />
        </div>

        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all relative",
            pathname === "/dashboard/settings"
              ? "text-white bg-brand/[0.14]"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]",
          )}
        >
          {pathname === "/dashboard/settings" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand" />}
          <Settings className={cn("w-4 h-4 shrink-0", pathname === "/dashboard/settings" && "text-brand")} strokeWidth={pathname === "/dashboard/settings" ? 2.2 : 1.8} />
          <span className={pathname === "/dashboard/settings" ? "font-medium" : ""}>Settings</span>
        </Link>
      </nav>

      {/* Account */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand via-violet to-coral p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePic} alt={username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-white">{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">@{username}</p>
            <p className="font-mono-ui text-[9px] uppercase tracking-wider text-neutral-600">connected</p>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}