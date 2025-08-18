"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { 
  GeminiDesertResponse, 
  DesertBattleResult,
  DesertAttendanceData,
  DesertAnalysisType
} from "@/types/ai-desert-types"
import { startAIUsageTracking, completeAIUsageTracking } from "@/lib/api-service"

export class GeminiDesertAIService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.")
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  }

  async extractDesertData(file: File, analysisType: DesertAnalysisType): Promise<GeminiDesertResponse> {
    // AI 사용량 추적 시작
    let trackingId: number | undefined
    
    try {
      const trackingResponse = await startAIUsageTracking({
        serviceType: 'GEMINI',
        modelName: 'gemini-2.0-flash', 
        requestType: `DESERT_${analysisType}`,
        imageCount: 1
      })
      trackingId = trackingResponse.id
      console.log(`사막전 AI 사용량 추적 시작: trackingId=${trackingId}`)
    } catch (trackingError) {
      console.warn('AI 사용량 추적 시작 실패:', trackingError)
    }

    try {
      // 파일을 base64로 변환
      const arrayBuffer = await file.arrayBuffer()
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      const prompt = analysisType === 'EVENT' 
        ? this.getBattleResultPrompt() 
        : this.getAttendancePrompt()

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }

      const result = await this.model.generateContent([prompt, imagePart])
      const responseText = result.response.text()
      
      console.log('Gemini 원본 응답:', responseText)
      
      const extractedData = analysisType === 'EVENT'
        ? this.parseBattleResultResponse(responseText)
        : this.parseAttendanceResponse(responseText)

      // AI 처리 성공 시 사용량 추적 완료
      if (trackingId) {
        try {
          await completeAIUsageTracking({
            trackingId,
            successCount: 1,
            failedCount: 0,
            extractedUsersCount: analysisType === 'ATTENDANCE' ? 
              (extractedData as DesertAttendanceData)?.attendanceList?.length || 0 : 0,
            processingTimeSeconds: Math.round(performance.now() / 1000)
          })
          console.log(`사막전 AI 사용량 추적 완료: trackingId=${trackingId}`)
        } catch (trackingError) {
          console.warn('AI 사용량 추적 완료 실패:', trackingError)
        }
      }

      return {
        success: true,
        data: extractedData
      }

    } catch (error) {
      console.error('Gemini API 오류:', error)
      
      // AI 처리 실패 시 사용량 추적 완료 (실패)
      if (trackingId) {
        try {
          await completeAIUsageTracking({
            trackingId,
            successCount: 0,
            failedCount: 1,
            extractedUsersCount: 0,
            errorMessage: error instanceof Error ? error.message : '알 수 없는 오류'
          })
        } catch (trackingError) {
          console.warn('AI 사용량 추적 완료 실패:', trackingError)
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      }
    }
  }

  private getBattleResultPrompt(): string {
    return `
이 Last War: Survival 게임의 사막전 결과 스크린샷을 분석해주세요.

다음 정보를 정확히 추출해주세요:

1. 기본 결과 정보:
   - 우리 서버명과 연맹명
   - 우리 점수
   - 상대 서버명과 연맹명  
   - 상대 점수
   - 승부 결과 (승리/패배/무승부)
   - 점수 차이

2. MVP 정보 (있다면):
   - 카테고리 (예: 총 피해량, 치료량, 킬수 등)
   - 플레이어 닉네임
   - 해당 수치

출력 형식은 다음 JSON 구조로 해주세요:
{
  "ourServer": "서버명",
  "ourAllianceName": "연맹명",
  "ourScore": 점수숫자,
  "enemyServer": "상대서버명",
  "enemyAllianceName": "상대연맹명", 
  "enemyScore": 상대점수숫자,
  "battleResult": "WIN|LOSE|DRAW",
  "scoreDifference": 점수차이숫자,
  "mvpList": [
    {
      "category": "카테고리명",
      "nickname": "닉네임",
      "originalNickname": "원본닉네임", 
      "score": 수치
    }
  ]
}

정확한 JSON 형식으로만 응답해주세요.
    `.trim()
  }

  private getAttendancePrompt(): string {
    return `
이 Last War: Survival 게임의 사막전 참석여부 스크린샷을 분석해주세요.

각 플레이어의 다음 정보를 추출해주세요:
- 닉네임
- 참석 여부 (참석했으면 true, 안했으면 false)
- 점수/기여도 (있다면)

출력 형식은 다음 JSON 구조로 해주세요:
{
  "attendanceList": [
    {
      "nickname": "닉네임",
      "originalNickname": "원본닉네임",
      "attendance": true/false,
      "score": 점수숫자
    }
  ],
  "summary": {
    "totalPlayers": 총플레이어수,
    "attendedPlayers": 참석플레이어수,
    "attendanceRate": 참석률퍼센트
  }
}

정확한 JSON 형식으로만 응답해주세요.
    `.trim()
  }

  private parseBattleResultResponse(responseText: string): DesertBattleResult {
    try {
      // JSON 부분만 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("JSON 형식을 찾을 수 없습니다.")
      }

      const jsonText = jsonMatch[0]
      const parsed = JSON.parse(jsonText)

      return {
        ourServer: (parsed.ourServer || "").replace(/^#/, "").trim(), // '#' 문자 제거
        ourAllianceName: parsed.ourAllianceName || "",
        ourScore: Number(parsed.ourScore) || 0,
        enemyServer: (parsed.enemyServer || "").replace(/^#/, "").trim(), // '#' 문자 제거
        enemyAllianceName: parsed.enemyAllianceName || "",
        enemyScore: Number(parsed.enemyScore) || 0,
        battleResult: parsed.battleResult || "DRAW",
        scoreDifference: Number(parsed.scoreDifference) || 0,
        mvpList: Array.isArray(parsed.mvpList) ? parsed.mvpList.map((mvp: any) => ({
          category: mvp.category || "",
          nickname: mvp.nickname || "",
          originalNickname: mvp.originalNickname || mvp.nickname || "",
          score: Number(mvp.score) || 0
        })) : []
      }
    } catch (error) {
      console.error('사막전 결과 파싱 오류:', error)
      throw new Error("AI 응답을 파싱할 수 없습니다.")
    }
  }

  private parseAttendanceResponse(responseText: string): DesertAttendanceData {
    try {
      // JSON 부분만 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("JSON 형식을 찾을 수 없습니다.")
      }

      const jsonText = jsonMatch[0]
      const parsed = JSON.parse(jsonText)

      const attendanceList = Array.isArray(parsed.attendanceList) 
        ? parsed.attendanceList.map((item: any) => ({
            nickname: item.nickname || "",
            originalNickname: item.originalNickname || item.nickname || "",
            attendance: Boolean(item.attendance),
            score: Number(item.score) || 0
          }))
        : []

      const attendedCount = attendanceList.filter(item => item.attendance).length
      const totalCount = attendanceList.length

      return {
        attendanceList,
        summary: {
          totalPlayers: totalCount,
          attendedPlayers: attendedCount,
          attendanceRate: totalCount > 0 ? (attendedCount / totalCount) * 100 : 0
        }
      }
    } catch (error) {
      console.error('참석여부 파싱 오류:', error)
      throw new Error("AI 응답을 파싱할 수 없습니다.")
    }
  }
}