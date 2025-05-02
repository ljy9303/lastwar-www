export interface User {
  id: number
  userSeq: number
  name: string
  level: number
  power: number
  leave: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCreateRequest {
  name: string
  level: number
  power?: number
  leave?: boolean
}

export interface UserUpdateRequest {
  name?: string
  level?: number
  power?: number
  leave?: boolean
}

export interface UserSearchParams {
  leave?: boolean
  minLevel?: number
  maxLevel?: number
  name?: string
  power?: number
}
