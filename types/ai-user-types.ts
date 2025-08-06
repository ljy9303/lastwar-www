export interface ExtractedPlayerInfo {
  nickname: string
  power: string
  level: number
  imageIndex: number // 어느 이미지에서 추출되었는지
  confidence?: number // OCR 신뢰도 (선택적)
}

export interface ProcessedImage {
  id: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  players: ExtractedPlayerInfo[]
  error?: string
}

export interface AIUserRegistrationData {
  selectedGrade: string
  images: ProcessedImage[]
  extractedPlayers: ExtractedPlayerInfo[]
  validatedPlayers: ValidatedPlayerInfo[]
}

export interface ValidatedPlayerInfo extends ExtractedPlayerInfo {
  isValid: boolean
  errors: string[]
  isDuplicate: boolean
  duplicateWith?: string[]
  editedNickname?: string
  editedPower?: string
  editedLevel?: number
}

export interface GeminiOCRResponse {
  success: boolean
  players: ExtractedPlayerInfo[]
  error?: string
}

export interface UserRegistrationBatch {
  grade: string
  players: {
    name: string
    level: number
    power: number
    userGrade: string
  }[]
}

// OCR 진행 상태
export interface OCRProgress {
  total: number
  processed: number
  currentImage?: string
  status: 'idle' | 'processing' | 'completed' | 'failed'
}

// 등급별 사용 가능 슬롯 정보
export interface GradeSlotInfo {
  grade: string
  current: number
  max: number
  available: number
  percentage: number
}

// AI 유저 등록 단계
export type RegistrationStep = 
  | 'grade-selection'
  | 'image-upload'
  | 'ocr-processing' 
  | 'validation-editing'
  | 'final-registration'

// 이미지 업로드 옵션
export interface ImageUploadOptions {
  maxSize: number // MB
  acceptedTypes: string[]
  maxImages: number
}

// 닉네임 중복 그룹
export interface DuplicateGroup {
  nickname: string
  players: ValidatedPlayerInfo[]
  action: 'merge' | 'keep-all' | 'keep-first' | 'manual'
}

// OCR 결과 검증 규칙
export interface ValidationRules {
  nicknameMinLength: number
  nicknameMaxLength: number
  levelMin: number
  levelMax: number
  powerFormats: RegExp[]
  requiredFields: string[]
}