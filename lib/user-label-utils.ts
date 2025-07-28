/**
 * 사용자 라벨 유틸리티
 * 백엔드 ENUM 값을 한글 라벨과 스타일로 매핑
 */

export type UserLabelType = 'MASTER' | 'SPONSOR' | 'PREMIUM' | 'MODERATOR' | 'SUPPORTERS'

export interface LabelStyle {
  displayName: string
  bgColor: string
  textColor: string
  borderColor: string
}

/**
 * 라벨 타입별 스타일 정의
 */
const LABEL_STYLES: Record<UserLabelType, LabelStyle> = {
  MASTER: {
    displayName: '관리자',
    bgColor: 'label-master',
    textColor: '',
    borderColor: ''
  },
  SPONSOR: {
    displayName: '후원',
    bgColor: 'label-sponsor',
    textColor: '',
    borderColor: ''
  },
  PREMIUM: {
    displayName: '프리미엄',
    bgColor: 'label-premium',
    textColor: '',
    borderColor: ''
  },
  MODERATOR: {
    displayName: '운영자',
    bgColor: 'label-moderator',
    textColor: '',
    borderColor: ''
  },
  SUPPORTERS: {
    displayName: '서포터즈',
    bgColor: 'label-supporters',
    textColor: '',
    borderColor: ''
  }
}

/**
 * 라벨 ENUM 값으로 한글 표시명 조회
 */
export function getLabelDisplayName(labelType?: string | null): string | null {
  if (!labelType) return null
  
  const style = LABEL_STYLES[labelType as UserLabelType]
  return style?.displayName || null
}

/**
 * 라벨 ENUM 값으로 스타일 정보 조회
 */
export function getLabelStyle(labelType?: string | null): LabelStyle | null {
  if (!labelType) return null
  
  return LABEL_STYLES[labelType as UserLabelType] || null
}

/**
 * 라벨이 유효한 값인지 확인
 */
export function isValidLabel(labelType?: string | null): labelType is UserLabelType {
  if (!labelType) return false
  return labelType in LABEL_STYLES
}

/**
 * 모든 라벨 타입 목록 조회
 */
export function getAllLabelTypes(): UserLabelType[] {
  return Object.keys(LABEL_STYLES) as UserLabelType[]
}

/**
 * 라벨 우선순위 (숫자가 낮을수록 높은 우선순위)
 */
const LABEL_PRIORITY: Record<UserLabelType, number> = {
  MASTER: 1,
  MODERATOR: 2, 
  SUPPORTERS: 3,
  SPONSOR: 4,
  PREMIUM: 5
}

/**
 * 라벨 우선순위 비교 (채팅에서 라벨 정렬용)
 */
export function compareLabelPriority(labelA?: string | null, labelB?: string | null): number {
  if (!labelA && !labelB) return 0
  if (!labelA) return 1
  if (!labelB) return -1
  
  const priorityA = LABEL_PRIORITY[labelA as UserLabelType] || 999
  const priorityB = LABEL_PRIORITY[labelB as UserLabelType] || 999
  
  return priorityA - priorityB
}