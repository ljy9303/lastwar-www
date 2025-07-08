"use server"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface Desert {
  desertSeq: number
  title: string
  eventDate: string
  deleted: boolean
  eventType: string
}

export interface DesertCreateRequest {
  title: string
  eventDate: string
  eventType: string
}

export interface DesertSearchParams {
  title?: string
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
  sortBy?: "EVENT_DATE" | "CREATE_DATE" | "UPDATE_AT"
  sortOrder?: "ASC" | "DESC"
}

export interface DesertResponse {
  content: Desert[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalElements: number
  totalPages: number
  first: boolean
  numberOfElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  empty: boolean
}

/**
 * 사막전 목록을 조회합니다.
 */
export async function getDeserts(params: DesertSearchParams = {}): Promise<DesertResponse> {
  try {
    const queryString = buildQueryString(params)
    return await fetchFromAPI(`/desert${queryString}`)
  } catch (error) {
    console.error("사막전 조회 실패:", error)
    throw error
  }
}

/**
 * 사막전을 생성합니다.
 */
export async function createDesert(desertData: DesertCreateRequest): Promise<Desert> {
  try {
    const newDesert = await fetchFromAPI("/desert/create", {
      method: "POST",
      body: JSON.stringify(desertData),
    })

    revalidatePath("/events")
    return newDesert
  } catch (error) {
    console.error("사막전 생성 실패:", error)

    // HTTP 상태 코드가 400인 경우 중복 사막전 에러 처리
    if (error instanceof Error) {
      // @ts-ignore - status 속성 접근
      if (error.status === 400) {
        // 서버에서 받은 메시지가 있으면 사용, 없으면 기본 메시지 사용
        const message = error.message || "이미 존재하는 사막전입니다."
        throw new Error(message)
      }
    }

    // 그 외 에러는 그대로 전달
    throw error
  }
}

/**
 * 사막전을 삭제합니다.
 */
export async function deleteDesert(desertSeq: number): Promise<void> {
  try {
    await fetchFromAPI(`/desert/${desertSeq}`, {
      method: "DELETE",
    })

    revalidatePath("/events")
  } catch (error) {
    console.error(`사막전 ID ${desertSeq} 삭제 실패:`, error)
    throw error
  }
}

/**
 * 사막전 상세 정보를 조회합니다.
 */
export async function getDesertById(desertSeq: number): Promise<Desert> {
  try {
    return await fetchFromAPI(`/desert/${desertSeq}`)
  } catch (error) {
    console.error(`사막전 ID ${desertSeq} 조회 실패:`, error)
    throw error
  }
}
