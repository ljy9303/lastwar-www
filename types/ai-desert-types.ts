// AI 사막전 결과 등록 관련 타입 정의

export type DesertAnalysisType = 'EVENT' | 'ATTENDANCE'

export type DesertRegistrationStep = 
  | 'welcome'
  | 'type-selection'
  | 'image-upload'
  | 'ai-processing'
  | 'validation-editing'
  | 'final-registration'
  | 'registration-complete'

export interface ProcessedDesertImage {
  id: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  data?: DesertBattleResult | DesertAttendanceData
}

export interface DesertBattleResult {
  ourServer: string
  ourAllianceName: string
  ourScore: number
  enemyServer: string
  enemyAllianceName: string
  enemyScore: number
  battleResult: 'WIN' | 'LOSE' | 'DRAW'
  scoreDifference: number
  mvpList: MvpInfo[]
}

export interface MvpInfo {
  category: string
  nickname: string
  originalNickname: string
  score: number
}

export interface DesertAttendanceData {
  attendanceList: AttendanceInfo[]
  summary: {
    totalPlayers: number
    attendedPlayers: number
    attendanceRate: number
  }
}

export interface AttendanceInfo {
  nickname: string
  originalNickname: string
  attendance: boolean
  score: number
  allianceMemberId?: number
  matchStatus?: 'MATCHED' | 'PENDING' | 'FAILED'
}

export interface Desert {
  desertSeq: number
  title: string
  startTime: string
  endTime: string
  status: string
}

export interface DesertAIProgress {
  total: number
  processed: number
  status: 'idle' | 'processing' | 'completed' | 'error'
  currentImage?: string
}

export interface GeminiDesertResponse {
  success: boolean
  error?: string
  data?: DesertBattleResult | DesertAttendanceData
}

export interface DesertRegistrationResult {
  success: boolean
  message: string
  data?: any
}