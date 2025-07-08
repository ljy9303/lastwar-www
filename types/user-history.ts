export interface UserHistoryChange {
  old: any
  new: any
}

export interface UserHistoryChanges {
  user_name?: UserHistoryChange
  is_leave?: UserHistoryChange
  user_power?: UserHistoryChange
  user_level?: UserHistoryChange
  [key: string]: UserHistoryChange | undefined
}

export interface UserHistory {
  historyId: number
  userSeq: number
  changes: UserHistoryChanges
  updatedAt: string
}

export interface UserHistoryItem {
  userName: string
  userHistory: UserHistory
}

export interface UserHistoryPagination {
  pageNumber: number
  pageSize: number
  offset: number
  paged: boolean
  unpaged: boolean
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
}

export interface UserHistoryResponse {
  content: UserHistoryItem[]
  pageable: UserHistoryPagination
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface UserHistoryParams {
  page?: number
  size?: number
}

export interface UserNicknameHistoryResponse {
  currentUser: {
    userSeq: number
    name: string
    level: number
    power: number
    leave: boolean
    userGrade: string
    createdAt: string
    updatedAt: string
  } | null
  nicknameHistory: UserHistory[]
  allHistory: UserHistory[]
}

export interface UserSearchResult {
  userSeq: number
  name: string
  level: number
  power: number
  leave: boolean
  userGrade: string
  createdAt: string
  updatedAt: string
}

export interface UserNicknameSearchResponse {
  matchedUsers: UserSearchResult[]
}
