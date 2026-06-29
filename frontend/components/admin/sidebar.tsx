"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  CalendarDays,
  Package,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

interface SidebarProps {
  user?: {
    name: string
    role: string
    avatar?: string
  }
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Calendar, label: "Event", href: "/admin/events" },
  { icon: FileText, label: "Request", href: "/admin/request" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: CalendarDays, label: "Calendar", href: "/admin/calendar" },
  { icon: Package, label: "Inventory", href: "/admin/inventory" },
  { icon: Users, label: "Crew", href: "/admin/crew" },
  { icon: DollarSign, label: "Finance", href: "/admin/finance" },
  { icon: BarChart3, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

import { getAssetUrl } from "@/lib/api"

export function AdminSidebar({ user: initialUser }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-slate-950 text-slate-300 font-sans border-r border-slate-800 lg:flex">
      {/* Logo */}
      <div className="flex h-20 items-center px-8 border-b border-slate-800/60">
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tight text-white">
            <span className="text-orange-500">F</span>ND
          </span>
          <span className="text-[10px] tracking-[0.25em] text-slate-500 font-medium mt-0.5">PRODUCTION</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4 py-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800">
        <div className="text-xs font-semibold text-slate-500 tracking-wider mb-4 px-2">MAIN MENU</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
                isActive
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-orange-500" />
              )}
              <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-800/60 p-4 bg-slate-950/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-slate-800 ring-2 ring-transparent transition-all hover:ring-orange-500/30">
            <AvatarImage src={getAssetUrl(user?.avatar_url)} />
            <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate mt-0.5">
              {user?.role || "Administrator"}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

