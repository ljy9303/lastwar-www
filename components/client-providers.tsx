"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react"
import AuthLayout from "@/components/AuthLayout"
import { Toaster } from "@/components/ui/toaster"
import { FloatingChatButton } from "@/components/chat/floating-chat-button"
import { ChatCacheProvider } from "@/contexts/chat-cache-context"
import { CurrentEventProvider } from "@/contexts/current-event-context"

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange={false}
    >
      <SessionProvider 
        refetchInterval={0}
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        <CurrentEventProvider>
          <ChatCacheProvider>
            <AuthLayout>
              {children}
              <FloatingChatButton />
            </AuthLayout>
          </ChatCacheProvider>
        </CurrentEventProvider>
      </SessionProvider>
      <Toaster />
    </ThemeProvider>
  )
}