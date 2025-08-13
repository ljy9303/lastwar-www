"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  OCRBatchRequest,
  OCRBatchResponse,
  OCRBatchStatusResponse,
  OCRBatchResult,
  OCRErrorMessage,
  ValidatedPlayerInfo,
  OCRPollingConfig
} from '@/types/ai-user-types'
import { ocrBatchService, useOCRBatchCleanup } from '@/lib/ocr-batch-service'

export interface UseOCRBatchOptions {
  onComplete?: (result: OCRBatchResult) => void
  onError?: (error: OCRErrorMessage) => void
  onProgress?: (status: OCRBatchStatusResponse) => void
  pollingConfig?: Partial<OCRPollingConfig>
  autoCleanup?: boolean
}

export interface UseOCRBatchState {
  // 현재 상태
  batchId: string | null
  status: OCRBatchStatusResponse | null
  result: OCRBatchResult | null
  error: OCRErrorMessage | null
  
  // UI 상태
  isSubmitting: boolean
  isProcessing: boolean
  isCompleted: boolean
  isFailed: boolean
  isCancelled: boolean
  
  // 진행 상태
  progress: number
  statusMessage: string
  estimatedTimeRemaining: number | null
  
  // 메타데이터
  startTime: Date | null
  endTime: Date | null
  processingDuration: number | null
}

