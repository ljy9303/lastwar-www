export interface ExtractedPlayerInfo {
  nickname: string
  power: string
  level: number
  imageIndex: number // 어느 이미지에서 추출되었는지
  confidence?: number // AI 신뢰도 (선택적)
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
  existenceStatus?: ExistenceCheckStatus
}

export interface GeminiAIResponse {
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

// AI 진행 상태
export interface AIProgress {
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

// AI 연맹원 등록 단계
export type RegistrationStep = 
  | 'welcome'
  | 'grade-selection'
  | 'image-upload'
  | 'ai-processing' 
  | 'validation-editing'
  | 'registration-complete'
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

// AI 결과 검증 규칙
export interface ValidationRules {
  nicknameMinLength: number
  nicknameMaxLength: number
  levelMin: number
  levelMax: number
  powerFormats: RegExp[]
  requiredFields: string[]
}

// 연맹원 존재 확인 관련 타입
export interface ExistenceCheckRequest {
  name: string
  level: number
  power: number
  userGrade?: string
}

export interface ExistenceCheckResult {
  name: string
  level: number
  power: number
  userGrade?: string
  exists: boolean
  existingUser?: ExistingUserDetails
  matchConfidence: number
  matchType: 'EXACT_MATCH' | 'HIGH_SIMILARITY' | 'PARTIAL_MATCH' | 'NO_MATCH'
}

export interface ExistingUserDetails {
  userSeq: number
  name: string
  level: number
  power: number
  userGrade: string
  isActive: boolean
  lastUpdated?: string
  createdAt?: string
}

export interface ExistenceCheckStatus {
  checked: boolean
  loading: boolean
  error?: string
  result?: ExistenceCheckResult
}

export interface ExistenceCheckResponse {
  success: boolean
  results: ExistenceCheckResult[]
  summary: {
    totalChecked: number
    existingUsers: number
    newUsers: number
    highConfidenceMatches: number
  }
}

// AI 사용량 추적 관련 타입들
export interface AIUsageStartRequest {
  serviceType: string
  modelName: string
  requestType: string
  imageCount: number
}

export interface AIUsageCompleteRequest {
  trackingId: number
  successCount: number
  failedCount: number
  extractedUsersCount: number
  estimatedCostUsd?: number
  errorMessage?: string
}

export interface AIUsageResponse {
  id: number
  userId: number
  serviceType: string
  modelName: string
  requestType: string
  imageCount: number
  successCount?: number
  failedCount?: number
  extractedUsersCount?: number
  estimatedCostUsd?: number
  successRate?: number
  createdAt: string
  completedAt?: string
  processingTimeSeconds?: number
  completed: boolean
  errorMessage?: string
}

export interface AIUsageStatsResponse {
  periodStart: string
  periodEnd: string
  overall: {
    totalRequests: number
    totalImages: number
    totalSuccessImages: number
    totalFailedImages: number
    totalExtractedUsers: number
    totalCostUsd: number
    averageSuccessRate: number
  }
  user: {
    dailyRequestsCount: number
    dailyImagesCount: number
    monthlyRequestsCount: number
    monthlyImagesCount: number
    monthlyTotalCostUsd: number
  }
  services: Array<{
    serviceType: string
    requestCount: number
    totalImages: number
    totalSuccess: number
    totalCost: number
    successRate: number
  }>
}

// AI 사용량 추적 상태 관리
export interface AIUsageTracking {
  trackingId?: number
  serviceType: string
  modelName: string
  requestType: string
  imageCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
}

// OCR 배치 처리 관련 타입들
export interface OCRBatchRequest {
  images: File[]
  userGrade: string
  options?: OCRProcessingOptions
}

export interface OCRBatchResponse {
  batchId: string
  status: OCRBatchStatus
  message: string
  estimatedCompletionTime?: string
}

export interface OCRBatchStatusResponse {
  batchId: string
  status: OCRBatchStatus
  progress: OCRBatchProgress
  result?: OCRBatchResult
  error?: string
  createdAt: string
  updatedAt: string
  estimatedTimeRemaining?: number // seconds
}

export interface OCRBatchProgress {
  totalImages: number
  processedImages: number
  currentImageIndex: number
  percentage: number
  currentStage: OCRProcessingStage
  stageDetails?: string
}

export interface OCRBatchResult {
  totalProcessed: number
  successfullyProcessed: number
  failedImages: number
  extractedPlayers: ValidatedPlayerInfo[]
  registrationResult?: {
    insertedCount: number
    updatedCount: number
    rejoinedCount: number
    failedCount: number
    failedNames?: string[]
  }
  warnings?: string[]
  processingTimeSeconds: number
}

export interface OCRProcessingOptions {
  autoRegister?: boolean
  skipValidation?: boolean
  overwriteExisting?: boolean
  enableDuplicateCheck?: boolean
}

export type OCRBatchStatus = 
  | 'PENDING'     // 대기중
  | 'PROCESSING'  // 처리중
  | 'COMPLETED'   // 완료
  | 'FAILED'      // 실패
  | 'CANCELLED'   // 취소됨

export type OCRProcessingStage =
  | 'QUEUE_WAITING'      // 대기열 대기
  | 'IMAGE_PREPROCESSING' // 이미지 전처리
  | 'OCR_ANALYSIS'       // OCR 분석
  | 'DATA_VALIDATION'    // 데이터 검증
  | 'USER_REGISTRATION'  // 사용자 등록
  | 'FINALIZING'         // 마무리

// 에러 메시지 타입
export interface OCRErrorMessage {
  code: string
  message: string
  type: 'API_LIMIT' | 'QUOTA_EXCEEDED' | 'SERVER_ERROR' | 'VALIDATION_ERROR'
  userFriendlyMessage: string
  retryable: boolean
  retryAfterSeconds?: number
}

// 폴링 설정
export interface OCRPollingConfig {
  intervalMs: number
  maxAttempts: number
  backoffMultiplier: number
  maxIntervalMs: number
}