"use server"

import { fetchFromAPI } from "@/lib/api-service"

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalEvents: number
  completedEvents: number
  aTeamWins: number
  bTeamWins: number
}

export interface RecentEvent {
  id: number
  name: string
  date: string
  status: string
  participants: number
  aTeam: number
  bTeam: number
  winner: string | null
}

export interface ActivityLog {
  id: number
  date: string
  action: string
  details: string
}

export interface TopUser {
  id: number
  nickname: string
  level: number
  power: number
  participation: number
}

/**
 * 대시보드 통계를 조회합니다.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await fetchFromAPI("/dashboard/stats")
  } catch (error) {
    console.error("대시보드 통계 조회 실패:", error)
    throw error
  }
}

/**
 * 최근 이벤트 목록을 조회합니다.
 */
export async function getRecentEvents(limit = 5): Promise<RecentEvent[]> {
  try {
    return await fetchFromAPI(`/dashboard/events?limit=${limit}`)
  } catch (error) {
    console.error("최근 이벤트 조회 실패:", error)
    throw error
  }
}

/**
 * 최근 활동 로그를 조회합니다.
 */
export async function getActivityLogs(limit = 5): Promise<ActivityLog[]> {
  try {
    return await fetchFromAPI(`/dashboard/logs?limit=${limit}`)
  } catch (error) {
    console.error("활동 로그 조회 실패:", error)
    throw error
  }
}

/**
 * 참여율 높은 유저 목록을 조회합니다.
 */
export async function getTopUsers(limit = 5): Promise<TopUser[]> {
  try {
    return await fetchFromAPI(`/dashboard/top-users?limit=${limit}`)
  } catch (error) {
    console.error("참여율 높은 유저 조회 실패:", error)
    throw error
  }
}
