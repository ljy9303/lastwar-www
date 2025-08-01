"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input, InputProps } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useLiveAnnouncer } from "@/hooks/use-accessibility"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

/**
 * 접근성이 향상된 폼 필드 컴포넌트들
 */

interface AccessibleFormFieldProps extends InputProps {
  label: string
  helperText?: string
  error?: string
  required?: boolean
  description?: string
}

/**
 * 접근성 향상 입력 필드
 */
export const AccessibleFormField = React.forwardRef<HTMLInputElement, AccessibleFormFieldProps>(
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
    const fieldId = id || `field-${React.useId()}`
    const helperTextId = helperText ? `${fieldId}-helper` : undefined
    const errorId = error ? `${fieldId}-error` : undefined
    const descriptionId = description ? `${fieldId}-description` : undefined
    
    const describedBy = [helperTextId, errorId, descriptionId]
      .filter(Boolean)
      .join(' ')

    const { announceError } = useLiveAnnouncer()

    // 에러 상태 변경 시 스크린 리더에 알림
    React.useEffect(() => {
      if (error) {
        announceError(error)
      }
    }, [error, announceError])

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
            <span 
              className="text-destructive ml-1" 
              aria-label="필수 입력 항목"
              title="필수 입력"
            >
              *
            </span>
          )}
        </Label>
        
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            <Info className="inline w-4 h-4 mr-1" aria-hidden="true" />
            {description}
          </p>
        )}
        
        <Input
          ref={ref}
          id={fieldId}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          aria-required={required}
          className={cn(
            // 포커스 시 고대비 테두리
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            error && [
              "border-destructive", 
              "focus-visible:ring-destructive",
              "focus:border-destructive"
            ],
            className
          )}
          {...props}
        />
        
        {helperText && !error && (
          <p 
            id={helperTextId}
            className="text-sm text-muted-foreground flex items-center"
            role="note"
          >
            <Info className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
            {helperText}
          </p>
        )}
        
        {error && (
          <p 
            id={errorId}
            className="text-sm text-destructive flex items-center"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleFormField.displayName = "AccessibleFormField"

/**
 * 접근성 향상 텍스트 영역
 */
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  helperText?: string
  error?: string
  required?: boolean
  description?: string
  maxLength?: number
}

export const AccessibleTextarea = React.forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({
    label,
    helperText,
    error,
    required,
    description,
    maxLength,
    id,
    className,
    value,
    ...props
  }, ref) => {
    const fieldId = id || `textarea-${React.useId()}`
    const currentLength = typeof value === 'string' ? value.length : 0
    const remainingChars = maxLength ? maxLength - currentLength : null
    
    const helperTextId = helperText ? `${fieldId}-helper` : undefined
    const errorId = error ? `${fieldId}-error` : undefined
    const descriptionId = description ? `${fieldId}-description` : undefined
    const countId = maxLength ? `${fieldId}-count` : undefined
    
    const describedBy = [helperTextId, errorId, descriptionId, countId]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}
        >
          {label}
          {required && (
            <span 
              className="text-destructive ml-1" 
              aria-label="필수 입력 항목"
            >
              *
            </span>
          )}
        </Label>
        
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        
        <Textarea
          ref={ref}
          id={fieldId}
          value={value}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          aria-required={required}
          maxLength={maxLength}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {helperText && !error && (
              <p 
                id={helperTextId}
                className="text-sm text-muted-foreground"
                role="note"
              >
                {helperText}
              </p>
            )}
            
            {error && (
              <p 
                id={errorId}
                className="text-sm text-destructive flex items-center"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>
          
          {maxLength && (
            <div 
              id={countId}
              className={cn(
                "text-xs flex-shrink-0",
                remainingChars !== null && remainingChars < 20
                  ? "text-destructive" 
                  : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
      </div>
    )
  }
)

AccessibleTextarea.displayName = "AccessibleTextarea"

/**
 * 접근성 향상 선택 박스
 */
interface AccessibleSelectProps {
  label: string
  helperText?: string
  error?: string
  required?: boolean
  description?: string
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  helperText,
  error,
  required,
  description,
  placeholder,
  value,
  onValueChange,
  children,
  disabled
}) => {
  const fieldId = `select-${React.useId()}`
  const helperTextId = helperText ? `${fieldId}-helper` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const descriptionId = description ? `${fieldId}-description` : undefined
  
  const describedBy = [helperTextId, errorId, descriptionId]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={fieldId}
        className={cn(
          "text-sm font-medium leading-none",
          error && "text-destructive"
        )}
      >
        {label}
        {required && (
          <span 
            className="text-destructive ml-1" 
            aria-label="필수 선택 항목"
          >
            *
          </span>
        )}
      </Label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          aria-required={required}
          className={cn(
            error && "border-destructive focus:ring-destructive",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      
      {helperText && !error && (
        <p 
          id={helperTextId}
          className="text-sm text-muted-foreground"
          role="note"
        >
          {helperText}
        </p>
      )}
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-destructive flex items-center"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * 폼 성공 메시지 컴포넌트
 */
interface FormSuccessProps {
  message: string
  className?: string
}

export const FormSuccess: React.FC<FormSuccessProps> = ({ message, className }) => {
  return (
    <div 
      className={cn(
        "flex items-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3",
        "dark:text-green-300 dark:bg-green-950 dark:border-green-800",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}