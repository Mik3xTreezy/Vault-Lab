"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Settings from "./settings"

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Settings - VaultLab";
  }, []);

  return (
    <DashboardLayout>
      <Settings />
    </DashboardLayout>
  )
}
