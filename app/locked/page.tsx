"use client"

import { useEffect } from "react"
import Script from "next/script"
import LinkLocker from "./link-locker"

export default function Page() {
  useEffect(() => {
    document.title = "Content Locked - VaultLab";
  }, []);

  return (
    <>
      <Script 
        src="//pl15868784.profitableratecpm.com/f6/3d/ac/f63dac670d8a31c91e16e3ed9f84503b.js"
        strategy="afterInteractive"
      />
      <LinkLocker 
        title="Exclusive Financial Strategy Guide" 
        destinationUrl="https://example.com/download" 
        lockerId="demo"
      />
    </>
  )
}
