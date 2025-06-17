import type React from "react"
import "@/styles/globals.css"
import { Providers } from "./providers"
import { Alumni_Sans_Pinstripe } from "next/font/google"

const alumniSansPinstripe = Alumni_Sans_Pinstripe({ subsets: ["latin"], weight: ["400"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={alumniSansPinstripe.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };