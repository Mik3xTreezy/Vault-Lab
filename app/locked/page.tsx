"use client"

import { useEffect } from "react"
import LinkLocker from "./link-locker"

export default function Page() {
  useEffect(() => {
    document.title = "Content Locked - VaultLab";
  }, []);

  return <LinkLocker 
    title="Exclusive Financial Strategy Guide" 
    destinationUrl="https://example.com/download" 
    lockerId="demo"
  />
}
