"use client"

import { useEffect } from "react"
import Create from "./create"

export default function CreatePage() {
  useEffect(() => {
    document.title = "Create Locker - VaultLab";
  }, []);

  return <Create />
}
