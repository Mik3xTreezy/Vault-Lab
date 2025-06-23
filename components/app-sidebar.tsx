"use client"

import { Vault, Settings, DollarSign } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LordIcon } from "@/components/ui/lordicon"
import { LORDICON_COLORS } from "@/lib/lordicons"

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
    iconType: "animated" as const,
    iconSrc: "https://cdn.lordicon.com/msoeawqm.json", // Analytics icon
    iconColors: LORDICON_COLORS.emerald,
  },
  {
    title: "Vault",
    url: "/vault",
    iconType: "animated" as const,
    iconSrc: "https://cdn.lordicon.com/yqzmiobz.json", // Folder/Lock icon
    iconColors: LORDICON_COLORS.blue,
  },
  {
    title: "Finance",
    url: "/finance",
    iconType: "animated" as const,
    iconSrc: "https://cdn.lordicon.com/qhgmphtg.json", // Wallet icon
    iconColors: LORDICON_COLORS.green,
  },
  {
    title: "Referrals",
    url: "/referrals",
    iconType: "animated" as const,
    iconSrc: "https://cdn.lordicon.com/eszyyflr.json", // People/Network icon
    iconColors: LORDICON_COLORS.purple,
  },
  {
    title: "Settings",
    url: "/settings",
    iconType: "animated" as const,
    iconSrc: "https://cdn.lordicon.com/hwjcdycb.json", // Settings cog icon
    iconColors: LORDICON_COLORS.orange,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-white/10" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
          <div className="w-4 h-4 bg-black rounded-sm"></div>
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
                className="w-full justify-center group-data-[collapsible=icon]:justify-center"
              >
                <Link href={item.url} className="flex items-center">
                  <LordIcon 
                    src={item.iconSrc}
                    size={20}
                    trigger="hover"
                    colors={pathname === item.url ? LORDICON_COLORS.emerald : item.iconColors}
                    className="transition-transform duration-200 hover:scale-110"
                  />
                  <span className="ml-2 group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
