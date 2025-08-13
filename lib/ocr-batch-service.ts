"use client"

import { 
  submitOCRBatchJob, 
  getOCRBatchStatus, 
  cancelOCRBatchJob,
  getOCRBatchResult 
} from './api-service'
import { 
  OCRBatchRequest,
  OCRBatchResponse,
  OCRBatchStatusResponse,
  OCRBatchResult,
  OCRPollingConfig,
  OCRErrorMessage,
  ValidatedPlayerInfo
} from '@/types/ai-user-types'

/**
 * OCR 배치 처리 서비스
 * 이미지 업로드, 상태 추적, 결과 조회를 관리
 */
export class OCRBatchService {
  private static instance: OCRBatchService
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  
  // 기본 폴링 설정
  private defaultPollingConfig: OCRPollingConfig = {
    intervalMs: 2000, // 2초 간격
    maxAttempts: 150, // 최대 5분 (2초 * 150 = 300초)
    backoffMultiplier: 1.2, // 점진적 지연 증가
    maxIntervalMs: 5000, // 최대 5초 간격
  }

  private constructor() {}

  static getInstance(): OCRBatchService {
    if (!OCRBatchService.instance) {
      OCRBatchService.instance = new OCRBatchService()
    }
    return OCRBatchService.instance
  }

  /**
   * OCR 배치 작업 제출
   */
  async submitBatch(request: OCRBatchRequest): Promise<OCRBatchResponse> {
    try {
      const response = await submitOCRBatchJob(
        request.images, 
        request.userGrade, 
        request.options
      )
      
      console.log('[OCR] 배치 작업 제출 완료:', response)
      return response
    } catch (error) {
      console.error('[OCR] 배치 작업 제출 실패:', error)
      throw this.parseError(error)
    }
  }

  /**
   * 배치 상태 조회
   */
  async getBatchStatus(batchId: string): Promise<OCRBatchStatusResponse> {
    try {
      const response = await getOCRBatchStatus(batchId)
      return response
    } catch (error) {
      console.error('[OCR] 배치 상태 조회 실패:', error)
      throw this.parseError(error)
    }
  }

  /**
   * 배치 결과 조회
   */
  async getBatchResult(batchId: string): Promise<OCRBatchResult> {
    try {
      const response = await getOCRBatchResult(batchId)
      return response
    } catch (error) {
      console.error('[OCR] 배치 결과 조회 실패:', error)
      throw this.parseError(error)
    }
  }

  /**
   * 배치 작업 취소
   */
  async cancelBatch(batchId: string, reason?: string): Promise<void> {
    try {
      await cancelOCRBatchJob(batchId, reason)
      this.stopPolling(batchId)
      console.log('[OCR] 배치 작업 취소 완료:', batchId)
    } catch (error) {
      console.error('[OCR] 배치 작업 취소 실패:', error)
      throw this.parseError(error)
    }
  }

  /**
   * 상태 폴링 시작
   */
  startPolling(
    batchId: string,
    onUpdate: (status: OCRBatchStatusResponse) => void,
    onComplete: (result: OCRBatchResult) => void,
    onError: (error: OCRErrorMessage) => void,
    config?: Partial<OCRPollingConfig>
  ): void {
    // 기존 폴링 중지
    this.stopPolling(batchId)

    const pollingConfig = { ...this.defaultPollingConfig, ...config }
    let attempt = 0
    let currentInterval = pollingConfig.intervalMs

    const poll = async () => {
      try {
        attempt++
        console.log(`[OCR] 폴링 시도 ${attempt}/${pollingConfig.maxAttempts} - ${batchId}`)

        const status = await this.getBatchStatus(batchId)
        onUpdate(status)

        // 완료된 경우
        if (status.status === 'COMPLETED') {
          this.stopPolling(batchId)
          try {
            const result = await this.getBatchResult(batchId)
            onComplete(result)
          } catch (resultError) {
            console.error('[OCR] 결과 조회 실패:', resultError)
            onError(this.parseError(resultError))
          }
          return
        }

        // 실패한 경우
        if (status.status === 'FAILED' || status.status === 'CANCELLED') {
          this.stopPolling(batchId)
          onError({
            code: status.status,
            message: status.error || '작업이 실패했습니다.',
            type: 'SERVER_ERROR',
            userFriendlyMessage: status.status === 'CANCELLED' 
              ? '작업이 취소되었습니다.' 
              : '처리 중 오류가 발생했습니다.',
            retryable: status.status === 'FAILED'
          })
          return
        }

        // 최대 시도 횟수 초과
        if (attempt >= pollingConfig.maxAttempts) {
          this.stopPolling(batchId)
          onError({
            code: 'TIMEOUT',
            message: '작업 완료 대기 시간이 초과되었습니다.',
            type: 'SERVER_ERROR',
            userFriendlyMessage: '처리 시간이 예상보다 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요.',
            retryable: true
          })
          return
        }

        // 다음 폴링 스케줄링 (백오프 적용)
        currentInterval = Math.min(
          currentInterval * pollingConfig.backoffMultiplier,
          pollingConfig.maxIntervalMs
        )

        const timeoutId = setTimeout(poll, currentInterval)
        this.pollingIntervals.set(batchId, timeoutId)

      } catch (error) {
        console.error('[OCR] 폴링 중 오류:', error)
        
        // 일시적 네트워크 오류는 계속 재시도
        if (attempt < pollingConfig.maxAttempts) {
          const timeoutId = setTimeout(poll, currentInterval * 2) // 오류시 대기 시간 증가
          this.pollingIntervals.set(batchId, timeoutId)
        } else {
          this.stopPolling(batchId)
          onError(this.parseError(error))
        }
      }
    }

    // 첫 번째 폴링 시작
    poll()
  }

