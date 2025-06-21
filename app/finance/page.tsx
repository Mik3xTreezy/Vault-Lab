"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Finance from "./finance"

export default function FinancePage() {
  useEffect(() => {
    document.title = "Finance - VaultLab";
  }, []);

  return (
    <DashboardLayout>
      <Finance />
    </DashboardLayout>
  )
}
