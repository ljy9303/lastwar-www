"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"
import type { User } from "@/types/user"

export interface LotteryResult {
  id: number
  date: string
  participants: number[]
  winners: number[]
  description: string
}

/**
 * 추첨 결과를 저장합니다.
 */
export async function saveLotteryResult(
  participants: User[],
  winners: User[],
  description: string,
): Promise<LotteryResult> {
  try {
    const result = await fetchFromAPI("/lottery/save", {
      method: "POST",
      body: JSON.stringify({
        participants: participants.map((p) => p.userSeq),
        winners: winners.map((w) => w.userSeq),
        description,
      }),
    })

    revalidatePath("/lottery")
    return result
  } catch (error) {
    console.error("추첨 결과 저장 실패:", error)
    throw error
  }
}

/**
 * 추첨 결과 목록을 조회합니다.
 */
export async function getLotteryResults(): Promise<LotteryResult[]> {
  try {
    return await fetchFromAPI("/lottery")
  } catch (error) {
    console.error("추첨 결과 목록 조회 실패:", error)
    throw error
  }
}

/**
 * 추첨 결과 상세를 조회합니다.
 */
export async function getLotteryResultById(id: number): Promise<LotteryResult> {
  try {
    return await fetchFromAPI(`/lottery/${id}`)
  } catch (error) {
    console.error("추첨 결과 상세 조회 실패:", error)
    throw error
  }
}