  /**
   * 폴링 중지
   */
  stopPolling(batchId: string): void {
    const timeoutId = this.pollingIntervals.get(batchId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.pollingIntervals.delete(batchId)
      console.log('[OCR] 폴링 중지:', batchId)
    }
  }

  /**
   * 모든 폴링 중지
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((timeoutId, batchId) => {
      clearTimeout(timeoutId)
      console.log('[OCR] 폴링 중지:', batchId)
    })
    this.pollingIntervals.clear()
  }

  /**
   * 현재 폴링 중인 작업들
   */
  getActivePolling(): string[] {
    return Array.from(this.pollingIntervals.keys())
  }

  /**
   * 에러 파싱 및 사용자 친화적 메시지 생성
   */
  private parseError(error: unknown): OCRErrorMessage {
    console.error('[OCR] 에러 파싱:', error)

    if (error instanceof Error) {
      const errorWithStatus = error as Error & { status?: number; data?: any }
      
      // API 제한 에러 처리
      if (errorWithStatus.status === 429 || 
          errorWithStatus.message.includes('quota') ||
          errorWithStatus.message.includes('limit')) {
        return {
          code: 'QUOTA_EXCEEDED',
          message: errorWithStatus.message,
          type: 'QUOTA_EXCEEDED',
          userFriendlyMessage: 'API 사용량이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
          retryable: true,
          retryAfterSeconds: 60
        }
      }

      // 서버 에러
      if (errorWithStatus.status && errorWithStatus.status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: errorWithStatus.message,
          type: 'SERVER_ERROR',
          userFriendlyMessage: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          retryable: true
        }
      }

      // 클라이언트 에러 (4xx)
      if (errorWithStatus.status && errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
        return {
          code: 'VALIDATION_ERROR',
          message: errorWithStatus.message,
          type: 'VALIDATION_ERROR',
          userFriendlyMessage: errorWithStatus.message || '요청 데이터에 문제가 있습니다.',
          retryable: false
        }
      }

      // 일반 에러
      return {
        code: 'UNKNOWN_ERROR',
        message: errorWithStatus.message,
        type: 'SERVER_ERROR',
        userFriendlyMessage: '예기치 못한 오류가 발생했습니다.',
        retryable: true
      }
    }

    // 알 수 없는 에러
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      type: 'SERVER_ERROR',
      userFriendlyMessage: '예기치 못한 오류가 발생했습니다.',
      retryable: true
    }
  }

  /**
   * 이미지 파일 유효성 검사
   */
  validateImages(images: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxImages = 20

    if (images.length === 0) {
      errors.push('최소 1개 이상의 이미지를 업로드해야 합니다.')
      return { valid: false, errors }
    }

    if (images.length > maxImages) {
      errors.push(`최대 ${maxImages}개까지만 업로드할 수 있습니다.`)
    }

    images.forEach((image, index) => {
      if (!allowedTypes.includes(image.type)) {
        errors.push(`${index + 1}번째 이미지: 지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 지원)`)
      }

      if (image.size > maxSize) {
        errors.push(`${index + 1}번째 이미지: 파일 크기가 너무 큽니다. (최대 10MB)`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  /**
   * 배치 처리 진행률 계산
   */
  calculateProgress(status: OCRBatchStatusResponse): number {
    if (!status.progress) return 0

    const { processedImages, totalImages } = status.progress
    if (totalImages === 0) return 0

    return Math.round((processedImages / totalImages) * 100)
  }

  /**
   * 예상 완료 시간 계산 (밀리초)
   */
  estimateCompletionTime(status: OCRBatchStatusResponse): number | null {
    if (!status.progress || status.estimatedTimeRemaining === undefined) {
      return null
    }

    return status.estimatedTimeRemaining * 1000 // 초를 밀리초로 변환
  }

  /**
   * 사용자 친화적 상태 메시지 생성
   */
  getStatusMessage(status: OCRBatchStatusResponse): string {
    switch (status.status) {
      case 'PENDING':
        return '작업 대기 중...'
      case 'PROCESSING':
        if (status.progress) {
          const { currentImageIndex, totalImages, currentStage } = status.progress
          const stageMessage = this.getStageMessage(currentStage)
          return `${stageMessage} (${currentImageIndex + 1}/${totalImages})`
        }
        return '처리 중...'
      case 'COMPLETED':
        return '처리 완료'
      case 'FAILED':
        return '처리 실패'
      case 'CANCELLED':
        return '작업 취소됨'
      default:
        return '알 수 없는 상태'
    }
  }

  /**
   * 처리 단계별 메시지
   */
  private getStageMessage(stage: string): string {
    switch (stage) {
      case 'QUEUE_WAITING':
        return '대기열에서 대기 중'
      case 'IMAGE_PREPROCESSING':
        return '이미지 전처리 중'
      case 'OCR_ANALYSIS':
        return 'OCR 분석 중'
      case 'DATA_VALIDATION':
        return '데이터 검증 중'
      case 'USER_REGISTRATION':
        return '사용자 등록 중'
      case 'FINALIZING':
        return '마무리 중'
      default:
        return '처리 중'
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const ocrBatchService = OCRBatchService.getInstance()

// 컴포넌트 언마운트 시 정리를 위한 헬퍼
export const useOCRBatchCleanup = () => {
  if (typeof window !== 'undefined') {
    const cleanup = () => {
      ocrBatchService.stopAllPolling()
    }

    window.addEventListener('beforeunload', cleanup)
    return () => {
      window.removeEventListener('beforeunload', cleanup)
      cleanup()
    }
  }
  return () => {}
}