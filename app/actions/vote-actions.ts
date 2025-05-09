"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface Vote {
  id: number
  userId: number
  userName: string
  preference: string
}

export interface VoteCreateRequest {
  userId: number
  preference: string
}

export interface VoteUpdateRequest {
  preference: string
}

/**
 * 투표 목록을 조회합니다.
 */
export async function getVotes(): Promise<Vote[]> {
  try {
    return await fetchFromAPI("/votes")
  } catch (error) {
    console.error("투표 목록 조회 실패:", error)
    throw error
  }
}

/**
 * 투표를 생성합니다.
 */
export async function createVote(vote: VoteCreateRequest): Promise<Vote> {
  try {
    const newVote = await fetchFromAPI("/votes/create", {
      method: "POST",
      body: JSON.stringify(vote),
    })

    revalidatePath("/votes")
    return newVote
  } catch (error) {
    console.error("투표 생성 실패:", error)
    throw error
  }
}

/**
 * 투표를 수정합니다.
 */
export async function updateVote(id: number, vote: VoteUpdateRequest): Promise<Vote> {
  try {
    const updatedVote = await fetchFromAPI(`/votes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(vote),
    })

    revalidatePath("/votes")
    return updatedVote
  } catch (error) {
    console.error("투표 수정 실패:", error)
    throw error
  }
}

/**
 * 투표를 삭제합니다.
 */
export async function deleteVote(id: number): Promise<void> {
  try {
    await fetchFromAPI(`/votes/${id}`, {
      method: "DELETE",
    })

    revalidatePath("/votes")
  } catch (error) {
    console.error("투표 삭제 실패:", error)
    throw error
  }
}

/**
 * CSV 형식의 투표 데이터를 가져옵니다.
 */
export async function importVotesFromCsv(csvData: string): Promise<Vote[]> {
  try {
    const importedVotes = await fetchFromAPI("/votes/import", {
      method: "POST",
      body: JSON.stringify({ csvData }),
    })

    revalidatePath("/votes")
    return importedVotes
  } catch (error) {
    console.error("CSV 투표 가져오기 실패:", error)
    throw error
  }
}
