const API_BASE_URL =
  typeof window !== "undefined"
    ? ((window as any).NEXT_PUBLIC_API_BASE_URL ?? "https://api.chunsik.site")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.chunsik.site")

export async function fetchFromAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  console.log("전체 API URL:", url)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers, // JWT 관련 로직 제거됨
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

    return response.json()
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
