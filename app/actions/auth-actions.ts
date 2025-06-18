"use server"

import { fetchFromAPI } from "@/lib/api-service"

/**
 * 카카오 로그인 URL을 가져옵니다.
 */
export async function getKakaoLoginUrl(): Promise<string> {
  try {
    const response = await fetchFromAPI("/api/auth/kakao/login-url")
    return response.loginUrl || response.url || response.redirectUrl
  } catch (error) {
    console.error("카카오 로그인 URL 조회 실패:", error)
    // 직접 카카오 로그인 페이지로 리다이렉트하는 백엔드 엔드포인트 사용
    return "https://rokk.chunsik.site/api/auth/kakao/login"
  }
}

/**
 * JWT 토큰을 검증합니다.
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    await fetchFromAPI("/api/auth/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return true
  } catch (error) {
    console.error("토큰 검증 실패:", error)
    return false
  }
}

/**
 * 로그인 상태를 테스트합니다.
 */
export async function testAuthStatus(token: string): Promise<any> {
  try {
    return await fetchFromAPI("/api/auth/test", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    console.error("인증 상태 테스트 실패:", error)
    throw error
  }
}
