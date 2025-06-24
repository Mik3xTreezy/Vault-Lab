"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ReferralsComponent from "./referrals-component"

export default function ReferralsPage() {
  useEffect(() => {
    document.title = "Referrals - VaultLab";
  }, []);

  return (
    <DashboardLayout>
      <ReferralsComponent />
    </DashboardLayout>
  )
} 