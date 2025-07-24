"use client"

import React, { createContext, useContext, useRef, ReactNode } from 'react'

interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userTag?: string
  userLabel?: string
  serverTag?: number
  allianceName?: string
  content: string
  createdAt: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  roomType?: "GLOBAL" | "INQUIRY"
  isMyMessage: boolean
  timeDisplay: string
  hiddenByAdmin?: boolean
  hiddenAt?: string
  hiddenByUserSeq?: number
  hiddenReason?: string
  serverAllianceId: number
}

interface CacheEntry {
  messages: ChatMessage[]
  timestamp: number
  loadedCount: number // 로드된 메시지 수 추적
}

interface ChatCacheContextType {
  getCachedMessages: (roomType: string) => ChatMessage[] | null
  setCachedMessages: (roomType: string, messages: ChatMessage[]) => void
  appendCachedMessages: (roomType: string, newMessages: ChatMessage[]) => void
  addRealtimeMessage: (roomType: string, message: ChatMessage) => void
  updateCachedMessage: (roomType: string, messageId: number, updatedMessage: ChatMessage) => void
  clearCache: (roomType?: string) => void
  getCacheInfo: (roomType: string) => { count: number; timestamp: number } | null
}

const ChatCacheContext = createContext<ChatCacheContextType | undefined>(undefined)

interface ChatCacheProviderProps {
  children: ReactNode
}

const CACHE_EXPIRY_MS = 10 * 60 * 1000 // 10분 캐시 유지
const MAX_CACHE_SIZE = 600 // 최대 캐시 메시지 수 (메모리보다 여유있게 - 500개 + 100개 버퍼)

export function ChatCacheProvider({ children }: ChatCacheProviderProps) {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())

  const getCachedMessages = (roomType: string): ChatMessage[] | null => {
    const entry = cacheRef.current.get(roomType)
    
    if (!entry) return null
    
    // 캐시 만료 체크
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      cacheRef.current.delete(roomType)
      return null
    }
    
    return entry.messages
  }

  const setCachedMessages = (roomType: string, messages: ChatMessage[]) => {
    cacheRef.current.set(roomType, {
      messages: [...messages],
      timestamp: Date.now(),
      loadedCount: messages.length
    })
  }

  const appendCachedMessages = (roomType: string, newMessages: ChatMessage[]) => {
    const entry = cacheRef.current.get(roomType)
    
    if (!entry) {
      setCachedMessages(roomType, newMessages)
      return
    }
    
    // 중복 제거하면서 앞에 추가 (이전 메시지들)
    const existingIds = new Set(entry.messages.map(msg => msg.messageId))
    const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.messageId))
    
    const updatedMessages = [...uniqueNewMessages, ...entry.messages]
    
    cacheRef.current.set(roomType, {
      messages: updatedMessages,
      timestamp: entry.timestamp, // 기존 타임스탬프 유지
      loadedCount: updatedMessages.length
    })
  }

  const updateCachedMessage = (roomType: string, messageId: number, updatedMessage: ChatMessage) => {
    const entry = cacheRef.current.get(roomType)
    
    if (!entry) return
    
    const updatedMessages = entry.messages.map(msg => 
      msg.messageId === messageId ? updatedMessage : msg
    )
    
    cacheRef.current.set(roomType, {
      ...entry,
      messages: updatedMessages
    })
  }

  const clearCache = (roomType?: string) => {
    if (roomType) {
      cacheRef.current.delete(roomType)
    } else {
      cacheRef.current.clear()
    }
  }

  const getCacheInfo = (roomType: string) => {
    const entry = cacheRef.current.get(roomType)
    
    if (!entry) return null
    
    return {
      count: entry.loadedCount,
      timestamp: entry.timestamp
    }
  }

  const addRealtimeMessage = (roomType: string, message: ChatMessage) => {
    const entry = cacheRef.current.get(roomType)
    
    if (!entry) {
      // 캐시가 없으면 새로 생성
      setCachedMessages(roomType, [message])
      return
    }
    
    // 중복 메시지 체크
    const existingIds = new Set(entry.messages.map(msg => msg.messageId))
    if (existingIds.has(message.messageId)) {
      return // 이미 존재하는 메시지는 추가하지 않음
    }
    
    const updatedMessages = [...entry.messages, message]
    
    // FIFO: 250개 한계 체크 후 오래된 메시지 제거
    const finalMessages = updatedMessages.length > MAX_CACHE_SIZE 
      ? updatedMessages.slice(-MAX_CACHE_SIZE) // 마지막 250개만 유지
      : updatedMessages
    
    cacheRef.current.set(roomType, {
      messages: finalMessages,
      timestamp: Date.now(), // 새로운 메시지가 추가되므로 타임스탬프 갱신
      loadedCount: finalMessages.length
    })
  }

  const value: ChatCacheContextType = {
    getCachedMessages,
    setCachedMessages,
    appendCachedMessages,
    addRealtimeMessage,
    updateCachedMessage,
    clearCache,
    getCacheInfo
  }

  return (
    <ChatCacheContext.Provider value={value}>
      {children}
    </ChatCacheContext.Provider>
  )
}

export function useChatCache() {
  const context = useContext(ChatCacheContext)
  if (context === undefined) {
    throw new Error('useChatCache must be used within a ChatCacheProvider')
  }
  return context
}