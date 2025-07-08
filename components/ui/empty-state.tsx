"use client"

import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Users, CalendarDays, AlertCircle, FileText, BarChart3, Trophy, Search } from "lucide-react"

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "users" | "events" | "error" | "search" | "reports" | "competitions" | "documents"
}

const iconMap = {
  default: Database,
  users: Users,
  events: CalendarDays,
  error: AlertCircle,
  search: Search,
  reports: BarChart3,
  competitions: Trophy,
  documents: FileText,
}

const contentMap = {
  default: {
    title: "데이터가 없습니다",
    description: "아직 표시할 데이터가 없습니다.",
  },
  users: {
    title: "등록된 사용자가 없습니다",
    description: "아직 이 서버/연맹에 등록된 사용자가 없습니다. 첫 번째 사용자를 추가해보세요.",
  },
  events: {
    title: "이벤트 기록이 없습니다",
    description: "아직 사막전이나 이벤트 기록이 없습니다.",
  },
  error: {
    title: "데이터를 불러올 수 없습니다",
    description: "데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  },
  search: {
    title: "검색 결과가 없습니다",
    description: "검색 조건에 맞는 결과를 찾을 수 없습니다. 다른 키워드로 검색해보세요.",
  },
  reports: {
    title: "리포트 데이터가 없습니다",
    description: "생성된 리포트나 통계 데이터가 없습니다.",
  },
  competitions: {
    title: "경쟁 기록이 없습니다",
    description: "아직 참여한 경쟁이나 대회 기록이 없습니다.",
  },
  documents: {
    title: "문서가 없습니다",
    description: "업로드된 문서나 파일이 없습니다.",
  },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default"
}: EmptyStateProps) {
  const Icon = icon || iconMap[variant]
  const content = {
    title: title || contentMap[variant].title,
    description: description || contentMap[variant].description,
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 p-3 rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {content.description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// 리스트용 빈 상태 컴포넌트
interface EmptyListProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyList({ title, description, action }: EmptyListProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-muted">
        <Database className="h-6 w-6 text-muted-foreground" />
      </div>
      <h4 className="text-base font-medium mb-1">
        {title || "데이터가 없습니다"}
      </h4>
      <p className="text-sm text-muted-foreground mb-4">
        {description || "표시할 항목이 없습니다."}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}