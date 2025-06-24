import type React from "react"
import "@/styles/globals.css"
import { Providers } from "./providers"
import { Alumni_Sans_Pinstripe } from "next/font/google"
import { ImpersonationStatusBanner } from "@/components/admin-impersonation"
import { SpeedInsights } from "@vercel/speed-insights/next"

const alumniSansPinstripe = Alumni_Sans_Pinstripe({ subsets: ["latin"], weight: ["400"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={alumniSansPinstripe.className}>
      <body>
        <ImpersonationStatusBanner />
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}

export const metadata = {
  title: 'VaultLab - Monetize Your Links',
  description: 'Transform your content into premium revenue streams with VaultLab',
  generator: 'v0.dev',
  icons: {
    icon: '/Icon.svg',
    shortcut: '/Icon.png',
    apple: '/Icon.png',
  },
};