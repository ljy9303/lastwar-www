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
