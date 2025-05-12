"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

// Update the SquadMember interface to include position
export interface SquadMember {
  desertSeq: number
  userSeq: number
  desertType: string | null
  prepare: boolean
  userName: string
  userLevel: number
  userPower: number
  intentType: string
  isCandidate: boolean
  isPlayed: boolean
  position: number
}

// Update the SquadUpdateRequest interface to include position
export interface SquadUpdateRequest {
  userSeq: number
  desertType: string
  position?: number
}

export interface SquadSaveRequest {
  desertSeq: number
  squads: SquadUpdateRequest[]
}

/**
 * 스쿼드 목록을 조회합니다.
 */
export async function getSquads(desertSeq: number): Promise<SquadMember[]> {
  try {
    return await fetchFromAPI(`/desert/roster/prepare/${desertSeq}`)
  } catch (error) {
    console.error("스쿼드 조회 실패:", error)
    throw error
  }
}

/**
 * 스쿼드 데이터를 저장합니다. (UPSERT)
 */
export async function saveSquads(request: SquadSaveRequest): Promise<void> {
  try {
    await fetchFromAPI("/desert/roster/prepare/save", {
      method: "POST",
      body: JSON.stringify(request),
    })

    revalidatePath(`/squads?eventId=${request.desertSeq}`)
  } catch (error) {
    console.error("스쿼드 저장 실패:", error)
    throw error
  }
}

/**
 * 단일 스쿼드 멤버 데이터를 업데이트합니다.
 */
export async function updateSquadMember(desertSeq: number, userSeq: number, desertType: string): Promise<void> {
  try {
    const request: SquadSaveRequest = {
      desertSeq,
      squads: [
        {
          userSeq,
          desertType,
        },
      ],
    }

    await saveSquads(request)
  } catch (error) {
    console.error("스쿼드 멤버 업데이트 실패:", error)
    throw error
  }
}
