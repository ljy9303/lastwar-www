"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input, InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

/**
 * 성능 최적화된 접근성 폼 필드 컴포넌트
 * - 복잡한 hook 의존성 제거
 * - DOM 조작 최소화
 * - 메모이제이션 적용
 */

interface PerformanceOptimizedFormFieldProps extends InputProps {
  label: string
  helperText?: string
  error?: string
  required?: boolean
  description?: string
}

/**
 * 메모이제이션된 아이콘 컴포넌트들
 */
const ErrorIcon = React.memo(() => (
  <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
))
ErrorIcon.displayName = "ErrorIcon"

const SuccessIcon = React.memo(() => (
  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
))
SuccessIcon.displayName = "SuccessIcon"

const InfoIcon = React.memo(() => (
  <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
))
InfoIcon.displayName = "InfoIcon"

/**
 * 성능 최적화된 폼 필드
 */
export const PerformanceOptimizedFormField = React.memo(
  React.forwardRef<HTMLInputElement, PerformanceOptimizedFormFieldProps>(
    ({
      label,
      helperText,
      error,
      required,
      description,
      id,
      className,
      ...props
    }, ref) => {
      // ID 생성을 stable하게 처리
      const fieldId = React.useMemo(() => 
        id || `field-${Math.random().toString(36).substr(2, 9)}`, 
        [id]
      )
      
      // describedBy 계산 최적화
      const describedBy = React.useMemo(() => {
        const ids = []
        if (helperText) ids.push(`${fieldId}-helper`)
        if (error) ids.push(`${fieldId}-error`)
        if (description) ids.push(`${fieldId}-description`)
        return ids.length > 0 ? ids.join(' ') : undefined
      }, [fieldId, helperText, error, description])

      return (
        <div className="space-y-2">
          <Label 
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="필수 입력">
                *
              </span>
            )}
          </Label>
          
          <div className="relative">
            <Input
              ref={ref}
              id={fieldId}
              aria-describedby={describedBy}
              aria-invalid={!!error}
              aria-required={required}
              className={cn(
                className,
                error && "border-destructive focus-visible:ring-destructive",
                "transition-colors duration-150" // 간단한 전환 효과만
              )}
              {...props}
            />
            
            {/* 상태 아이콘 (우측에 표시) */}
            {(error || props.value) && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {error ? <ErrorIcon /> : <SuccessIcon />}
              </div>
            )}
          </div>
          
          {/* 설명 텍스트 */}
          {description && !error && (
            <p 
              id={`${fieldId}-description`}
              className="text-sm text-muted-foreground flex items-start gap-2"
            >
              <InfoIcon />
              <span>{description}</span>
            </p>
          )}
          
          {/* 도움말 텍스트 */}
          {helperText && !error && (
            <p 
              id={`${fieldId}-helper`}
              className="text-sm text-muted-foreground"
            >
              {helperText}
            </p>
          )}
          
          {/* 에러 메시지 */}
          {error && (
            <p 
              id={`${fieldId}-error`}
              className="text-sm text-destructive flex items-start gap-2"
              role="alert"
              aria-live="polite"
            >
              <ErrorIcon />
              <span>{error}</span>
            </p>
          )}
        </div>
      )
    }
  )
)

PerformanceOptimizedFormField.displayName = "PerformanceOptimizedFormField"

/**
 * 간단한 폼 그룹 컴포넌트
 */
interface FormGroupProps {
  children: React.ReactNode
  className?: string
}

export const FormGroup = React.memo<FormGroupProps>(({ children, className }) => (
  <div className={cn("grid gap-6", className)}>
    {children}
  </div>
))

FormGroup.displayName = "FormGroup"

/**
 * 폼 액션 영역
 */
interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "right" | "center"
}

export const FormActions = React.memo<FormActionsProps>(({ 
  children, 
  className, 
  align = "right" 
}) => (
  <div className={cn(
    "flex gap-3 pt-4",
    {
      "justify-start": align === "left",
      "justify-end": align === "right", 
      "justify-center": align === "center"
    },
    className
  )}>
    {children}
  </div>
))

FormActions.displayName = "FormActions"