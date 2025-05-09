const API_BASE_URL = "http://43.203.90.157:8080"

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      // 에러 응답 처리
      let errorMessage = `API 요청 실패: ${response.status} ${response.statusText}`
      let errorData = {}

      try {
        errorData = await response.json()
        if (errorData && typeof errorData === "object" && "message" in errorData) {
          errorMessage = errorData.message as string
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      const error = new Error(errorMessage)
      // @ts-ignore - cause 속성 추가
      error.status = response.status
      // @ts-ignore
      error.data = errorData
      throw error
    }

    // 204 No Content 응답인 경우 빈 객체 반환
    if (response.status === 204) {
      return {}
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
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  return queryParams ? `?${queryParams}` : ""
}
