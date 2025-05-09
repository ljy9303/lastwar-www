"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface Squad {
  desertSeq: number
  userSeq: number
  userName: string
  userLevel: number
  userPower: number
  teamType: string
  confirmed: boolean
}

export interface SquadUpdateRequest {
  userSeq: number
  teamType: string
}

export interface SquadSaveRequest {
  desertSeq: number
  squads: SquadUpdateRequest[]
}

export interface SquadConfirmRequest {
  desertSeq: number
  confirmed: boolean
}

/**
 * 스쿼드 목록을 조회합니다.
 */
export async function getSquads(desertSeq: number): Promise<Squad[]> {
  try {
    return await fetchFromAPI(`/desert/squad/${desertSeq}`)
  } catch (error) {
    console.error("스쿼드 조회 실패:", error)
    throw error
  }
}

/**
 * 스쿼드 데이터를 저장합니다.
 */
export async function saveSquads(request: SquadSaveRequest): Promise<void> {
  try {
    await fetchFromAPI("/desert/squad/save", {
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
 * 단일 스쿼드 데이터를 업데이트합니다.
 */
export async function updateSquad(desertSeq: number, userSeq: number, teamType: string): Promise<void> {
  try {
    const request: SquadSaveRequest = {
      desertSeq,
      squads: [
        {
          userSeq,
          teamType,
        },
      ],
    }

    await saveSquads(request)
  } catch (error) {
    console.error("스쿼드 업데이트 실패:", error)
    throw error
  }
}

/**
 * 스쿼드 확정 상태를 변경합니다.
 */
export async function confirmSquad(request: SquadConfirmRequest): Promise<void> {
  try {
    await fetchFromAPI("/desert/squad/confirm", {
      method: "POST",
      body: JSON.stringify(request),
    })

    revalidatePath(`/squads?eventId=${request.desertSeq}`)
  } catch (error) {
    console.error("스쿼드 확정 실패:", error)
    throw error
  }
}
