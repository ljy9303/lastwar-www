// 모니터링 관련 타입 정의

export interface ActiveUsersResponse {
  totalActiveUsers: number
  activeUsersByTenant: Record<string, number>
  systemInfo: {
    sessionTimeout: number
    lastUpdated: string
  }
}

export interface UserMonitoringInfo {
  userId: number
  nickname: string  // 백엔드에서 마스킹됨: "테***자"
  serverAllianceId: number
  loginTime: string // ISO datetime
  sessionId: string // 백엔드에서 마스킹됨: "ABC1****456" 
  lastActivity: string // ISO datetime
}

export interface TenantActiveUsersResponse {
  [serverAllianceId: string]: number
}

export interface SessionStatus {
  hasActiveSession: boolean
  sessionInfo?: UserMonitoringInfo
}

// 모니터링 통계 관련 타입
export interface MonitoringStats {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  averageSessionDuration: number
  peakConcurrentUsers: number
  systemUptime: number
}

// 세션 상태 열거형
export enum SessionState {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE', 
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED'
}

// 모니터링 이벤트 타입
export interface MonitoringEvent {
  eventType: 'LOGIN' | 'LOGOUT' | 'TIMEOUT' | 'ACTIVITY'
  userId: number
  serverAllianceId: number
  timestamp: string
  sessionId: string
  details?: Record<string, any>
}

// 모니터링 알림 설정
export interface MonitoringAlert {
  id: string
  type: 'HIGH_LOAD' | 'SESSION_TIMEOUT' | 'SUSPICIOUS_ACTIVITY'
  threshold: number
  enabled: boolean
  recipients: string[]
  message: string
}

// 실시간 모니터링 데이터 타입
export interface RealtimeMonitoringData {
  timestamp: string
  activeUsers: ActiveUsersResponse
  systemMetrics: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkIO: number
  }
  sessionMetrics: {
    newSessions: number
    endedSessions: number
    timeoutSessions: number
  }
}

// 모니터링 차트 데이터 타입
export interface MonitoringChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill?: boolean
  }[]
}

// 모니터링 필터 옵션
export interface MonitoringFilter {
  timeRange: '1h' | '6h' | '24h' | '7d' | 'custom'
  startTime?: string
  endTime?: string
  serverAllianceIds?: number[]
  userIds?: number[]
  sessionStates?: SessionState[]
}