"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface PostEventResult {
  id: number
  desertSeq: number
  userSeq: number
  userName: string
  teamType: string
  participated: boolean
  performance: string
  notes: string
}

export interface PostEventUpdateRequest {
  userSeq: number
  participated: boolean
  performance: string
  notes?: string
}

export interface PostEventSaveRequest {
  desertSeq: number
  results: PostEventUpdateRequest[]
}

export interface EventResult {
  desertSeq: number
  winner: string
  notes: string
}

/**
 * 사후 관리 결과를 조회합니다.
 */
export async function getPostEventResults(desertSeq: number): Promise<PostEventResult[]> {
  try {
    return await fetchFromAPI(`/desert/result/${desertSeq}`)
  } catch (error) {
    console.error("사후 관리 결과 조회 실패:", error)
    throw error
  }
}

/**
 * 사후 관리 결과를 저장합니다.
 */
export async function savePostEventResults(request: PostEventSaveRequest): Promise<void> {
  try {
    await fetchFromAPI("/desert/result/save", {
      method: "POST",
      body: JSON.stringify(request),
    })

    revalidatePath(`/post-events?eventId=${request.desertSeq}`)
  } catch (error) {
    console.error("사후 관리 결과 저장 실패:", error)
    throw error
  }
}

/**
 * 단일 사용자의 사후 관리 결과를 업데이트합니다.
 */
export async function updatePostEventResult(
  desertSeq: number,
  userSeq: number,
  participated: boolean,
  performance: string,
  notes?: string,
): Promise<void> {
  try {
    const request: PostEventSaveRequest = {
      desertSeq,
      results: [
        {
          userSeq,
          participated,
          performance,
          notes,
        },
      ],
    }

    await savePostEventResults(request)
  } catch (error) {
    console.error("사후 관리 결과 업데이트 실패:", error)
    throw error
  }
}

/**
 * 이벤트 최종 결과를 저장합니다.
 */
export async function saveEventResult(result: EventResult): Promise<void> {
  try {
    await fetchFromAPI("/desert/result/event", {
      method: "POST",
      body: JSON.stringify(result),
    })

    revalidatePath(`/post-events?eventId=${result.desertSeq}`)
    revalidatePath(`/events/${result.desertSeq}`)
  } catch (error) {
    console.error("이벤트 결과 저장 실패:", error)
    throw error
  }
}

/**
 * 이벤트 최종 결과를 조회합니다.
 */
export async function getEventResult(desertSeq: number): Promise<EventResult> {
  try {
    return await fetchFromAPI(`/desert/result/event/${desertSeq}`)
  } catch (error) {
    console.error("이벤트 결과 조회 실패:", error)
    throw error
  }
}
