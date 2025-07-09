"use client"

import type React from "react"
import { Inter } from "next/font/google"
import Head from "next/head"
import "./globals.css" // Make sure this imports Tailwind's base styles
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <Head>
        <title>1242 ROKK</title>
        <meta name="description" content="1242 ROKK" />
        <meta name="generator" content="v0.dev" />
      </Head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProvider 
            refetchInterval={5 * 60} 
            refetchOnWindowFocus={true}
            refetchWhenOffline={false}
          >
            <AuthLayout>
              {children}
            </AuthLayout>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
