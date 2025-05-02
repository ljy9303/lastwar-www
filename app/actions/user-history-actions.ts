"use server"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import type { UserHistoryParams, UserHistoryResponse } from "@/types/user-history"

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
