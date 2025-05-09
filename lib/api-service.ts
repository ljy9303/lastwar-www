// API 기본 URL을 프록시 경로로 변경
const API_BASE_URL = "/api/proxy"

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  console.log(`API 요청: ${url}`, options)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    console.log(`API 응답 상태: ${response.status} ${response.statusText}`)

    // 응답 텍스트를 먼저 가져와서 로깅
    const responseText = await response.text()
    console.log(`API 응답 내용:`, responseText.substring(0, 100))

    if (!response.ok) {
      // 에러 응답 처리
      let errorMessage = `API 요청 실패: ${response.status} ${response.statusText}`
      let errorData = {}

      try {
        // 이미 텍스트로 가져왔으므로 JSON으로 파싱 시도
        if (responseText && responseText.trim().startsWith("{")) {
          errorData = JSON.parse(responseText)
          if (errorData && typeof errorData === "object" && "message" in errorData) {
            errorMessage = errorData.message as string
          }
        } else if (responseText) {
          // JSON이 아닌 경우 텍스트 자체를 오류 메시지로 사용
          errorMessage = responseText
        }
      } catch (e) {
        console.error("응답 파싱 실패:", e)
        // JSON 파싱 실패 시 원본 텍스트를 오류 메시지에 포함
        errorMessage += ` 응답: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`
      }

      const error = new Error(errorMessage)
      // @ts-ignore - cause 속성 추가
      error.status = response.status
      // @ts-ignore
      error.data = errorData
      throw error
    }

    // 204 No Content 응답인 경우 빈 객체 반환
    if (response.status === 204 || !responseText.trim()) {
      return {}
    }

    // 이미 텍스트로 가져왔으므로 JSON으로 파싱
    try {
      // 응답이 JSON인지 확인
      if (responseText.trim().startsWith("{") || responseText.trim().startsWith("[")) {
        return JSON.parse(responseText)
      } else {
        // JSON이 아닌 경우 오류 발생
        throw new Error(`API 응답이 JSON 형식이 아닙니다: ${responseText.substring(0, 100)}`)
      }
    } catch (e) {
      console.error("JSON 파싱 실패:", e, responseText)
      throw new Error(
        `API 응답을 JSON으로 파싱할 수 없습니다: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`,
      )
    }
  } catch (error) {
    console.error("API 요청 오류:", error)

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
