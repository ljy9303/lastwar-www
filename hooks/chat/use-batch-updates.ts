/**
 * 배치 업데이트 훅 - 성능 최적화를 위한 상태 업데이트 배치 처리
 * requestAnimationFrame을 사용하여 브라우저 렌더링 최적화
 */

import { useCallback, useRef, useState } from 'react'

interface BatchUpdate<T> {
  id: string | number
  update: (prev: T) => T
}

interface UseBatchUpdatesOptions {
  batchSize?: number
  maxWaitTime?: number
}

interface UseBatchUpdatesReturn<T> {
  batchedState: T
  addUpdate: (id: string | number, update: (prev: T) => T) => void
  flushUpdates: () => void
  clearBatch: () => void
  getPendingCount: () => number
}

export function useBatchUpdates<T>(
  initialState: T,
  options: UseBatchUpdatesOptions = {}
): UseBatchUpdatesReturn<T> {
  const { batchSize = 10, maxWaitTime = 16 } = options // 16ms = 60fps
  
  const [state, setState] = useState<T>(initialState)
  const batchRef = useRef<BatchUpdate<T>[]>([])
  const rafIdRef = useRef<number | null>(null)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  // 배치 업데이트 실행
  const executeBatch = useCallback(() => {
    if (batchRef.current.length === 0) return

    const updates = [...batchRef.current]
    batchRef.current = []

    // RAF를 사용하여 다음 프레임에서 업데이트 실행
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      setState(currentState => {
        return updates.reduce((acc, { update }) => update(acc), currentState)
      })
      rafIdRef.current = null
    })
  }, [])

  // 업데이트 추가
  const addUpdate = useCallback((id: string | number, update: (prev: T) => T) => {
    // 중복 ID 확인하여 마지막 업데이트만 유지
    const existingIndex = batchRef.current.findIndex(batch => batch.id === id)
    
    if (existingIndex >= 0) {
      batchRef.current[existingIndex] = { id, update }
    } else {
      batchRef.current.push({ id, update })
    }

    // 배치 크기 체크
    if (batchRef.current.length >= batchSize) {
      executeBatch()
      return
    }

    // 타임아웃 설정 (최대 대기 시간)
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }

    timeoutIdRef.current = setTimeout(() => {
      executeBatch()
      timeoutIdRef.current = null
    }, maxWaitTime)
  }, [batchSize, maxWaitTime, executeBatch])

  // 즉시 배치 실행
  const flushUpdates = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
    executeBatch()
  }, [executeBatch])

  // 배치 초기화
  const clearBatch = useCallback(() => {
    batchRef.current = []
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  // 대기 중인 업데이트 수
  const getPendingCount = useCallback(() => {
    return batchRef.current.length
  }, [])

  return {
    batchedState: state,
    addUpdate,
    flushUpdates,
    clearBatch,
    getPendingCount
  }
}

/**
 * 메시지 배치 업데이트 전용 훅
 * 채팅 메시지에 특화된 배치 처리
 */
export function useMessageBatchUpdates<T extends { messageId: number }>(
  initialMessages: T[]
) {
  const {
    batchedState: messages,
    addUpdate,
    flushUpdates,
    clearBatch,
    getPendingCount
  } = useBatchUpdates(initialMessages, {
    batchSize: 5, // 메시지는 작은 배치로 처리
    maxWaitTime: 8 // 더 빠른 응답성
  })

  // 메시지 추가
  const addMessage = useCallback((message: T) => {
    addUpdate(`add-${message.messageId}`, (prev) => [...prev, message])
  }, [addUpdate])

  // 메시지 업데이트
  const updateMessage = useCallback((messageId: number, update: Partial<T>) => {
    addUpdate(`update-${messageId}`, (prev) =>
      prev.map(msg => msg.messageId === messageId ? { ...msg, ...update } : msg)
    )
  }, [addUpdate])

  // 메시지 제거
  const removeMessage = useCallback((messageId: number) => {
    addUpdate(`remove-${messageId}`, (prev) =>
      prev.filter(msg => msg.messageId !== messageId)
    )
  }, [addUpdate])

  // 여러 메시지 추가 (prepend)
  const prependMessages = useCallback((newMessages: T[]) => {
    const batchId = `prepend-${Date.now()}`
    addUpdate(batchId, (prev) => [...newMessages, ...prev])
  }, [addUpdate])

  return {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    prependMessages,
    flushUpdates,
    clearBatch,
    getPendingCount
  }
}