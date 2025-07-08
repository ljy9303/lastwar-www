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

// 그룹화된 스쿼드 응답 인터페이스 추가
export interface GroupedSquadResponse {
  A_TEAM: SquadMember[]
  B_TEAM: SquadMember[]
  A_RESERVE: SquadMember[]
  B_RESERVE: SquadMember[]
  AB_POSSIBLE: SquadMember[]
  UNASSIGNED: SquadMember[]
}

// Update the SquadUpdateRequest interface to include position
export interface SquadUpdateRequest {
  userSeq: number
  desertType: string
  position?: number
  isCandidate: boolean // isCandidate를 필수 필드로 변경
}

export interface SquadSaveRequest {
  desertSeq: number | null
  rosters: SquadUpdateRequest[]
}

/**
 * 스쿼드 목록을 조회합니다.
 * @param desertSeq - 사막전 번호. null인 경우 -1을 사용하여 일반 스쿼드 관리 모드
 */
export async function getSquads(desertSeq: number | null): Promise<GroupedSquadResponse> {
  try {
    const actualDesertSeq = desertSeq ?? -1 // null인 경우 -1 사용
    return await fetchFromAPI(`/desert/roster/prepare/${actualDesertSeq}`)
  } catch (error) {
    console.error("스쿼드 조회 실패:", error)
    // 일반 모드인 경우 빈 데이터 반환
    if (desertSeq === null) {
      return {
        A_TEAM: [],
        B_TEAM: [],
        A_RESERVE: [],
        B_RESERVE: [],
        AB_POSSIBLE: [],
        UNASSIGNED: [],
      }
    }
    throw error
  }
}

/**
 * 스쿼드 데이터를 저장합니다. (UPSERT)
 */
export async function saveSquads(request: SquadSaveRequest): Promise<void> {
  try {
    // 일반 모드인 경우 저장 생략
    if (request.desertSeq === null) {
      console.log("일반 스쿼드 관리 모드에서는 저장이 지원되지 않습니다.")
      return
    }

    // 모든 요청에 isCandidate: true 추가
    const modifiedRequest = {
      ...request,
      desertSeq: request.desertSeq, // null이 아님을 보장
      rosters: request.rosters.map((roster) => ({
        ...roster,
        isCandidate: true, // 항상 true로 설정
      })),
    }

    await fetchFromAPI("/desert/roster/prepare/save", {
      method: "POST",
      body: JSON.stringify(modifiedRequest),
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
export async function updateSquadMember(
  desertSeq: number | null,
  userSeq: number,
  desertType: string,
  position = -1,
): Promise<void> {
  try {
    const request: SquadSaveRequest = {
      desertSeq,
      rosters: [
        {
          userSeq,
          desertType,
          position,
          isCandidate: true, // 항상 true로 설정
        },
      ],
    }

    await saveSquads(request)
  } catch (error) {
    console.error("스쿼드 멤버 업데이트 실패:", error)
    throw error
  }
}
