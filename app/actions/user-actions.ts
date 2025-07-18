"use client"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import type { User, UserCreateRequest, UserSearchParams, UserUpdateRequest } from "@/types/user"

/**
 * 유저 목록을 조회합니다.
 */
export async function getUsers(params: UserSearchParams = {}): Promise<User[]> {
  try {
    const queryString = buildQueryString(params)
    return await fetchFromAPI(`/user${queryString}`)
  } catch (error) {
    console.error("유저 조회 실패:", error)
    throw error
  }
}

/**
 * 특정 유저의 상세 정보를 조회합니다.
 */
export async function getUserById(userSeq: number): Promise<User> {
  try {
    return await fetchFromAPI(`/user/${userSeq}`)
  } catch (error) {
    console.error(`유저 Seq ${userSeq} 조회 실패:`, error)
    throw error
  }
}

/**
 * 유저를 생성합니다.
 */
export async function createUser(userData: UserCreateRequest): Promise<User> {
  try {
    const newUser = await fetchFromAPI("/user/create", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    return newUser
  } catch (error) {
    console.error("유저 생성 실패:", error)
    
    // HTTP 상태 코드가 400인 경우 백엔드 에러 메시지 사용
    if (error instanceof Error && "status" in error && error.status === 400) {
      // 백엔드에서 온 정확한 에러 메시지 사용
      throw new Error(error.message)
    }
    
    // 기타 에러 처리
    throw error
  }
}

/**
 * 유저 정보를 수정합니다.
 */
export async function updateUser(userSeq: number, userData: UserUpdateRequest): Promise<User> {
  try {
    const updatedUser = await fetchFromAPI(`/user/${userSeq}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    })

    return updatedUser
  } catch (error) {
    console.error(`유저 Seq ${userSeq} 수정 실패:`, error)
    throw error
  }
}

/**
 * 유저를 삭제합니다 (소프트 삭제).
 */
export async function deleteUser(userSeq: number): Promise<void> {
  try {
    await fetchFromAPI(`/user/${userSeq}`, {
      method: "DELETE",
    })

  } catch (error) {
    console.error(`유저 Seq ${userSeq} 삭제 실패:`, error)
    throw error
  }
}
