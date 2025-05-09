"use server"

import { fetchFromAPI } from "@/lib/api-service"
import { revalidatePath } from "next/cache"

export interface Admin {
  id: number
  username: string
  name: string
  role: string
  canViewHistory: boolean
}

export interface AdminCreateRequest {
  username: string
  name: string
  role: string
  canViewHistory: boolean
}

export interface SystemSettings {
  voteDeadline: string
  allowUserEdit: boolean
  allowVoteEdit: boolean
  allowTeamEdit: boolean
  showPowerInSquad: boolean
  enableNotifications: boolean
  backupFrequency: string
}

/**
 * 관리자 목록을 조회합니다.
 */
export async function getAdmins(): Promise<Admin[]> {
  try {
    return await fetchFromAPI("/settings/admins")
  } catch (error) {
    console.error("관리자 목록 조회 실패:", error)
    throw error
  }
}

/**
 * 관리자를 추가합니다.
 */
export async function createAdmin(admin: AdminCreateRequest): Promise<Admin> {
  try {
    const newAdmin = await fetchFromAPI("/settings/admins/create", {
      method: "POST",
      body: JSON.stringify(admin),
    })

    revalidatePath("/settings")
    return newAdmin
  } catch (error) {
    console.error("관리자 추가 실패:", error)
    throw error
  }
}

/**
 * 관리자를 삭제합니다.
 */
export async function deleteAdmin(id: number): Promise<void> {
  try {
    await fetchFromAPI(`/settings/admins/${id}`, {
      method: "DELETE",
    })

    revalidatePath("/settings")
  } catch (error) {
    console.error("관리자 삭제 실패:", error)
    throw error
  }
}

/**
 * 시스템 설정을 조회합니다.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    return await fetchFromAPI("/settings/system")
  } catch (error) {
    console.error("시스템 설정 조회 실패:", error)
    throw error
  }
}

/**
 * 시스템 설정을 저장합니다.
 */
export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  try {
    await fetchFromAPI("/settings/system", {
      method: "POST",
      body: JSON.stringify(settings),
    })

    revalidatePath("/settings")
  } catch (error) {
    console.error("시스템 설정 저장 실패:", error)
    throw error
  }
}
