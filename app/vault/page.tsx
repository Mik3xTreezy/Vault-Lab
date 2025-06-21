"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Vault from "./vault"

export default function VaultPage() {
  useEffect(() => {
    document.title = "Vault - VaultLab";
  }, []);

  return (
    <DashboardLayout>
      <Vault />
    </DashboardLayout>
  )
}
