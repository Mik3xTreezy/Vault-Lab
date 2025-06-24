"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Admin from "./admin"

export default function AdminPage() {
  useEffect(() => {
    document.title = "Admin - VaultLab";
  }, []);

  return (
    <DashboardLayout>
      <Admin />
    </DashboardLayout>
  )
}
