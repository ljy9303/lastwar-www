"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ApiErrorAlertProps {
  title?: string
  error: string
  onRetry?: () => void
}

export function ApiErrorAlert({ title = "API 오류", error, onRetry }: ApiErrorAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="mb-2">{error}</div>
        <div className="flex gap-2 mt-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setDismissed(true)}>
            닫기
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
