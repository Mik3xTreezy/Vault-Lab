"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LordIcon } from "@/components/ui/lordicon"
import { getLordicon, LORDICON_COLORS } from "@/lib/lordicons"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "dashboard",
    color: LORDICON_COLORS.emerald,
  },
  {
    title: "Vault",
    url: "/vault", 
    icon: "lock",
    color: LORDICON_COLORS.blue,
  },
  {
    title: "Finance",
    url: "/finance",
    icon: "wallet",
    color: LORDICON_COLORS.green,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: "settings",
    color: LORDICON_COLORS.orange,
  },
]

export function AppSidebarEnhanced() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-white/10" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
          <LordIcon
            src={getLordicon('shield')}
            size={24}
            trigger="hover"
            colors={LORDICON_COLORS.emerald}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="w-full justify-center group-data-[collapsible=icon]:justify-center group hover:bg-white/10 transition-all duration-200"
              >
                <Link href={item.url} className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5">
                    <LordIcon
                      src={getLordicon(item.icon as any)}
                      size={20}
                      trigger="hover"
                      colors={pathname === item.url ? LORDICON_COLORS.emerald : item.color}
                      className="group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <span className="ml-2 group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        {/* Additional animated indicators */}
        <div className="mt-auto p-4 space-y-3">
          {/* Live status indicator */}
          <div className="flex items-center space-x-2 justify-center group-data-[collapsible=icon]:justify-center">
            <LordIcon
              src={getLordicon('notification')}
              size={16}
              trigger="loop"
              delay={5000}
              colors={LORDICON_COLORS.green}
            />
            <span className="text-green-400 text-xs font-medium group-data-[collapsible=icon]:hidden">
              Live
            </span>
          </div>
          
          {/* Loading indicator when needed */}
          <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
            <LordIcon
              src={getLordicon('loading')}
              size={16}
              trigger="loop"
              delay={2000}
              colors={LORDICON_COLORS.blue}
            />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
} 