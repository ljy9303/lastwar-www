"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { 
  submitOCRBatchJob, 
  getOCRBatchStatus, 
  cancelOCRBatchJob,
  getOCRBatchResult 
} from "@/lib/api-service"
import type { 
  OCRBatchResponse, 
  OCRBatchStatusResponse, 
  OCRBatchResult,
  OCRBatchStatus,
  OCRProcessingStage,
  OCRErrorMessage,
  OCRPollingConfig
} from "@/types/ai-user-types"

interface UseOCRBatchOptions {
  pollingConfig?: Partial<OCRPollingConfig>
  onProgress?: (progress: { percentage: number; stage: OCRProcessingStage; details?: string }) => void
  onComplete?: (result: OCRBatchResult) => void
  onError?: (error: OCRErrorMessage) => void
}

interface UseOCRBatchReturn {
  // 상태
  isProcessing: boolean
  batchId: string | null
  status: OCRBatchStatus | null
  progress: {
    percentage: number
    stage: OCRProcessingStage | null
    details?: string
    processedImages: number
    totalImages: number
    estimatedTimeRemaining?: number
  }
  result: OCRBatchResult | null
  error: string | null
  
  // 액션
  submitBatch: (images: File[], userGrade: string, options?: {
    autoRegister?: boolean
    skipValidation?: boolean
    overwriteExisting?: boolean
    enableDuplicateCheck?: boolean
  }) => Promise<void>
  cancelBatch: (reason?: string) => Promise<void>
  resetState: () => void
}

