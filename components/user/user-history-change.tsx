import type { UserHistoryChanges } from "@/types/user-history"
import { Badge } from "@/components/ui/badge"

interface UserHistoryChangeProps {
  changes: UserHistoryChanges
  isNicknameHistoryOnly?: boolean  // 닉네임 변경 이력만 표시할지 여부
}

// 전투력 포맷팅 함수 (1 = 1백만)
const formatPower = (power: number): string => {
  if (power === 0) return "0"
  if (power < 1) {
    return `${(power * 100).toFixed(0)}만`
  }
  if (power >= 1000) {
    return `${(power / 1000).toFixed(1)}B`
  }
  if (power >= 100) {
    return `${power.toFixed(0)}M`
  }
  return `${power.toFixed(1)}M`
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
            {formatPower(changes.user_power.old)} → {formatPower(changes.user_power.new)}
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

    // 사용자 데이터 통합 변경 사항 처리 (한국어 및 영어 필드명 모두 지원)
    const isUserMerge = changes["작업유형"] === "사용자 데이터 통합" || changes["action"] === "USER_MERGE"
    if (isUserMerge) {
      const sourceUser = changes["소스사용자"] || changes["sourceUser"]
      const targetUser = changes["타겟사용자"] || changes["targetUser"]  
      const mergeTime = changes["통합시각"] || changes["mergeTime"]
      
      changeItems.push(
        <div key="merge" className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-600">사용자 데이터 통합</Badge>
          </div>
          
          {sourceUser && typeof sourceUser === 'object' && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-800">통합된 사용자 정보:</div>
              <div className="text-sm text-muted-foreground pl-4">
                <div>닉네임: {sourceUser["닉네임"] || sourceUser["name"] || "N/A"}</div>
                <div>레벨: {sourceUser["레벨"] || sourceUser["level"] || "N/A"}</div>
                <div>전투력: {formatPower(sourceUser["전투력"] || sourceUser["power"] || 0)}</div>
                <div>사용자ID: {sourceUser["사용자ID"] || sourceUser["userSeq"] || "N/A"}</div>
              </div>
            </div>
          )}
          
          {targetUser && typeof targetUser === 'object' && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-800">통합 대상 사용자 정보:</div>
              <div className="text-sm text-muted-foreground pl-4">
                <div>닉네임: {targetUser["닉네임"] || targetUser["name"] || "N/A"}</div>
                <div>레벨: {targetUser["레벨"] || targetUser["level"] || "N/A"}</div>
                <div>전투력: {formatPower(targetUser["전투력"] || targetUser["power"] || 0)}</div>
                <div>사용자ID: {targetUser["사용자ID"] || targetUser["userSeq"] || "N/A"}</div>
              </div>
            </div>
          )}
          
          {mergeTime && (
            <div className="text-xs text-muted-foreground">
              통합 시각: {new Date(mergeTime).toLocaleString('ko-KR')}
            </div>
          )}
        </div>
      )
    }

    // 위에서 처리하지 않은 다른 변경 사항이 있을 경우
    const handledKeys = ["user_name", "is_leave", "user_power", "user_level", "작업유형", "소스사용자", "타겟사용자", "통합시각", "action", "sourceUser", "targetUser", "mergeTime"]
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
