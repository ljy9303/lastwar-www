"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { GeminiAIResponse, ExtractedPlayerInfo } from "@/types/ai-user-types"

export class GeminiAIService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.")
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
  }

  async extractPlayerInfo(file: File, imageIndex: number): Promise<GeminiAIResponse> {
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
      
      return {
        success: true,
        players
      }
    } catch (error) {
      console.error("Gemini AI 처리 실패:", error)
      return {
        success: false,
        players: [],
        error: error instanceof Error ? error.message : "AI 처리 중 오류가 발생했습니다."
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

  // 배치 처리를 위한 메서드
  async extractPlayersFromImages(files: File[]): Promise<ExtractedPlayerInfo[]> {
    const allPlayers: ExtractedPlayerInfo[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await this.extractPlayerInfo(file, i)
      
      if (result.success) {
        allPlayers.push(...result.players)
      }
      
      // API 제한을 고려하여 약간의 지연
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return allPlayers
  }
}