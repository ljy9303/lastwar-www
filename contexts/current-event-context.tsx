"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface CurrentEvent {
  id: number
  title: string
  returnUrl?: string
}

interface CurrentEventContextType {
  currentEvent: CurrentEvent | null
  setCurrentEvent: (event: CurrentEvent) => void
  clearCurrentEvent: () => void
  navigateToEventPage: (eventId: number, eventTitle: string, targetPage: string) => void
  goBack: () => void
}

const CurrentEventContext = createContext<CurrentEventContextType | undefined>(undefined)

export function CurrentEventProvider({ children }: { children: ReactNode }) {
  const [currentEvent, setCurrentEventState] = useState<CurrentEvent | null>(null)
  const router = useRouter()

  // 페이지 로드 시 세션 스토리지에서 복원
  useEffect(() => {
    const stored = sessionStorage.getItem('currentEvent')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setCurrentEventState(parsed)
      } catch (error) {
        console.error('Failed to parse stored event:', error)
        sessionStorage.removeItem('currentEvent')
      }
    }
  }, [])

  const setCurrentEvent = (event: CurrentEvent) => {
    const eventWithReturn = {
      ...event,
      returnUrl: event.returnUrl || '/events'
    }
    setCurrentEventState(eventWithReturn)
    sessionStorage.setItem('currentEvent', JSON.stringify(eventWithReturn))
  }

  const clearCurrentEvent = () => {
    setCurrentEventState(null)
    sessionStorage.removeItem('currentEvent')
  }

  const navigateToEventPage = (eventId: number, eventTitle: string, targetPage: string) => {
    setCurrentEvent({
      id: eventId,
      title: eventTitle,
      returnUrl: '/events'
    })
    router.push(targetPage)
  }

  const goBack = () => {
    const returnUrl = currentEvent?.returnUrl || '/events'
    clearCurrentEvent()
    router.push(returnUrl)
  }

  return (
    <CurrentEventContext.Provider
      value={{
        currentEvent,
        setCurrentEvent,
        clearCurrentEvent,
        navigateToEventPage,
        goBack
      }}
    >
      {children}
    </CurrentEventContext.Provider>
  )
}

export function useCurrentEvent() {
  const context = useContext(CurrentEventContext)
  if (context === undefined) {
    throw new Error('useCurrentEvent must be used within a CurrentEventProvider')
  }
  return context
}

// 특정 페이지에서 이벤트 ID가 필요한 경우 사용하는 훅
export function useRequiredEvent() {
  const { currentEvent, goBack } = useCurrentEvent()
  const router = useRouter()

  useEffect(() => {
    if (!currentEvent?.id) {
      // 이벤트 ID가 없으면 사막전 관리 페이지로 리다이렉트
      router.push('/events')
    }
  }, [currentEvent, router])

  return {
    eventId: currentEvent?.id || null,
    eventTitle: currentEvent?.title || '',
    goBack
  }
}