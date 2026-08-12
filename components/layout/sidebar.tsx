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
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/automations", icon: Zap, label: "Automations" },
  { href: "/dashboard/inbox", icon: MessageSquare, label: "Inbox" },
  { href: "/dashboard/ice-breakers", icon: Snowflake, label: "Ice breakers" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
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
    <aside className={cn("flex flex-col bg-[#f3f2f2] text-[#201e1d]", className)} {...props}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-[18px] border-b-2 border-[#201e1d]/40 flex items-center gap-2.5">
        <img src="/favicon.jpeg" alt="" className="w-7 h-7 rounded-full shrink-0" />
        <div>
          <div className="font-black text-[18px] leading-none tracking-[-0.02em]">WINGMAN</div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-[#7d7979] mt-0.5">Instagram</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col py-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-bold border-l-4 transition-colors",
                active
                  ? "border-[#ec3013] text-[#201e1d]"
                  : "border-transparent text-[#201e1d] hover:bg-[#201e1d]/[0.06]",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}

        <div className="mt-auto" />

        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-bold border-l-4 border-t-2 border-t-[#201e1d]/40 transition-colors",
            pathname === "/dashboard/settings"
              ? "border-l-[#ec3013] text-[#201e1d]"
              : "border-l-transparent text-[#201e1d] hover:bg-[#201e1d]/[0.06]",
          )}
        >
          <Settings className="w-4 h-4 shrink-0" strokeWidth={pathname === "/dashboard/settings" ? 2.4 : 1.8} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Account */}
      <div className="px-4 py-4 border-t-2 border-[#201e1d]/40 flex items-center gap-2.5">
        <div className="w-8 h-8 shrink-0 bg-[#201e1d] text-[#f3f2f2] text-[12px] font-bold flex items-center justify-center overflow-hidden">
          {profilePic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profilePic} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span>{username.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate">@{username}</p>
          <p className="text-[11px] text-[#7d7979]">Connected</p>
        </div>
        <button
          onClick={onLogout}
          title="Log out"
          className="p-1.5 text-[#7d7979] hover:text-[#ec3013] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  )
}
