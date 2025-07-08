const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.chunsik.site"

export async function fetchFromAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  console.log("전체 API URL:", url)

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // 쿠키를 통한 세션 자동 관리
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
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
        return {} as T
      }
      return JSON.parse(text)
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError, 'Response text:', text)
      return {} as T
    }
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      // 이미 처리된 HTTP 에러는 그대로 전달
      throw error
    }
    // 네트워크 에러 등 다른 에러 처리
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
