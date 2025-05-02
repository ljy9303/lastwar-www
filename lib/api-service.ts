const API_BASE_URL = "http://43.203.90.157:8080"

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    // 에러 응답 처리
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`, { cause: errorData })
  }

  // 204 No Content 응답인 경우 빈 객체 반환
  if (response.status === 204) {
    return {}
  }

  return response.json()
}

export function buildQueryString(params: Record<string, any>): string {
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  return queryParams ? `?${queryParams}` : ""
}
