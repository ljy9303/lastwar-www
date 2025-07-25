"use server"

import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import type { Account, AccountSearchParams, AccountLabelUpdate, AccountServerAllianceUpdate, UserLabelOption, ServerAlliance } from "@/types/account"

/**
 * Account 목록 조회
 */
export async function getAccounts(params: AccountSearchParams = {}) {
  const queryString = buildQueryString(params)
  return await fetchFromAPI(`/admin/accounts${queryString}`)
}

/**
 * 특정 Account 조회
 */
export async function getAccount(userId: number): Promise<Account> {
  return await fetchFromAPI(`/admin/accounts/${userId}`)
}

/**
 * Account 라벨 업데이트
 */
export async function updateAccountLabel(userId: number, updateData: AccountLabelUpdate): Promise<Account> {
  return await fetchFromAPI(`/admin/accounts/${userId}/label`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  })
}

/**
 * Account 서버/연맹 정보 업데이트
 */
export async function updateAccountServerAlliance(userId: number, updateData: AccountServerAllianceUpdate): Promise<Account> {
  return await fetchFromAPI(`/admin/accounts/${userId}/server-alliance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  })
}

/**
 * 사용 가능한 UserLabel 목록 조회
 */
export async function getUserLabels(): Promise<UserLabelOption[]> {
  return await fetchFromAPI('/admin/accounts/labels')
}

/**
 * 모든 서버 연맹 정보 조회
 */
export async function getServerAlliances(): Promise<ServerAlliance[]> {
  return await fetchFromAPI('/admin/accounts/server-alliances')
}