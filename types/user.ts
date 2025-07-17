export interface User {
  id: number
  userSeq: number
  name: string
  level: number
  power: number
  leave: boolean
  userGrade: string
  createdAt: string
  updatedAt: string
}

export interface UserCreateRequest {
  name: string
  level: number
  power?: number
  leave?: boolean
  userGrade?: string
}

export interface UserUpdateRequest {
  name?: string
  level?: number
  power?: number
  leave?: boolean
  userGrade?: string
}

export interface UserSearchParams {
  leave?: boolean
  minLevel?: number
  maxLevel?: number
  name?: string
  power?: number
  userGrade?: string
}

export interface UserHistory {
  historyId: number
  userSeq: number
  changes: Record<string, any>
  updatedAt: string
}

export interface UserPowerHistory {
  power: number
  updatedAt: string
}

export interface UserDesertStats {
  totalDeserts: number
  attendedDeserts: number
  attendanceRate: number
  averagePosition: number
}

export interface UserDesertRecord {
  desertSeq: number
  desertTitle: string
  eventDate: string // LocalDate는 문자열로 전송됨
  userSeq: number
  userName: string
  position: number | null
  intentType: string | null  // 사전조사에서 희망한 타입
  desertType: string | null  // 스쿼드에서 확정된 타입
  participated: boolean
}

export interface UserDetailResponse {
  user: User
  history: UserHistory[]
  powerHistory: UserPowerHistory[]
  desertStats: UserDesertStats
}

export interface GradeStatistics {
  count: number
  maxUsers: number
  hasLimit: boolean
  available: number
  percentage: number
}

export interface GradeStatisticsResponse {
  totalUsers: number
  gradeDistribution: {
    R5: GradeStatistics
    R4: GradeStatistics
    R3: GradeStatistics
    R2: GradeStatistics
    R1: GradeStatistics
  }
}
