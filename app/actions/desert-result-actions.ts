"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface DesertRosterResult {
  desertSeq: number
  userSeq: number
  name: string
  desertType: string
  isPlayed: boolean
  score: number
  tag: string
  description: string
}

export interface DesertResultSummary {
  desertSeq: number
  winnerType: string
  description: string
}

/**
 * 사막전 결과를 조회합니다.
 */
export async function getDesertResults(desertSeq: number, desertType?: string): Promise<DesertRosterResult[]> {
  try {
    const queryParam = desertType ? `?desertType=${desertType}` : ""
    return await fetchFromAPI(`/desert/roster/final/${desertSeq}${queryParam}`)
  } catch (error) {
    console.error(`사막전 결과 조회 실패 (ID: ${desertSeq}):`, error)
    throw error
  }
}

/**
 * 사막전 결과를 업데이트합니다.
 */
export async function updateDesertResult(result: DesertRosterResult): Promise<DesertRosterResult> {
  try {
    const updatedResult = await fetchFromAPI(`/desert/roster/final/update`, {
      method: "POST",
      body: JSON.stringify(result),
    })

    revalidatePath(`/desert-results`)
    return updatedResult
  } catch (error) {
    console.error("사막전 결과 업데이트 실패:", error)
    throw error
  }
}

/**
 * 사막전 결과 요약을 저장합니다.
 */
export async function saveDesertResultSummary(summary: DesertResultSummary): Promise<DesertResultSummary> {
  try {
    const savedSummary = await fetchFromAPI(`/desert/result/summary`, {
      method: "POST",
      body: JSON.stringify(summary),
    })

    revalidatePath(`/desert-results`)
    return savedSummary
  } catch (error) {
    console.error("사막전 결과 요약 저장 실패:", error)
    throw error
  }
}

/**
 * 사막전 결과 요약을 조회합니다.
 */
export async function getDesertResultSummary(desertSeq: number): Promise<DesertResultSummary> {
  try {
    return await fetchFromAPI(`/desert/result/summary/${desertSeq}`)
  } catch (error) {
    console.error(`사막전 결과 요약 조회 실패 (ID: ${desertSeq}):`, error)
    // 결과가 없는 경우 기본값 반환
    return {
      desertSeq,
      winnerType: "",
      description: "",
    }
  }
}
