"use server"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import type { UserHistoryParams, UserHistoryResponse, UserNicknameHistoryResponse, UserNicknameSearchResponse } from "@/types/user-history"

/**
 * 연맹원 변경 히스토리를 조회합니다.
 */
export async function getUserHistory(params: UserHistoryParams = {}): Promise<UserHistoryResponse> {
  try {
    const queryString = buildQueryString(params)
    return await fetchFromAPI(`/user/history${queryString}`)
  } catch (error) {
    console.error("연맹원 히스토리 조회 실패:", error)
    throw error
  }
}

/**
 * 예전 닉네임으로 현재 연맹원 정보 및 변경 이력을 조회합니다.
 */
export async function searchByOldNickname(oldNickname: string): Promise<UserNicknameHistoryResponse | null> {
  try {
    const endpoint = `/user/history/search-by-old-nickname?oldNickname=${encodeURIComponent(oldNickname)}`
    console.log("API 호출 URL:", endpoint)
    const result = await fetchFromAPI(endpoint)
    return result || null
  } catch (error: any) {
    console.log("API 호출 에러:", error)
    // 404는 검색 결과 없음을 의미하므로 null 반환
    if (error.status === 404) {
      return null
    }
    console.error("예전 닉네임 검색 실패:", error)
    throw error
  }
}

/**
 * 닉네임으로 매칭되는 모든 연맹원 목록을 조회합니다.
 */
export async function searchUsersByNickname(nickname: string): Promise<UserNicknameSearchResponse> {
  try {
    const endpoint = `/user/history/search-users-by-nickname?nickname=${encodeURIComponent(nickname)}`
    console.log("API 호출 URL:", endpoint)
    const result = await fetchFromAPI(endpoint)
    return result
  } catch (error: any) {
    console.error("닉네임 연맹원 목록 검색 실패:", error)
    throw error
  }
}

/**
 * 특정 연맹원의 상세 정보와 이력을 조회합니다.
 */
export async function getUserDetailWithHistory(userSeq: number): Promise<UserNicknameHistoryResponse | null> {
  try {
    const endpoint = `/user/history/user-detail/${userSeq}`
    console.log("API 호출 URL:", endpoint)
    const result = await fetchFromAPI(endpoint)
    return result || null
  } catch (error: any) {
    console.log("API 호출 에러:", error)
    // 404는 연맹원 없음을 의미하므로 null 반환
    if (error.status === 404) {
      return null
    }
    console.error("연맹원 상세 정보 조회 실패:", error)
    throw error
  }
}
