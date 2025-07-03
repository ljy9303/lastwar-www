import type { UserHistoryChanges } from "@/types/user-history"
import { Badge } from "@/components/ui/badge"

interface UserHistoryChangeProps {
  changes: UserHistoryChanges
  isNicknameHistoryOnly?: boolean  // 닉네임 변경 이력만 표시할지 여부
}

export function UserHistoryChange({ changes, isNicknameHistoryOnly = false }: UserHistoryChangeProps) {
  // 변경 내역을 사용자 친화적인 텍스트로 변환
  const renderChange = () => {
    const changeItems = []

    if (changes.user_name) {
      changeItems.push(
        <div key="name" className="flex items-center gap-2">
          <Badge variant="outline">닉네임 변경</Badge>
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-600">{changes.user_name.old}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-green-600">{changes.user_name.new}</span>
          </div>
        </div>,
      )
    }

    if (changes.is_leave !== undefined) {
      const oldStatus = changes.is_leave.old ? "탈퇴" : "활동중"
      const newStatus = changes.is_leave.new ? "탈퇴" : "활동중"

      changeItems.push(
        <div key="leave" className="flex flex-col">
          <span className="font-medium">연맹 탈퇴 상태 변경</span>
          <span className="text-sm text-muted-foreground">
            {oldStatus} → {newStatus}
          </span>
        </div>,
      )
    }

    // 닉네임 변경 이력에서는 전투력 필드 제외
    if (changes.user_power !== undefined && !isNicknameHistoryOnly) {
      changeItems.push(
        <div key="power" className="flex flex-col">
          <span className="font-medium">전투력 변경</span>
          <span className="text-sm text-muted-foreground">
            {changes.user_power.old.toLocaleString()} → {changes.user_power.new.toLocaleString()}
          </span>
        </div>,
      )
    }

    if (changes.user_level !== undefined) {
      changeItems.push(
        <div key="level" className="flex flex-col">
          <span className="font-medium">레벨 변경</span>
          <span className="text-sm text-muted-foreground">
            {changes.user_level.old} → {changes.user_level.new}
          </span>
        </div>,
      )
    }

    // 위에서 처리하지 않은 다른 변경 사항이 있을 경우
    const handledKeys = ["user_name", "is_leave", "user_power", "user_level"]
    Object.keys(changes).forEach((key) => {
      if (!handledKeys.includes(key) && changes[key]) {
        changeItems.push(
          <div key={key} className="flex flex-col">
            <span className="font-medium">{key.replace("user_", "").replace("_", " ")} 변경</span>
            <span className="text-sm text-muted-foreground">
              {String(changes[key]?.old)} → {String(changes[key]?.new)}
            </span>
          </div>,
        )
      }
    })

    return changeItems.length > 0 ? (
      <div className="space-y-2">{changeItems}</div>
    ) : (
      <span className="text-muted-foreground">변경 내역 없음</span>
    )
  }

  return renderChange()
}
