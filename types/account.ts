// Account 관련 타입 정의

export interface Account {
  userId: number
  kakaoId: string
  email?: string
  nickname: string
  name: string
  profileImageUrl?: string
  role: string
  status: string
  label?: UserLabel
  labelDisplayName?: string
  serverAllianceId: number
  serverInfo?: string
  allianceTag?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  registrationComplete: boolean
}

export type UserLabel = 'MASTER' | 'SPONSOR' | 'PREMIUM' | 'MODERATOR' | 'SUPPORTERS'

export interface UserLabelOption {
  value: UserLabel
  displayName: string
}

export interface AccountSearchParams {
  nickname?: string
  email?: string
  label?: UserLabel
  status?: string
  role?: string
  serverAllianceId?: number
  sortBy?: string
  sortOrder?: string
  page?: number
  size?: number
}

export interface AccountLabelUpdate {
  label?: UserLabel
  reason?: string
}

export interface AccountServerAllianceUpdate {
  serverAllianceId: number
  reason?: string
}

export interface ServerAlliance {
  id: number
  serverInfo: string
  allianceTag: string
  displayName: string
}