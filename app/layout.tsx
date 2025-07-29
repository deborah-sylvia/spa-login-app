import type React from "react"
import type { Metadata } from "next"
import "./globals.css" // Import globals.css at the top of the file
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/ui/toggle"

export const metadata: Metadata = {
  title: "Secure Login - SPA",
  description: "A clean, accessible single-page application for user authentication",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          {children}
        </body>
      </html>
    </ThemeProvider>
  )
}
