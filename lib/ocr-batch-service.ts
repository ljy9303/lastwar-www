"use client"

import { useOCRBatch } from "@/hooks/use-ocr-batch"
import type { 
  OCRBatchResult,
  OCRProcessingStage,
  OCRErrorMessage,
  ValidatedPlayerInfo,
  ExtractedPlayerInfo,
  AIProgress
} from "@/types/ai-user-types"

/**
 * OCR 배치 처리 서비스 클래스
 * 기존 GeminiAIService와 동일한 인터페이스를 유지하면서 배치 처리로 전환
 */
export class OCRBatchService {
  private onProgressCallback?: (progress: AIProgress) => void
  private onStageChangeCallback?: (stage: OCRProcessingStage, details?: string) => void
  
  constructor() {
    // 필요시 초기화 로직
  }
  
  /**
   * 진행률 콜백 설정
   */
  setProgressCallback(callback: (progress: AIProgress) => void) {
    this.onProgressCallback = callback
  }
  
  /**
   * 단계 변경 콜백 설정
   */
  setStageChangeCallback(callback: (stage: OCRProcessingStage, details?: string) => void) {
    this.onStageChangeCallback = callback
  }
  
  /**
   * OCR 배치 처리 시작
   * @param images 처리할 이미지 파일 배열
   * @param userGrade 사용자 등급
   * @param options 처리 옵션
   * @returns Promise<ExtractedPlayerInfo[]>
   */
  async processImagesBatch(
    images: File[], 
    userGrade: string,
    options?: {
      autoRegister?: boolean
      skipValidation?: boolean
      overwriteExisting?: boolean
      enableDuplicateCheck?: boolean
    }
  ): Promise<{
    success: boolean
    players: ExtractedPlayerInfo[]
    registrationResult?: {
      insertedCount: number
      updatedCount: number
      rejoinedCount: number
      failedCount: number
      failedNames?: string[]
    }
    error?: string
  }> {
    return new Promise((resolve, reject) => {
      // useOCRBatch 훅을 직접 사용할 수 없으므로 Promise로 래핑
      const processOCR = async () => {
        try {
          const { submitBatch } = useOCRBatch({
            onProgress: (progress) => {
              if (this.onProgressCallback) {
                this.onProgressCallback({
                  total: progress.totalImages || images.length,
                  processed: progress.processedImages || 0,
                  status: 'processing',
                  currentImage: progress.details
                })
              }
              
              if (this.onStageChangeCallback) {
                this.onStageChangeCallback(progress.stage, progress.details)
              }
            },
            onComplete: (result: OCRBatchResult) => {
              // OCRBatchResult를 ExtractedPlayerInfo[]로 변환
              const players: ExtractedPlayerInfo[] = result.extractedPlayers.map((player, index) => ({
                nickname: player.nickname,
                power: player.power,
                level: player.level,
                imageIndex: player.imageIndex || index
              }))
              
              resolve({
                success: true,
                players,
                registrationResult: result.registrationResult
              })
            },
            onError: (error: OCRErrorMessage) => {
              resolve({
                success: false,
                players: [],
                error: error.userFriendlyMessage
              })
            }
          })
          
          await submitBatch(images, userGrade, options)
        } catch (error) {
          reject(error)
        }
      }
      
      processOCR()
    })
  }
  
  /**
   * 기존 extractPlayerInfo 메서드와 호환성을 위한 래퍼
   * @deprecated 단일 이미지 처리는 더 이상 권장되지 않습니다. processImagesBatch를 사용하세요.
   */
  async extractPlayerInfo(file: File, imageIndex: number): Promise<{
    success: boolean
    players: ExtractedPlayerInfo[]
    error?: string
  }> {
    console.warn('[DEPRECATED] extractPlayerInfo는 deprecated되었습니다. processImagesBatch를 사용하세요.')
    
    try {
      // 단일 이미지를 배치 처리로 변환
      const result = await this.processImagesBatch([file], 'R1', {
        autoRegister: false,
        skipValidation: true
      })
      
      return {
        success: result.success,
        players: result.players.map(player => ({
          ...player,
          imageIndex
        })),
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        players: [],
        error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.'
      }
    }
  }
}

/**
 * OCR 배치 처리 결과를 ValidatedPlayerInfo로 변환하는 유틸리티 함수
 */
export function convertOCRResultToValidatedPlayers(
  result: OCRBatchResult
): ValidatedPlayerInfo[] {
  return result.extractedPlayers.map((player, index) => ({
    nickname: player.nickname,
    power: player.power,
    level: player.level,
    imageIndex: player.imageIndex || index,
    isValid: player.isValid,
    errors: player.errors,
    isDuplicate: player.isDuplicate,
    duplicateWith: player.duplicateWith,
    editedNickname: player.editedNickname,
    editedPower: player.editedPower,
    editedLevel: player.editedLevel,
    existenceStatus: player.existenceStatus
  }))
}

/**
 * OCR 처리 단계를 사용자 친화적 메시지로 변환
 */
export function getStageDisplayMessage(stage: OCRProcessingStage, details?: string): string {
  const stageMessages: Record<OCRProcessingStage, string> = {
    'QUEUE_WAITING': '대기열에서 대기 중...',
    'IMAGE_PREPROCESSING': '이미지 전처리 중...',
    'OCR_ANALYSIS': 'AI가 이미지를 분석 중...',
    'DATA_VALIDATION': '추출된 데이터 검증 중...',
    'USER_REGISTRATION': '연맹원 정보 등록 중...',
    'FINALIZING': '처리 완료 중...'
  }
  
  const baseMessage = stageMessages[stage] || '처리 중...'
  return details ? `${baseMessage} (${details})` : baseMessage
}

/**
 * 에러 타입에 따른 재시도 가능성 확인
 */
export function isRetryableError(error: OCRErrorMessage): boolean {
  return error.retryable && (
    error.type === 'API_LIMIT' || 
    error.type === 'SERVER_ERROR'
  )
}

/**
 * 에러 메시지에서 재시도 권장 시간 추출
 */
export function getRetryAfterSeconds(error: OCRErrorMessage): number {
  return error.retryAfterSeconds || (error.type === 'API_LIMIT' ? 60 : 30)
}