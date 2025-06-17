"use client"

import type React from "react"
import Link from "next/link"

import { LayoutDashboard, FolderLock, Settings, DollarSign } from "lucide-react"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/vault",
    icon: FolderLock,
    label: "Vault",
  },
  {
    href: "/finance",
    icon: DollarSign,
    label: "Finance",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  const handleNavigation = (href: string) => {
    window.location.href = href
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      {/* Sidebar */}
      <div className="w-16 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-black rounded-sm"></div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/25"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }
                `}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
