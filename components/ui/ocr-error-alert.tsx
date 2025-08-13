"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, Clock, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OCRErrorMessage } from '@/types/ai-user-types'

interface OCRErrorAlertProps {
  error: OCRErrorMessage
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

/**
 * OCR 배치 처리 에러를 표시하는 알림 컴포넌트
 * 사용자 친화적인 메시지와 재시도 기능을 제공
 */
export function OCRErrorAlert({ 
  error, 
  onRetry, 
  onDismiss, 
  className = "" 
}: OCRErrorAlertProps) {
  // 에러 타입별 스타일 및 아이콘
  const getErrorStyles = () => {
    switch (error.type) {
      case 'API_LIMIT':
      case 'QUOTA_EXCEEDED':
        return {
          variant: 'default' as const,
          icon: Clock,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }
      case 'SERVER_ERROR':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          color: 'bg-red-50 border-red-200 text-red-800'
        }
      case 'VALIDATION_ERROR':
        return {
          variant: 'default' as const,
          icon: AlertTriangle,
          color: 'bg-orange-50 border-orange-200 text-orange-800'
        }
      default:
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          color: 'bg-red-50 border-red-200 text-red-800'
        }
    }
  }

  const { variant, icon: ErrorIcon, color } = getErrorStyles()

  // 에러 타입별 제목
  const getErrorTitle = () => {
    switch (error.type) {
      case 'API_LIMIT':
      case 'QUOTA_EXCEEDED':
        return 'API 사용량 제한'
      case 'SERVER_ERROR':
        return '서버 오류'
      case 'VALIDATION_ERROR':
        return '입력 데이터 오류'
      default:
        return '처리 오류'
    }
  }

  // 재시도 대기 시간 포맷팅
  const formatRetryTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}초`
    }
    const minutes = Math.floor(seconds / 60)
    return `${minutes}분`
  }

  // 사용자 가이드 메시지
  const getUserGuideMessage = () => {
    switch (error.type) {
      case 'API_LIMIT':
      case 'QUOTA_EXCEEDED':
        return [
          '• API 사용량이 일시적으로 제한되었습니다.',
          '• 잠시 후 다시 시도해 주세요.',
          '• 이미지 개수를 줄여서 시도해보세요.'
        ]
      case 'SERVER_ERROR':
        return [
          '• 서버에 일시적인 문제가 발생했습니다.',
          '• 잠시 후 다시 시도해 주세요.',
          '• 문제가 지속되면 관리자에게 문의하세요.'
        ]
      case 'VALIDATION_ERROR':
        return [
          '• 업로드한 이미지나 데이터에 문제가 있습니다.',
          '• 이미지 형식과 크기를 확인해 주세요.',
          '• 지원 형식: JPG, PNG, WebP (최대 10MB)'
        ]
      default:
        return [
          '• 예기치 못한 오류가 발생했습니다.',
          '• 다시 시도해 주세요.',
          '• 문제가 지속되면 관리자에게 문의하세요.'
        ]
    }
  }

  return (
    <Alert variant={variant} className={`${color} ${className}`}>
      <div className="flex items-start space-x-3">
        <ErrorIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <AlertTitle className="text-sm font-semibold">
              {getErrorTitle()}
            </AlertTitle>
            
            {/* 에러 코드 배지 */}
            <Badge variant="outline" className="text-xs">
              {error.code}
            </Badge>
          </div>

          {/* 사용자 친화적 메시지 */}
          <AlertDescription className="text-sm mb-3">
            {error.userFriendlyMessage}
          </AlertDescription>

          {/* 재시도 대기 시간 표시 */}
          {error.retryAfterSeconds && (
            <div className="flex items-center space-x-1 mb-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatRetryTime(error.retryAfterSeconds)} 후 재시도 가능
              </span>
            </div>
          )}

          {/* 사용자 가이드 */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-1 text-muted-foreground">
              해결 방법:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {getUserGuideMessage().map((guide, index) => (
                <li key={index}>{guide}</li>
              ))}
            </ul>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {/* 재시도 버튼 */}
              {error.retryable && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="text-xs"
                  disabled={error.retryAfterSeconds !== undefined}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  재시도
                </Button>
              )}
            </div>

            {/* 닫기 버튼 */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* 기술적 세부사항 (개발 모드에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                기술적 세부사항
              </summary>
              <div className="mt-2 p-2 bg-muted rounded text-muted-foreground font-mono">
                <div><strong>Code:</strong> {error.code}</div>
                <div><strong>Type:</strong> {error.type}</div>
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
                {error.retryAfterSeconds && (
                  <div><strong>Retry After:</strong> {error.retryAfterSeconds}s</div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </Alert>
  )
}

/**
 * API 제한 에러를 위한 특화된 컴포넌트
 */
export function APILimitErrorAlert({ 
  error, 
  onRetry, 
  onDismiss 
}: OCRErrorAlertProps) {
  if (error.type !== 'API_LIMIT' && error.type !== 'QUOTA_EXCEEDED') {
    return <OCRErrorAlert error={error} onRetry={onRetry} onDismiss={onDismiss} />
  }

  return (
    <div className="space-y-4">
      <OCRErrorAlert error={error} onRetry={onRetry} onDismiss={onDismiss} />
      
      {/* 추가 가이드 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              API 사용량 최적화 팁
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 한 번에 업로드하는 이미지 수를 줄여보세요 (5개 이하 권장)</li>
              <li>• 이미지 크기를 줄여서 처리 시간을 단축하세요</li>
              <li>• 선명하고 깨끗한 이미지를 사용하면 정확도가 향상됩니다</li>
              <li>• 피크 시간대를 피해서 사용하면 더 안정적입니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 에러 알림을 위한 간단한 토스트 스타일 컴포넌트
 */
export function OCRErrorToast({ 
  error, 
  onRetry, 
  onDismiss 
}: OCRErrorAlertProps) {
  const { icon: ErrorIcon } = getErrorStyles()

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <ErrorIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {error.userFriendlyMessage}
            </p>
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                다시 시도
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// 헬퍼 함수 (내부 사용)
function getErrorStyles() {
  return {
    variant: 'destructive' as const,
    icon: AlertTriangle,
    color: 'bg-red-50 border-red-200 text-red-800'
  }
}