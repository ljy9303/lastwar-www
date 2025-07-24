"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import { Toaster } from "@/components/ui/toaster"
import { FloatingChatButton } from "@/components/chat/floating-chat-button"
import { ChatCacheProvider } from "@/contexts/chat-cache-context"

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <SessionProvider 
        refetchInterval={5 * 60} 
        refetchOnWindowFocus={true}
        refetchWhenOffline={false}
      >
        <ChatCacheProvider>
          <AuthLayout>
            {children}
            <FloatingChatButton />
          </AuthLayout>
        </ChatCacheProvider>
      </SessionProvider>
      <Toaster />
    </ThemeProvider>
  )
}