export function useOCRBatch(options: UseOCRBatchOptions = {}): UseOCRBatchReturn {
  const { toast } = useToast()
  
  // 기본 폴링 설정
  const defaultPollingConfig: OCRPollingConfig = {
    intervalMs: 2000,        // 2초 간격
    maxAttempts: 150,        // 최대 5분 (2초 * 150회)
    backoffMultiplier: 1.1,  // 점진적 지연 증가
    maxIntervalMs: 5000      // 최대 5초 간격
  }
  
  const pollingConfig = { ...defaultPollingConfig, ...options.pollingConfig }
  
  // 상태 관리
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [status, setStatus] = useState<OCRBatchStatus | null>(null)
  const [progress, setProgress] = useState({
    percentage: 0,
    stage: null as OCRProcessingStage | null,
    details: undefined as string | undefined,
    processedImages: 0,
    totalImages: 0,
    estimatedTimeRemaining: undefined as number | undefined
  })
  const [result, setResult] = useState<OCRBatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 폴링 관련 ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAttemptsRef = useRef(0)
  const currentIntervalRef = useRef(pollingConfig.intervalMs)
  
  // 폴링 정리 함수
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    pollingAttemptsRef.current = 0
    currentIntervalRef.current = pollingConfig.intervalMs
  }, [pollingConfig.intervalMs])
  
  // 상태 업데이트 함수
  const updateProgress = useCallback((statusResponse: OCRBatchStatusResponse) => {
    const { progress: batchProgress, status: batchStatus } = statusResponse
    
    setStatus(batchStatus)
    setProgress({
      percentage: batchProgress.percentage,
      stage: batchProgress.currentStage,
      details: batchProgress.stageDetails,
      processedImages: batchProgress.processedImages,
      totalImages: batchProgress.totalImages,
      estimatedTimeRemaining: statusResponse.estimatedTimeRemaining
    })
    
    // 콜백 호출
    if (options.onProgress) {
      options.onProgress({
        percentage: batchProgress.percentage,
        stage: batchProgress.currentStage,
        details: batchProgress.stageDetails
      })
    }
  }, [options])
  
  // 에러 처리 함수
  const handleError = useCallback((errorMessage: string, errorType?: OCRErrorMessage['type']) => {
    setError(errorMessage)
    setIsProcessing(false)
    clearPolling()
    
    // 사용자 친화적 에러 메시지 생성
    let userFriendlyMessage = errorMessage
    let retryable = false
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('할당량')) {
      userFriendlyMessage = "현재 요청량이 많아 잠시 후 시도해주세요"
      retryable = true
    } else if (errorMessage.includes('daily') || errorMessage.includes('금일') || errorMessage.includes('소진')) {
      userFriendlyMessage = "금일 사용량을 모두 소진되었습니다. 내일 다시 시도해주세요"
      retryable = false
    } else if (errorMessage.includes('503') || errorMessage.includes('과부하')) {
      userFriendlyMessage = "서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요"
      retryable = true
    }
    
    const ocrError: OCRErrorMessage = {
      code: errorType === 'API_LIMIT' ? 'API_LIMIT' : 'UNKNOWN_ERROR',
      message: errorMessage,
      type: errorType || 'SERVER_ERROR',
      userFriendlyMessage,
      retryable
    }
    
    if (options.onError) {
      options.onError(ocrError)
    }
    
    toast({
      title: "OCR 처리 오류",
      description: userFriendlyMessage,
      variant: "destructive",
      duration: retryable ? 8000 : 12000
    })
  }, [options, toast, clearPolling])
  
  // 배치 상태 폴링
  const pollBatchStatus = useCallback(async (currentBatchId: string) => {
    try {
      pollingAttemptsRef.current++
      
      const statusResponse = await getOCRBatchStatus(currentBatchId) as OCRBatchStatusResponse
      
      updateProgress(statusResponse)
      
      // 완료 상태 확인
      if (statusResponse.status === 'COMPLETED') {
        clearPolling()
        setIsProcessing(false)
        
        // 결과 가져오기
        try {
          const batchResult = await getOCRBatchResult(currentBatchId) as OCRBatchResult
          setResult(batchResult)
          
          if (options.onComplete) {
            options.onComplete(batchResult)
          }
          
          // 성공 토스트
          const { registrationResult } = batchResult
          if (registrationResult) {
            const messageParts = []
            if (registrationResult.insertedCount > 0) messageParts.push(`신규 ${registrationResult.insertedCount}명`)
            if (registrationResult.updatedCount > 0) messageParts.push(`업데이트 ${registrationResult.updatedCount}명`)
            if (registrationResult.rejoinedCount > 0) messageParts.push(`재가입 ${registrationResult.rejoinedCount}명`)
            
            toast({
              title: "OCR 배치 처리 완료",
              description: messageParts.length > 0 ? messageParts.join(", ") : `${batchResult.extractedPlayers.length}명 처리 완료`,
              duration: 8000
            })
          }
        } catch (resultError) {
          console.error("결과 조회 실패:", resultError)
          handleError("결과를 가져오는데 실패했습니다.")
        }
        
      } else if (statusResponse.status === 'FAILED') {
        clearPolling()
        setIsProcessing(false)
        handleError(statusResponse.error || "배치 처리가 실패했습니다.")
        
      } else if (statusResponse.status === 'CANCELLED') {
        clearPolling()
        setIsProcessing(false)
        toast({
          title: "배치 처리 취소됨",
          description: "OCR 배치 처리가 취소되었습니다.",
          variant: "default"
        })
        
      } else {
        // 계속 처리 중 - 다음 폴링 스케줄링
        if (pollingAttemptsRef.current < pollingConfig.maxAttempts) {
          pollingIntervalRef.current = setTimeout(() => {
            pollBatchStatus(currentBatchId)
          }, currentIntervalRef.current)
          
          // 백오프 적용
          currentIntervalRef.current = Math.min(
            currentIntervalRef.current * pollingConfig.backoffMultiplier,
            pollingConfig.maxIntervalMs
          )
        } else {
          clearPolling()
          setIsProcessing(false)
          handleError("배치 처리 시간이 초과되었습니다. 상태를 확인해주세요.")
        }
      }
      
    } catch (pollError) {
      console.error("배치 상태 폴링 오류:", pollError)
      
      // 재시도 가능한 에러인지 확인
      if (pollingAttemptsRef.current < pollingConfig.maxAttempts) {
        pollingIntervalRef.current = setTimeout(() => {
          pollBatchStatus(currentBatchId)
        }, currentIntervalRef.current * 2) // 에러 시 더 긴 지연
      } else {
        clearPolling()
        setIsProcessing(false)
        handleError("배치 상태 확인에 실패했습니다.")
      }
    }
  }, [updateProgress, clearPolling, options, toast, pollingConfig, handleError])
  
  // 배치 제출
  const submitBatch = useCallback(async (
    images: File[], 
    userGrade: string, 
    submitOptions?: {
      autoRegister?: boolean
      skipValidation?: boolean
      overwriteExisting?: boolean
      enableDuplicateCheck?: boolean
    }
  ) => {
    try {
      setIsProcessing(true)
      setError(null)
      setResult(null)
      setProgress({
        percentage: 0,
        stage: 'QUEUE_WAITING',
        details: "배치 작업을 제출하는 중...",
        processedImages: 0,
        totalImages: images.length
      })
      
      const response = await submitOCRBatchJob(images, userGrade, submitOptions) as OCRBatchResponse
      
      setBatchId(response.batchId)
      setStatus(response.status)
      
      toast({
        title: "배치 처리 시작됨",
        description: `${images.length}개 이미지의 OCR 배치 처리가 시작되었습니다.`,
        duration: 5000
      })
      
      // 폴링 시작
      pollingAttemptsRef.current = 0
      currentIntervalRef.current = pollingConfig.intervalMs
      
      // 초기 지연 후 폴링 시작
      setTimeout(() => {
        pollBatchStatus(response.batchId)
      }, 1000)
      
    } catch (submitError) {
      console.error("배치 제출 실패:", submitError)
      setIsProcessing(false)
      
      if (submitError instanceof Error) {
        if (submitError.message.includes('429')) {
          handleError(submitError.message, 'API_LIMIT')
        } else if (submitError.message.includes('quota')) {
          handleError(submitError.message, 'QUOTA_EXCEEDED')
        } else {
          handleError(submitError.message, 'SERVER_ERROR')
        }
      } else {
        handleError("배치 작업 제출에 실패했습니다.", 'SERVER_ERROR')
      }
    }
  }, [toast, pollingConfig, pollBatchStatus, handleError])
  
  // 배치 취소
  const cancelBatch = useCallback(async (reason?: string) => {
    if (!batchId) return
    
    try {
      await cancelOCRBatchJob(batchId, reason)
      clearPolling()
      setIsProcessing(false)
      setStatus('CANCELLED')
      
      toast({
        title: "배치 처리 취소됨",
        description: "OCR 배치 처리가 성공적으로 취소되었습니다.",
        variant: "default"
      })
    } catch (cancelError) {
      console.error("배치 취소 실패:", cancelError)
      toast({
        title: "취소 실패",
        description: "배치 처리 취소에 실패했습니다.",
        variant: "destructive"
      })
    }
  }, [batchId, clearPolling, toast])
  
  // 상태 초기화
  const resetState = useCallback(() => {
    clearPolling()
    setIsProcessing(false)
    setBatchId(null)
    setStatus(null)
    setProgress({
      percentage: 0,
      stage: null,
      details: undefined,
      processedImages: 0,
      totalImages: 0,
      estimatedTimeRemaining: undefined
    })
    setResult(null)
    setError(null)
  }, [clearPolling])
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [clearPolling])
  
  return {
    // 상태
    isProcessing,
    batchId,
    status,
    progress,
    result,
    error,
    
    // 액션
    submitBatch,
    cancelBatch,
    resetState
  }
}