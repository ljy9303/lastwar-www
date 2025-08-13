"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, RefreshCw, XCircle } from "lucide-react"
import type { OCRErrorMessage } from "@/types/ai-user-types"

interface OCRErrorAlertProps {
  error: OCRErrorMessage
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function OCRErrorAlert({ error, onRetry, onDismiss, className }: OCRErrorAlertProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'API_LIMIT':
        return <Clock className="h-4 w-4" />
      case 'QUOTA_EXCEEDED':
        return <XCircle className="h-4 w-4" />
      case 'SERVER_ERROR':
        return <AlertTriangle className="h-4 w-4" />
      case 'VALIDATION_ERROR':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'API_LIMIT':
        return "API 요청 제한"
      case 'QUOTA_EXCEEDED':
        return "일일 사용량 초과"
      case 'SERVER_ERROR':
        return "서버 오류"
      case 'VALIDATION_ERROR':
        return "데이터 검증 오류"
      default:
        return "처리 오류"
    }
  }

  const getVariant = () => {
    switch (error.type) {
      case 'API_LIMIT':
        return "default" as const
      case 'QUOTA_EXCEEDED':
        return "destructive" as const
      case 'SERVER_ERROR':
        return "destructive" as const
      case 'VALIDATION_ERROR':
        return "destructive" as const
      default:
        return "destructive" as const
    }
  }

  return (
    <Alert variant={getVariant()} className={className}>
      {getErrorIcon()}
      <AlertTitle>{getErrorTitle()}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{error.userFriendlyMessage}</p>
          
          {/* 재시도 권장 시간 표시 */}
          {error.retryable && error.retryAfterSeconds && (
            <p className="text-sm text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              {Math.ceil(error.retryAfterSeconds / 60)}분 후 다시 시도해보세요.
            </p>
          )}
          
          {/* 액션 버튼들 */}
          <div className="flex items-center gap-2 pt-2">
            {error.retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                다시 시도
              </Button>
            )}
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8"
              >
                확인
              </Button>
            )}
          </div>
          
          {/* 해결 방법 안내 */}
          {error.type === 'API_LIMIT' && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                💡 해결 방법
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1">
                <li>• 잠시 후 다시 시도해보세요</li>
                <li>• 이미지 개수를 줄여서 처리해보세요</li>
                <li>• 수동으로 연맹원 정보를 입력해보세요</li>
              </ul>
            </div>
          )}
          
          {error.type === 'QUOTA_EXCEEDED' && (
            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                📊 사용량 안내
              </p>
              <ul className="text-xs text-orange-600 dark:text-orange-400 mt-1 space-y-1">
                <li>• 금일 AI 분석 사용량을 모두 소진했습니다</li>
                <li>• 내일 00시에 사용량이 초기화됩니다</li>
                <li>• 수동으로 연맹원 정보를 입력할 수 있습니다</li>
              </ul>
            </div>
          )}
          
          {error.type === 'SERVER_ERROR' && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ⚙️ 서버 상태
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                <li>• 서버에 일시적인 문제가 발생했습니다</li>
                <li>• 몇 분 후 다시 시도해보세요</li>
                <li>• 문제가 지속되면 관리자에게 문의하세요</li>
              </ul>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}