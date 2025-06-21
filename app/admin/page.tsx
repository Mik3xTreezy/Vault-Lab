"use client"

import { useEffect } from "react"
import Admin from "./admin"

export default function AdminPage() {
  useEffect(() => {
    document.title = "Admin - VaultLab";
  }, []);

  return <Admin />
}
