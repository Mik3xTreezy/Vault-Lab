"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LordIcon } from "@/components/ui/lordicon"
import { LORDICON_COLORS, SETTINGS_ICON_DATA, WALLET_ICON_DATA } from "@/lib/lordicons"

import { usePathname } from "next/navigation"

const navigationItems = [
  {
    href: "/dashboard",
    iconSrc: "https://cdn.lordicon.com/msoeawqm.json", // Analytics icon
    iconColors: LORDICON_COLORS.emerald,
    label: "Dashboard",
  },
  {
    href: "/vault",
    iconSrc: "https://cdn.lordicon.com/yqzmiobz.json", // Shield/Lock icon
    iconColors: LORDICON_COLORS.blue,
    label: "Vault",
  },
  {
    href: "/finance",
    iconSrc: WALLET_ICON_DATA, // Local wallet icon
    iconColors: LORDICON_COLORS.green,
    label: "Finance",
  },
  {
    href: "/settings",
    iconSrc: SETTINGS_ICON_DATA, // Local settings cog icon
    iconColors: LORDICON_COLORS.emerald, // Green theme as requested
    label: "Settings",
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      {/* Sidebar */}
      <div className="w-16 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 space-y-6 relative z-10">
        {/* Logo */}
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-black rounded-sm"></div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <button
                key={item.href}
                onClick={(e) => handleNavigation(item.href, e)}
                className={`
                  w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer relative z-20 border-none bg-transparent
                  ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/25"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }
                `}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                type="button"
              >
                <LordIcon 
                  src={item.iconSrc}
                  size={24}
                  trigger="hover"
                  colors={isActive ? LORDICON_COLORS.emerald : item.iconColors}
                />
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
