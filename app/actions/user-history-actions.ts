"use server"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import type { UserHistoryParams, UserHistoryResponse, UserNicknameHistoryResponse, UserNicknameSearchResponse } from "@/types/user-history"

/**
 * 유저 변경 히스토리를 조회합니다.
 */
export async function getUserHistory(params: UserHistoryParams = {}): Promise<UserHistoryResponse> {
  try {
    const queryString = buildQueryString(params)
    return await fetchFromAPI(`/user/history${queryString}`)
  } catch (error) {
    console.error("유저 히스토리 조회 실패:", error)
    throw error
  }
}

/**
 * 예전 닉네임으로 현재 유저 정보 및 변경 이력을 조회합니다.
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
 * 닉네임으로 매칭되는 모든 유저 목록을 조회합니다.
 */
export async function searchUsersByNickname(nickname: string): Promise<UserNicknameSearchResponse> {
  try {
    const endpoint = `/user/history/search-users-by-nickname?nickname=${encodeURIComponent(nickname)}`
    console.log("API 호출 URL:", endpoint)
    const result = await fetchFromAPI(endpoint)
    return result
  } catch (error: any) {
    console.error("닉네임 유저 목록 검색 실패:", error)
    throw error
  }
}

/**
 * 특정 유저의 상세 정보와 이력을 조회합니다.
 */
export async function getUserDetailWithHistory(userSeq: number): Promise<UserNicknameHistoryResponse | null> {
  try {
    const endpoint = `/user/history/user-detail/${userSeq}`
    console.log("API 호출 URL:", endpoint)
    const result = await fetchFromAPI(endpoint)
    return result || null
  } catch (error: any) {
    console.log("API 호출 에러:", error)
    // 404는 유저 없음을 의미하므로 null 반환
    if (error.status === 404) {
      return null
    }
    console.error("유저 상세 정보 조회 실패:", error)
    throw error
  }
}
