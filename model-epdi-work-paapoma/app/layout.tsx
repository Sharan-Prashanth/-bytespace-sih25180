import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { DocumentProvider } from "@/components/document-context"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <header className="bg-primary text-primary-foreground border-b">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
              <Image
                    src="/munu-thala-singam.png"
                    width={32}
                    height={32}
                    alt="Emblem"
                    className="rounded"
                  />                
                  <div className="leading-tight">
                  <p className="text-sm">Government of India</p>
                  <p className="text-xs opacity-90">Ministry of Coal • NaCCER</p>
                </div>
              </div>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="underline-offset-4 hover:underline">
                  Home
                </Link>
                <Link href="/setup" className="underline-offset-4 hover:underline">
                  Setup
                </Link>
                <Link href="#tools" className="underline-offset-4 hover:underline">
                  Tools
                </Link>
              </nav>
            </div>
          </header>
          <DocumentProvider>{children}</DocumentProvider>
          <Analytics />
          <footer className="border-t">
            <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-muted-foreground">
              API base: {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}
            </div>
          </footer>
        </Suspense>
      </body>
    </html>
  )
}
