import { getSession, signOut } from "next-auth/react"
import { getServerSession } from "next-auth/next"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.chunsik.site"

// 세션 캐싱 제거하고 간단한 방식으로 변경

export async function fetchFromAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const method = options.method || 'GET'
  
  // 개발 모드에서만 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FRONTEND] API 요청 시작 - ${method} ${endpoint}`, options.body ? { body: options.body } : '')
  }

  try {
    // NextAuth 세션에서 액세스 토큰 가져오기
    let session
    if (typeof window === 'undefined') {
      // 서버 사이드에서는 getServerSession 사용
      const { authOptions } = await import('../app/api/auth/[...nextauth]/route')
      session = await getServerSession(authOptions)
    } else {
      // 클라이언트 사이드에서는 직접 getSession 사용
      session = await getSession()
    }
    
    const authHeaders: Record<string, string> = {}
    
    if (session?.accessToken) {
      authHeaders.Authorization = `Bearer ${session.accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      // 401 Unauthorized - 토큰 만료 또는 인증 실패
      if (response.status === 401) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[FRONTEND] 인증 토큰 만료 - ${method} ${endpoint}, 로그인 페이지로 이동`)
        }
        
        // 클라이언트 사이드에서만 signOut 호출
        if (typeof window !== 'undefined') {
          await signOut({ 
            callbackUrl: '/login',
            redirect: true 
          })
        }
        
        // 서버사이드에서는 에러만 던지기
        const error = new Error('인증이 만료되었습니다. 다시 로그인해주세요.') as Error & { status?: number; data?: any }
        error.status = 401
        throw error
      }
      
      let errorMessage = `API 요청 실패: ${response.status} ${response.statusText}`
      let errorData: any = {} // 타입을 명시적으로 any로 설정하거나 적절한 타입으로 정의
      try {
        errorData = await response.json()
        if (errorData && typeof errorData === "object" && "message" in errorData) {
          errorMessage = errorData.message as string
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본 메시지 사용
      }
      const error = new Error(errorMessage) as Error & { status?: number; data?: any }
      error.status = response.status
      error.data = errorData
      throw error
    }

    if (response.status === 204) {
      return {} as T // 204 No Content 응답 시 빈 객체 반환
    }

    // 응답 본문이 비어있는지 확인
    const contentLength = response.headers.get('content-length')
    if (contentLength === '0') {
      return {} as T
    }

    try {
      const text = await response.text()
      if (!text || text.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[FRONTEND] API 응답 성공 - ${method} ${endpoint} (빈 응답)`)
        }
        return {} as T
      }
      const data = JSON.parse(text)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FRONTEND] API 응답 성공 - ${method} ${endpoint}`, data)
      }
      return data
    } catch (parseError) {
      console.error(`[FRONTEND] API 응답 파싱 오류 - ${method} ${endpoint}:`, parseError)
      return {} as T
    }
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      // 이미 처리된 HTTP 에러는 그대로 전달
      if (process.env.NODE_ENV === 'development') {
        console.error(`[FRONTEND] API 오류 - ${method} ${endpoint}:`, error.message)
      }
      throw error
    }
    // 네트워크 에러 등 다른 에러 처리
    if (process.env.NODE_ENV === 'development') {
      console.error(`[FRONTEND] API 네트워크 오류 - ${method} ${endpoint}:`, error)
    }
    throw new Error(`API 요청 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function buildQueryString(params: Record<string, any>): string {
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")

  return queryParams ? `?${queryParams}` : ""
}

// Desert API functions
export async function getDesertById(desertSeq: number) {
  return fetchFromAPI(`/desert/${desertSeq}`)
}

export async function updateDesert(desertSeq: number, data: {
  title?: string
  eventDate?: string
  deleted?: boolean
}) {
  return fetchFromAPI(`/desert/${desertSeq}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  })
}

// User Detail API functions
export async function getUserDetail(userSeq: number) {
  return fetchFromAPI(`/user/${userSeq}/detail`)
}

export async function getUserHistory(userSeq: number, page: number = 0, size: number = 10) {
  return fetchFromAPI(`/user/${userSeq}/history?page=${page}&size=${size}`)
}

export async function getUserPowerHistory(userSeq: number) {
  return fetchFromAPI(`/user/${userSeq}/power-history`)
}

export async function getUserDesertStats(userSeq: number) {
  return fetchFromAPI(`/user/${userSeq}/desert-stats`)
}

export async function getUserDesertRecords(userSeq: number, page: number = 0, size: number = 5) {
  return fetchFromAPI(`/user/${userSeq}/desert-records?page=${page}&size=${size}`)
}

// User batch creation
export async function createUsersBatch(users: any[]) {
  return fetchFromAPI('/user/batch', {
    method: 'POST',
    body: JSON.stringify(users)
  })
}

// User duplicate check
export async function checkDuplicateUsers(params: {
  nickname?: string
  power?: number
  level?: number
  powerRange?: number
  levelRange?: number
  similarityThreshold?: number
  includeHistory?: boolean
}) {
  const queryString = buildQueryString(params)
  return fetchFromAPI(`/user/duplicate-check?${queryString}`)
}

// User batch upsert
export async function upsertUsersBatch(users: any[]) {
  return fetchFromAPI('/user/batch-upsert', {
    method: 'POST',
    body: JSON.stringify(users)
  })
}

// User auto upsert (insert if new, update if exists)
export async function autoUpsertUsers(users: any[]) {
  return fetchFromAPI('/user/auto-upsert', {
    method: 'POST',
    body: JSON.stringify(users)
  })
}

// Dashboard API functions - 통합 통계 API
export async function getDashboardStats() {
  return fetchFromAPI('/dashboard/stats')
}

export async function refreshDashboardStats() {
  return fetchFromAPI('/dashboard/stats/refresh', {
    method: 'POST'
  })
}

// User Grade Statistics API functions
export async function getUserGradeStatistics() {
  return fetchFromAPI('/user/grades/statistics')
}

export async function getUsersByGrade(grade: string) {
  return fetchFromAPI(`/user/grades/${grade}`)
}

// 기존 개별 통계 API (하위 호환성 유지) - DEPRECATED
/**
 * @deprecated 이 함수는 더 이상 사용되지 않습니다. getDashboardStats()를 사용하세요.
 * @see getDashboardStats
 */
export async function getUserStats() {
  console.warn('[DEPRECATED] getUserStats()는 deprecated되었습니다. getDashboardStats()를 사용하세요.')
  return fetchFromAPI('/user/stats')
}

/**
 * @deprecated 이 함수는 더 이상 사용되지 않습니다. getDashboardStats()를 사용하세요.
 * @see getDashboardStats
 */
export async function getDesertStats() {
  console.warn('[DEPRECATED] getDesertStats()는 deprecated되었습니다. getDashboardStats()를 사용하세요.')
  return fetchFromAPI('/desert/stats')
}
