"use client"

import { useEffect } from "react"
import Landing from "./landing"

export default function LandingPage() {
  useEffect(() => {
    document.title = "VaultLab - Monetize Your Links";
  }, []);

  return <Landing />
}
