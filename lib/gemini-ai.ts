"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { 
  GeminiAIResponse, 
  ExtractedPlayerInfo,
  AIUsageTracking
} from "@/types/ai-user-types"
import { startAIUsageTracking, completeAIUsageTracking } from "@/lib/api-service"

export class GeminiAIService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.")
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })
  }

  async extractPlayerInfo(file: File, imageIndex: number): Promise<GeminiAIResponse> {
    // AI 사용량 추적 시작
    let trackingId: number | undefined
    let tracking: AIUsageTracking = {
      serviceType: 'GEMINI',
      modelName: 'gemini-2.0-flash-lite', 
      requestType: 'IMAGE_ANALYSIS',
      imageCount: 1,
      sessionId: `session-${Date.now()}`,
      status: 'pending'
    }
    
    try {
      // AI 사용량 추적 시작 API 호출
      const trackingResponse = await startAIUsageTracking({
        serviceType: tracking.serviceType,
        modelName: tracking.modelName,
        requestType: tracking.requestType,
        imageCount: tracking.imageCount,
        sessionId: tracking.sessionId
      })
      
      trackingId = trackingResponse.id
      tracking = {
        ...tracking,
        trackingId,
        status: 'processing',
        startedAt: new Date().toISOString()
      }
      
      console.log(`AI 사용량 추적 시작: trackingId=${trackingId}`)
    } catch (trackingError) {
      console.warn('AI 사용량 추적 시작 실패:', trackingError)
      // 추적 실패 시에도 AI 분석은 계속 진행
    }

    try {
      // 파일을 base64로 변환
      const arrayBuffer = await file.arrayBuffer()
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      const prompt = `
이 Last War: Survival 게임의 연맹원 목록 스크린샷을 분석해주세요.

각 연맹원의 다음 정보를 정확히 추출해주세요:
1. 닉네임 (플레이어 이름) - 한글, 영문, 숫자, 특수문자 포함
2. 전투력 - 예: 21.0M, 30.7M, 1.2B, 500K 등의 형식
3. 레벨 - 숫자만 (예: 24, 25, 30 등)

중요한 규칙:
- 닉네임은 정확히 표시된 그대로 추출하세요
- 전투력은 숫자와 단위(K, M, B)를 포함해서 추출하세요
- 레벨은 숫자만 추출하세요
- 보이지 않거나 불분명한 정보는 추출하지 마세요
- 최대한 정확하게 추출해주세요

출력 형식 (각 플레이어마다 한 줄씩):
**닉네임** / 전투력: XX.XM / 레벨: XX

예시:
**김철수** / 전투력: 21.5M / 레벨: 24
**PlayerName123** / 전투력: 30.7M / 레벨: 25
**연맹장** / 전투력: 1.2B / 레벨: 30
      `.trim()

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }

      const result = await this.model.generateContent([prompt, imagePart])
      const responseText = result.response.text()
      
      const players = this.parseGeminiResponse(responseText, imageIndex)
      
      // AI 처리 성공 시 사용량 추적 완료
      if (trackingId) {
        try {
          await completeAIUsageTracking({
            trackingId,
            successCount: 1,
            failedCount: 0,
            extractedUsersCount: players.length,
            estimatedCostUsd: 0.01 // gemini-2.0-flash-lite의 대략적인 비용 (이미지 1장당)
          })
          console.log(`AI 사용량 추적 완료: trackingId=${trackingId}, 추출된 사용자=${players.length}명`)
        } catch (trackingError) {
          console.warn('AI 사용량 추적 완료 실패:', trackingError)
        }
      }
      
      return {
        success: true,
        players
      }
    } catch (error) {
      console.error("Gemini AI 처리 실패:", error)
      
      let errorMessage = "AI 처리 중 오류가 발생했습니다."
      
      if (error instanceof Error) {
        if (error.message.includes("429") || error.message.includes("quota")) {
          errorMessage = "AI 분석 할당량을 초과했습니다. 잠시 후 다시 시도해주세요. 또는 수동으로 연맹원 정보를 입력해주세요."
        } else if (error.message.includes("rate")) {
          errorMessage = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        } else {
          errorMessage = error.message
        }
      }
      
      // AI 처리 실패 시 사용량 추적 완료 (실패로 기록)
      if (trackingId) {
        try {
          await completeAIUsageTracking({
            trackingId,
            successCount: 0,
            failedCount: 1,
            extractedUsersCount: 0,
            errorMessage
          })
          console.log(`AI 사용량 추적 완료 (실패): trackingId=${trackingId}`)
        } catch (trackingError) {
          console.warn('AI 사용량 추적 실패 기록 실패:', trackingError)
        }
      }
      
      return {
        success: false,
        players: [],
        error: errorMessage
      }
    }
  }

  private parseGeminiResponse(text: string, imageIndex: number): ExtractedPlayerInfo[] {
    const players: ExtractedPlayerInfo[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      // **닉네임** / 전투력: XX.XM / 레벨: XX 형식 파싱
      const match = line.match(/\*\*(.+?)\*\*\s*\/\s*전투력:\s*([0-9.]+[KMB])\s*\/\s*레벨:\s*(\d+)/)
      
      if (match) {
        const nickname = match[1].trim()
        const powerStr = match[2].trim()
        const level = parseInt(match[3])

        // 닉네임 유효성 검사
        if (nickname && nickname.length > 0 && nickname.length <= 20) {
          // 전투력 파싱
          const power = this.parsePowerString(powerStr)
          
          if (power > 0 && level > 0 && level <= 50) {
            players.push({
              nickname,
              power: powerStr,
              level,
              imageIndex
            })
          }
        }
      } else {
        // 다른 형식도 시도해보기
        const altMatch = line.match(/(.+?)\s*[\/\-]\s*([0-9.]+[KMB])\s*[\/\-]\s*(\d+)/)
        if (altMatch) {
          const nickname = altMatch[1].replace(/\*|\*\*/g, '').trim()
          const powerStr = altMatch[2].trim()
          const level = parseInt(altMatch[3])

          if (nickname && nickname.length > 0 && nickname.length <= 20) {
            const power = this.parsePowerString(powerStr)
            
            if (power > 0 && level > 0 && level <= 50) {
              players.push({
                nickname,
                power: powerStr,
                level,
                imageIndex
              })
            }
          }
        }
      }
    }
    
    return players
  }

  private parsePowerString(powerStr: string): number {
    const cleanStr = powerStr.replace(/[^0-9.KMB]/g, '')
    const numberMatch = cleanStr.match(/([0-9.]+)([KMB]?)/)
    
    if (!numberMatch) return 0
    
    const value = parseFloat(numberMatch[1])
    const unit = numberMatch[2]
    
    switch (unit) {
      case 'K':
        return value * 0.001 // K는 0.001M으로 변환
      case 'M':
        return value
      case 'B':
        return value * 1000 // B는 1000M으로 변환
      default:
        return value
    }
  }

  // 배치 처리를 위한 메서드 (사용량 추적 포함)
  async extractPlayersFromImages(files: File[]): Promise<ExtractedPlayerInfo[]> {
    const allPlayers: ExtractedPlayerInfo[] = []
    let batchTrackingId: number | undefined
    
    // 배치 처리 시작 시 전체 이미지 수에 대한 추적 시작
    try {
      const batchTrackingResponse = await startAIUsageTracking({
        serviceType: 'GEMINI',
        modelName: 'gemini-2.0-flash-lite',
        requestType: 'BATCH_IMAGE_ANALYSIS',
        imageCount: files.length,
        sessionId: `batch-session-${Date.now()}`
      })
      
      batchTrackingId = batchTrackingResponse.id
      console.log(`배치 AI 사용량 추적 시작: trackingId=${batchTrackingId}, 이미지 수=${files.length}`)
    } catch (trackingError) {
      console.warn('배치 AI 사용량 추적 시작 실패:', trackingError)
    }
    
    let successCount = 0
    let failedCount = 0
    let totalExtractedUsers = 0
    let batchErrorMessage: string | undefined
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const result = await this.extractPlayerInfo(file, i)
        
        if (result.success) {
          allPlayers.push(...result.players)
          successCount++
          totalExtractedUsers += result.players.length
        } else {
          failedCount++
          if (result.error?.includes("할당량")) {
            batchErrorMessage = result.error
            // 할당량 초과 시 남은 파일들은 처리하지 않음
            console.warn(`할당량 초과로 인해 ${files.length - i}개 파일 처리 중단`)
            failedCount += (files.length - i - 1) // 나머지 파일들도 실패로 카운트
            break
          }
        }
        
        // API 제한을 고려하여 지연 (lite 모델은 더 짧은 지연)
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`파일 ${i + 1} 처리 실패:`, error)
        failedCount++
        
        // 429 에러인 경우 처리 중단
        if (error instanceof Error && (error.message.includes("429") || error.message.includes("quota"))) {
          batchErrorMessage = error.message
          console.warn(`할당량 초과로 인해 ${files.length - i}개 파일 처리 중단`)
          failedCount += (files.length - i - 1) // 나머지 파일들도 실패로 카운트
          break
        }
        
        // 다른 에러는 계속 진행
        continue
      }
    }
    
    // 배치 처리 완료 시 사용량 추적 완료
    if (batchTrackingId) {
      try {
        const estimatedCostUsd = successCount * 0.01 // 성공한 이미지당 대략적인 비용
        await completeAIUsageTracking({
          trackingId: batchTrackingId,
          successCount,
          failedCount,
          extractedUsersCount: totalExtractedUsers,
          estimatedCostUsd,
          errorMessage: batchErrorMessage
        })
        console.log(`배치 AI 사용량 추적 완료: trackingId=${batchTrackingId}, 성공=${successCount}, 실패=${failedCount}, 추출 사용자=${totalExtractedUsers}`)
      } catch (trackingError) {
        console.warn('배치 AI 사용량 추적 완료 실패:', trackingError)
      }
    }
    
    return allPlayers
  }
}