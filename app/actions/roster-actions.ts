"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface Roster {
  desertSeq: number
  userSeq: number
  userName: string
  userLevel: number
  userPower: number
  intentType: string
}

export interface RosterUpdateRequest {
  userSeq: number
  intentType: string
}

export interface RosterSaveRequest {
  desertSeq: number
  rosters: RosterUpdateRequest[]
}

/**
 * 사전조사 목록을 조회합니다.
 */
export async function getRosters(desertSeq: number): Promise<Roster[]> {
  try {
    return await fetchFromAPI(`/desert/roster/survey/${desertSeq}`)
  } catch (error) {
    console.error("사전조사 조회 실패:", error)
    throw error
  }
}

/**
 * 사전조사 데이터를 저장합니다. (UPSERT)
 */
export async function saveRosters(request: RosterSaveRequest): Promise<void> {
  try {
    await fetchFromAPI("/desert/roster/survey/save", {
      method: "POST",
      body: JSON.stringify(request),
    })

    revalidatePath(`/surveys?eventId=${request.desertSeq}`)
  } catch (error) {
    console.error("사전조사 저장 실패:", error)
    throw error
  }
}

/**
 * 단일 사전조사 데이터를 업데이트합니다.
 */
export async function updateRoster(desertSeq: number, userSeq: number, intentType: string): Promise<void> {
  try {
    const request: RosterSaveRequest = {
      desertSeq,
      rosters: [
        {
          userSeq,
          intentType,
        },
      ],
    }

    await saveRosters(request)
  } catch (error) {
    console.error("사전조사 업데이트 실패:", error)
    throw error
  }
}
