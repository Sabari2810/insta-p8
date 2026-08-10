import type React from "react"
import type { Metadata } from "next"
import { Archivo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" })

export const metadata: Metadata = {
  title: "Wingman - Instagram Automation",
  description: "Auto-reply to comments, DMs, and stories with keyword triggers.",
  icons: {
    icon: "/favicon.jpeg",
    apple: "/logo.jpeg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