export interface UseOCRBatchActions {
  submitBatch: (request: OCRBatchRequest) => Promise<void>
  cancelBatch: (reason?: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  validateImages: (images: File[]) => { valid: boolean; errors: string[] }
}

export interface UseOCRBatchReturn {
  state: UseOCRBatchState
  actions: UseOCRBatchActions
}

/**
 * OCR 배치 처리를 위한 커스텀 훅
 * 
 * @param options 설정 옵션
 * @returns 상태와 액션들
 */
export function useOCRBatch(options: UseOCRBatchOptions = {}): UseOCRBatchReturn {
  // 옵션 기본값 설정
  const {
    onComplete,
    onError,
    onProgress,
    pollingConfig,
    autoCleanup = true
  } = options

  // 상태 관리
  const [batchId, setBatchId] = useState<string | null>(null)
  const [status, setStatus] = useState<OCRBatchStatusResponse | null>(null)
  const [result, setResult] = useState<OCRBatchResult | null>(null)
  const [error, setError] = useState<OCRErrorMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  // 이전 요청 추적용
  const lastRequestRef = useRef<OCRBatchRequest | null>(null)

  // 자동 정리 설정
  const cleanup = useOCRBatchCleanup()
  useEffect(() => {
    if (autoCleanup) {
      return cleanup
    }
  }, [autoCleanup, cleanup])

  // 파생된 상태들
  const isProcessing = status?.status === 'PROCESSING' || status?.status === 'PENDING'
  const isCompleted = status?.status === 'COMPLETED'
  const isFailed = status?.status === 'FAILED'
  const isCancelled = status?.status === 'CANCELLED'
  const progress = status ? ocrBatchService.calculateProgress(status) : 0
  const statusMessage = status ? ocrBatchService.getStatusMessage(status) : ''
  const estimatedTimeRemaining = status ? ocrBatchService.estimateCompletionTime(status) : null
  
  const processingDuration = startTime && endTime 
    ? endTime.getTime() - startTime.getTime() 
    : startTime && isProcessing 
    ? Date.now() - startTime.getTime() 
    : null

  // 상태 업데이트 핸들러
  const handleStatusUpdate = useCallback((newStatus: OCRBatchStatusResponse) => {
    console.log('[OCR Hook] 상태 업데이트:', newStatus)
    setStatus(newStatus)
    setError(null) // 상태 업데이트 시 에러 클리어
    onProgress?.(newStatus)
  }, [onProgress])

  // 완료 핸들러
  const handleComplete = useCallback((newResult: OCRBatchResult) => {
    console.log('[OCR Hook] 처리 완료:', newResult)
    setResult(newResult)
    setEndTime(new Date())
    setIsSubmitting(false)
    onComplete?.(newResult)
  }, [onComplete])

  // 에러 핸들러
  const handleError = useCallback((newError: OCRErrorMessage) => {
    console.error('[OCR Hook] 에러 발생:', newError)
    setError(newError)
    setEndTime(new Date())
    setIsSubmitting(false)
    onError?.(newError)
  }, [onError])

  // 배치 작업 제출
  const submitBatch = useCallback(async (request: OCRBatchRequest) => {
    try {
      console.log('[OCR Hook] 배치 작업 제출 시작:', request)
      
      // 상태 초기화
      setIsSubmitting(true)
      setError(null)
      setResult(null)
      setStatus(null)
      setBatchId(null)
      setStartTime(new Date())
      setEndTime(null)
      
      // 이전 요청 저장
      lastRequestRef.current = request

      // 이미지 유효성 검사
      const validation = ocrBatchService.validateImages(request.images)
      if (!validation.valid) {
        throw {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join(', '),
          type: 'VALIDATION_ERROR',
          userFriendlyMessage: validation.errors.join('\n'),
          retryable: false
        } as OCRErrorMessage
      }

      // 배치 작업 제출
      const response = await ocrBatchService.submitBatch(request)
      console.log('[OCR Hook] 배치 작업 제출 완료:', response)
      
      setBatchId(response.batchId)

      // 폴링 시작
      ocrBatchService.startPolling(
        response.batchId,
        handleStatusUpdate,
        handleComplete,
        handleError,
        pollingConfig
      )

    } catch (error) {
      console.error('[OCR Hook] 배치 작업 제출 실패:', error)
      setIsSubmitting(false)
      setEndTime(new Date())
      
      // 에러 타입 확인 후 처리
      if (error && typeof error === 'object' && 'code' in error) {
        handleError(error as OCRErrorMessage)
      } else {
        handleError({
          code: 'SUBMIT_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'SERVER_ERROR',
          userFriendlyMessage: '작업 제출 중 오류가 발생했습니다.',
          retryable: true
        })
      }
    }
  }, [handleStatusUpdate, handleComplete, handleError, pollingConfig])

  // 배치 작업 취소
  const cancelBatch = useCallback(async (reason?: string) => {
    if (!batchId) {
      console.warn('[OCR Hook] 취소할 배치 ID가 없습니다')
      return
    }

    try {
      console.log('[OCR Hook] 배치 작업 취소 시작:', batchId)
      await ocrBatchService.cancelBatch(batchId, reason)
      console.log('[OCR Hook] 배치 작업 취소 완료')
      
      setEndTime(new Date())
      setIsSubmitting(false)
      
    } catch (error) {
      console.error('[OCR Hook] 배치 작업 취소 실패:', error)
      handleError({
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : '취소 중 오류 발생',
        type: 'SERVER_ERROR',
        userFriendlyMessage: '작업 취소 중 오류가 발생했습니다.',
        retryable: false
      })
    }
  }, [batchId, handleError])

  // 상태 리셋
  const reset = useCallback(() => {
    console.log('[OCR Hook] 상태 리셋')
    
    // 진행 중인 폴링 중지
    if (batchId) {
      ocrBatchService.stopPolling(batchId)
    }

    setBatchId(null)
    setStatus(null)
    setResult(null)
    setError(null)
    setIsSubmitting(false)
    setStartTime(null)
    setEndTime(null)
    lastRequestRef.current = null
  }, [batchId])

  // 재시도
  const retry = useCallback(async () => {
    if (!lastRequestRef.current) {
      console.warn('[OCR Hook] 재시도할 이전 요청이 없습니다')
      return
    }

    console.log('[OCR Hook] 재시도 시작')
    await submitBatch(lastRequestRef.current)
  }, [submitBatch])

  // 이미지 유효성 검사
  const validateImages = useCallback((images: File[]) => {
    return ocrBatchService.validateImages(images)
  }, [])

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (batchId) {
        ocrBatchService.stopPolling(batchId)
      }
    }
  }, [batchId])

  // 디버깅을 위한 로그
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[OCR Hook] 상태 변경:', {
        batchId,
        status: status?.status,
        progress,
        isSubmitting,
        isProcessing,
        isCompleted,
        isFailed,
        error: error?.code
      })
    }
  }, [batchId, status, progress, isSubmitting, isProcessing, isCompleted, isFailed, error])

  return {
    state: {
      batchId,
      status,
      result,
      error,
      isSubmitting,
      isProcessing,
      isCompleted,
      isFailed,
      isCancelled,
      progress,
      statusMessage,
      estimatedTimeRemaining,
      startTime,
      endTime,
      processingDuration
    },
    actions: {
      submitBatch,
      cancelBatch,
      reset,
      retry,
      validateImages
    }
  }
}