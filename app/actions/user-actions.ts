"use server"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import type { User, UserCreateRequest, UserSearchParams, UserUpdateRequest } from "@/types/user"
import { revalidatePath } from "next/cache"

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

    revalidatePath("/users")
    return newUser
  } catch (error) {
    console.error("유저 생성 실패:", error)
    // HTTP 상태 코드가 400인 경우 중복 유저 에러 처리
    if (error instanceof Error && error.cause && (error.cause as any).status === 400) {
      throw new Error("이미 존재하는 유저입니다.")
    }
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

    revalidatePath("/users")
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

    revalidatePath("/users")
  } catch (error) {
    console.error(`유저 Seq ${userSeq} 삭제 실패:`, error)
    throw error
  }
}
