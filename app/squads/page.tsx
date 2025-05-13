"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, Save, AlertTriangle, Loader2, Pencil, ChevronDown, X, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSquads, saveSquads, type SquadMember } from "@/app/actions/squad-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserForm } from "@/components/user/user-form"
import type { User } from "@/types/user"
import { PositionStatusBoard } from "@/components/squad/position-status-board"

// 로컬에서 SquadUpdateRequest 타입 확장
interface SquadUpdateRequest {
  userSeq: number
  desertType: string
  position?: number
  isCandidate?: boolean
}

// 팀 상수
const TEAM = {
  A_TEAM: "A_TEAM",
  B_TEAM: "B_TEAM",
  A_RESERVE: "A_RESERVE",
  B_RESERVE: "B_RESERVE",
  UNASSIGNED: "AB_POSSIBLE", // 이 값은 desertType으로 저장되지 않음
  EXCLUDED: "NONE",
}

// desertType 상수 - API로 전송되는 실제 값
const DESERT_TYPE = {
  A_TEAM: "A_TEAM",
  B_TEAM: "B_TEAM",
  A_RESERVE: "A_RESERVE",
  B_RESERVE: "B_RESERVE",
  NONE: "NONE",
}

// Add position constants at the top of the file, after the TEAM constants
const POSITIONS = [
  { value: -1, label: "포지션 없음" },
  { value: 0, label: "공격지원" },
  { value: 1, label: "1시" },
  { value: 2, label: "2시" },
  { value: 4, label: "4시" },
  { value: 5, label: "5시" },
  { value: 7, label: "7시" },
  { value: 8, label: "8시" },
  { value: 10, label: "10시" },
  { value: 11, label: "11시" },
]

// Function to sort users based on level and name
const sortUsers = (users: SquadMember[]): SquadMember[] => {
  return [...users].sort((a, b) => {
    // First, sort by userLevel in descending order
    const levelComparison = b.userLevel - a.userLevel
    if (levelComparison !== 0) {
      return levelComparison
    }

    // If levels are the same, sort by userName in ascending order
    return a.userName.localeCompare(b.userName)
  })
}

export default function SquadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const eventId = searchParams.get("eventId")

  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  // Update the pendingChanges state to include position information
  const [pendingChanges, setPendingChanges] = useState<Record<number, { desertType: string; position: number }>>({})
  const [selectedTeamType, setSelectedTeamType] = useState<string | null>(null)
  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // 팀 확장/축소 상태
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({
    teamA: true,
    teamB: true,
  })

  // Sort direction states
  const [sortNameDirection, setSortNameDirection] = useState<"asc" | "desc">("asc")
  const [sortLevelDirection, setSortLevelDirection] = useState<"asc" | "desc">("desc")

  // 팀 배정 상태
  const [squads, setSquads] = useState({
    [TEAM.A_TEAM]: [] as SquadMember[],
    [TEAM.B_TEAM]: [] as SquadMember[],
    [TEAM.A_RESERVE]: [] as SquadMember[],
    [TEAM.B_RESERVE]: [] as SquadMember[],
    [TEAM.UNASSIGNED]: [] as SquadMember[],
    [TEAM.EXCLUDED]: [] as SquadMember[],
  })

  // 이벤트 ID가 없으면 이벤트 목록 페이지로 리다이렉트
  useEffect(() => {
    if (!eventId) {
      router.push("/events")
    }
  }, [eventId, router])

  // 이벤트 정보와 스쿼드 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return

      setIsLoading(true)
      try {
        // 이벤트 정보 로드
        const eventData = await getDesertById(Number(eventId))
        setSelectedEvent(eventData)

        // 스쿼드 데이터 로드
        const squadData = await getSquads(Number(eventId))
        setSquadMembers(squadData)

        // 스쿼드 데이터 기반으로 팀 배정
        organizeSquadsByTeam(squadData)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId, toast])

  // 스쿼드 데이터를 팀별로 정리
  const organizeSquadsByTeam = (members: SquadMember[]) => {
    const initialSquads = {
      [TEAM.A_TEAM]: [] as SquadMember[],
      [TEAM.B_TEAM]: [] as SquadMember[],
      [TEAM.A_RESERVE]: [] as SquadMember[],
      [TEAM.B_RESERVE]: [] as SquadMember[],
      [TEAM.UNASSIGNED]: [] as SquadMember[],
      [TEAM.EXCLUDED]: [] as SquadMember[],
    }

    // 배정 로직
    members.forEach((member) => {
      // 이미 팀이 배정된 경우 (desertType이 있는 경우)
      if (member.desertType && member.desertType !== "NONE") {
        switch (member.desertType) {
          case TEAM.A_TEAM:
            initialSquads[TEAM.A_TEAM].push(member)
            break
          case TEAM.B_TEAM:
            initialSquads[TEAM.B_TEAM].push(member)
            break
          case TEAM.A_RESERVE:
            initialSquads[TEAM.A_RESERVE].push(member)
            break
          case TEAM.B_RESERVE:
            initialSquads[TEAM.B_RESERVE].push(member)
            break
          case TEAM.EXCLUDED:
            initialSquads[TEAM.EXCLUDED].push(member)
            break
          default:
            initialSquads[TEAM.UNASSIGNED].push(member)
        }
      } else {
        // 팀이 배정되지 않은 경우 또는 desertType이 "NONE"인 경우, intentType 기반으로 초기 배정
        if (member.intentType !== "NONE") {
          // intentType이 AB_POSSIBLE이고 isCandidate가 false인 경우에만 UNASSIGNED 그룹에 배치
          if (member.intentType === "AB_POSSIBLE" && !member.isCandidate) {
            initialSquads[TEAM.UNASSIGNED].push(member)
          } else if (member.desertType === "NONE" && member.intentType === "AB_POSSIBLE" && member.isCandidate) {
            // AB_POSSIBLE이고 isCandidate가 true이면서 desertType이 NONE인 경우 제외 영역으로
            initialSquads[TEAM.EXCLUDED].push(member)
          } else {
            switch (member.intentType) {
              case "A_TEAM":
                initialSquads[TEAM.A_TEAM].push(member)
                break
              case "B_TEAM":
                initialSquads[TEAM.B_TEAM].push(member)
                break
              case "A_RESERVE":
                initialSquads[TEAM.A_RESERVE].push(member)
                break
              case "B_RESERVE":
                initialSquads[TEAM.B_RESERVE].push(member)
                break
              case "AB_POSSIBLE":
                initialSquads[TEAM.UNASSIGNED].push(member)
                break
              default:
                initialSquads[TEAM.UNASSIGNED].push(member)
            }
          }
        } else {
          // intentType이 "NONE"인 경우 제외 영역으로
          initialSquads[TEAM.EXCLUDED].push(member)
        }
      }
    })

    // 각 팀을 정렬
    Object.keys(initialSquads).forEach((team) => {
      initialSquads[team] = sortUsers(initialSquads[team])
    })

    setSquads(initialSquads)
  }

  // 팀 이름 표시
  const getTeamName = (team: string) => {
    switch (team) {
      case TEAM.A_TEAM:
        return "A조"
      case TEAM.B_TEAM:
        return "B조"
      case TEAM.A_RESERVE:
        return "A조 예비"
      case TEAM.B_RESERVE:
        return "B조 예비"
      case TEAM.UNASSIGNED:
        return "미배정"
      case TEAM.EXCLUDED:
        return "제외"
      default:
        return team
    }
  }

  // 선호도 표시
  const getPreferenceLabel = (preference: string) => {
    switch (preference) {
      case "A_TEAM":
        return "A조"
      case "B_TEAM":
        return "B조"
      case "A_RESERVE":
        return "A조 예비"
      case "B_RESERVE":
        return "B조 예비"
      case "AB_POSSIBLE":
        return "AB 가능"
      case "AB_IMPOSSIBLE":
        return "AB 불가능"
      case "NONE":
        return "미참여"
      default:
        return preference
    }
  }

  // Update the moveUser function to include position information
  const moveUser = useCallback(
    (userId: number, fromTeam: string, toTeam: string) => {
      // 인원 초과 경고 표시 (이동은 허용)
      if (
        (toTeam === TEAM.A_TEAM && squads[TEAM.A_TEAM].length >= 20) ||
        (toTeam === TEAM.B_TEAM && squads[TEAM.B_TEAM].length >= 20)
      ) {
        toast({
          title: "인원 초과",
          description: "주전 인원이 20명을 초과했습니다.",
          variant: "warning",
        })
      }

      // 예비 인원 초과 경고 표시 (이동은 허용)
      if (
        (toTeam === TEAM.A_RESERVE && squads[TEAM.A_RESERVE].length >= 10) ||
        (toTeam === TEAM.B_RESERVE && squads[TEAM.B_RESERVE].length >= 10)
      ) {
        toast({
          title: "인원 초과",
          description: "예비 인원이 10명을 초과했습니다.",
          variant: "warning",
        })
      }

      const newSquads = { ...squads }
      const userIndex = newSquads[fromTeam].findIndex((u) => u.userSeq === userId)

      if (userIndex !== -1) {
        const user = newSquads[fromTeam][userIndex]
        newSquads[fromTeam].splice(userIndex, 1)

        // 미배정 인원으로 이동할 때는 최상단에 배치
        if (toTeam === TEAM.UNASSIGNED) {
          newSquads[toTeam].unshift(user)
        } else {
          newSquads[toTeam].push(user)
          // 미배정이 아닌 다른 팀으로 이동할 때만 정렬
          newSquads[toTeam] = sortUsers(newSquads[toTeam])
        }

        setSquads(newSquads)

        // 변경 사항 기록 - 현재 포지션 유지
        const currentPosition = user.position || -1

        // intentType이 AB_POSSIBLE이고 모두 가능으로 이동할 때는 desertType을 null로 설정
        // 다른 팀으로 이동할 때는 해당 팀의 desertType 값 사용
        const desertType =
          toTeam === TEAM.UNASSIGNED && user.intentType === "AB_POSSIBLE"
            ? null
            : toTeam === TEAM.EXCLUDED
              ? DESERT_TYPE.NONE
              : DESERT_TYPE[toTeam as keyof typeof DESERT_TYPE]

        setPendingChanges((prev) => ({
          ...prev,
          [userId]: { desertType, position: -1 }, // 포지션을 -1로 초기화
        }))
      }
    },
    [squads, toast],
  )

  // Add a function to update user position
  const updateUserPosition = (userId: number, position: number) => {
    // Find the user in all squads
    let userTeam = ""
    let user: SquadMember | null = null

    Object.entries(squads).forEach(([team, members]) => {
      const foundUser = members.find((m) => m.userSeq === userId)
      if (foundUser) {
        userTeam = team
        user = foundUser
      }
    })

    if (user && userTeam) {
      // Update the user's position in the local state
      const newSquads = { ...squads }
      const userIndex = newSquads[userTeam].findIndex((u) => u.userSeq === userId)
      if (userIndex !== -1) {
        newSquads[userTeam][userIndex] = { ...newSquads[userTeam][userIndex], position }

        setSquads(newSquads)
      }

      // Record the change
      setPendingChanges((prev) => {
        // If there's already a pending change for this user, update it
        if (prev[userId]) {
          return {
            ...prev,
            [userId]: { ...prev[userId], position },
          }
        }
        // Otherwise create a new pending change
        return {
          ...prev,
          [userId]: { desertType: userTeam, position },
        }
      })
    }
  }

  // Update the saveChanges function to include position information and correct desertType values
  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0 && squads[TEAM.UNASSIGNED].length === 0) return

    setIsSaving(true)
    try {
      // 모든 모두 가능 섹션 인원들에 대해 desertType을 null로 설정하여 요청에 포함
      const allChanges = { ...pendingChanges }

      // 모두 가능 섹션의 모든 인원들을 요청에 추가
      squads[TEAM.UNASSIGNED].forEach((user) => {
        if (!allChanges[user.userSeq]) {
          allChanges[user.userSeq] = {
            desertType: null,
            position: user.position || -1,
          }
        }
      })

      const request = {
        desertSeq: Number(eventId),
        rosters: Object.entries(allChanges).map(([userSeq, change]) => {
          // 해당 유저 찾기
          const user = squadMembers.find((member) => member.userSeq === Number(userSeq))

          // intentType이 AB_POSSIBLE이고 desertType이 NONE인 경우 isCandidate를 true로 설정
          const isCandidate = user?.intentType === "AB_POSSIBLE" && change.desertType === DESERT_TYPE.NONE

          // intentType이 AB_POSSIBLE인 경우 모두 가능으로 돌아갈 때 desertType을 null로 유지
          if (change.desertType === null && user?.intentType === "AB_POSSIBLE") {
            return {
              userSeq: Number(userSeq),
              desertType: null, // null로 설정
              position: change.position,
              isCandidate: false, // 모두 가능으로 돌아갈 때는 isCandidate를 false로 설정
            }
          }

          return {
            userSeq: Number(userSeq),
            desertType: change.desertType,
            position: change.position,
            isCandidate: isCandidate || undefined,
          }
        }),
      }

      await saveSquads(request)

      // 로컬 상태 업데이트
      const updatedSquadMembers = squadMembers.map((member) => {
        if (allChanges[member.userSeq]) {
          const isCandidate =
            member.intentType === "AB_POSSIBLE" && allChanges[member.userSeq].desertType === DESERT_TYPE.NONE

          return {
            ...member,
            desertType: allChanges[member.userSeq].desertType,
            position: allChanges[member.userSeq].position,
            isCandidate: isCandidate || member.isCandidate,
          }
        }
        return member
      })
      setSquadMembers(updatedSquadMembers)
      organizeSquadsByTeam(updatedSquadMembers)

      // 변경 사항 초기화
      setPendingChanges({})

      toast({
        title: "저장 완료",
        description: "스쿼드 변경 사항이 저장되었습니다.",
      })
    } catch (error) {
      console.error("스쿼드 저장 실패:", error)
      toast({
        title: "오류 발생",
        description: "스쿼드 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 팀 확정 함수
  const confirmSquads = async () => {
    if (squads[TEAM.UNASSIGNED].length > 0) {
      toast({
        title: "모두 가능 인원 존재",
        description: "모두 가능 인원이 존재합니다. 모든 인원을 팀에 배정해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsConfirming(true)
    try {
      // 모든 인원에 대한 변경사항 생성
      const allChanges: Record<number, { desertType: string; position: number }> = {}

      // A팀 인원
      squads[TEAM.A_TEAM].forEach((user) => {
        allChanges[user.userSeq] = {
          desertType: DESERT_TYPE.A_TEAM,
          position: user.position || -1,
        }
      })

      // B팀 인원
      squads[TEAM.B_TEAM].forEach((user) => {
        allChanges[user.userSeq] = {
          desertType: DESERT_TYPE.B_TEAM,
          position: user.position || -1,
        }
      })

      // A팀 예비 인원
      squads[TEAM.A_RESERVE].forEach((user) => {
        allChanges[user.userSeq] = {
          desertType: DESERT_TYPE.A_RESERVE,
          position: user.position || -1,
        }
      })

      // B팀 예비 인원
      squads[TEAM.B_RESERVE].forEach((user) => {
        allChanges[user.userSeq] = {
          desertType: DESERT_TYPE.B_RESERVE,
          position: user.position || -1,
        }
      })

      // 제외 인원
      squads[TEAM.EXCLUDED].forEach((user) => {
        allChanges[user.userSeq] = {
          desertType: DESERT_TYPE.NONE,
          position: user.position || -1,
        }
      })

      const request = {
        desertSeq: Number(eventId),
        rosters: Object.entries(allChanges).map(([userSeq, change]) => {
          // 해당 유저 찾기
          const user = squadMembers.find((member) => member.userSeq === Number(userSeq))

          // intentType이 AB_POSSIBLE이고 desertType이 NONE인 경우 isCandidate를 true로 설정
          const isCandidate = user?.intentType === "AB_POSSIBLE" && change.desertType === DESERT_TYPE.NONE

          return {
            userSeq: Number(userSeq),
            desertType: change.desertType,
            position: change.position,
            isCandidate: isCandidate || undefined,
          }
        }),
      }

      await saveSquads(request)

      // 로컬 상태 업데이트
      const updatedSquadMembers = squadMembers.map((member) => {
        if (allChanges[member.userSeq]) {
          const isCandidate =
            member.intentType === "AB_POSSIBLE" && allChanges[member.userSeq].desertType === DESERT_TYPE.NONE

          return {
            ...member,
            desertType: allChanges[member.userSeq].desertType,
            position: allChanges[member.userSeq].position,
            isCandidate: isCandidate || member.isCandidate,
          }
        }
        return member
      })
      setSquadMembers(updatedSquadMembers)
      organizeSquadsByTeam(updatedSquadMembers)

      // 변경 사항 초기화
      setPendingChanges({})
      setIsConfirmed(true)

      toast({
        title: "팀 확정 완료",
        description: "스쿼드 구성이 확정되었습니다.",
      })
    } catch (error) {
      console.error("팀 확정 실패:", error)
      toast({
        title: "오류 발생",
        description: "팀 확정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  // 필터링된 유저 목록
  const getFilteredUsers = (team: string) => {
    return squads[team].filter((user) => user.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // 팀별 멤버 목록 가져오기
  const getTeamMembers = (teamType: string) => {
    return squads[teamType] || []
  }

  // Update the getPositionLabel function to display position names
  const getPositionLabel = (position: number) => {
    if (position === -1) return "" // 포지션 값이 -1이면 빈 문자열 반환
    if (position === 0) return "공격지원"
    if (position === 1) return "1시"
    if (position === 2) return "2시"
    if (position === 4) return "4시"
    if (position === 5) return "5시"
    if (position === 7) return "7시"
    if (position === 8) return "8시"
    if (position === 10) return "10시"
    if (position === 11) return "11시"
    return "포지션 없음"
  }

  const teamMenuItems = useMemo(() => {
    return (team: string, userSeq: number, intentType: string) => (
      <>
        {team !== TEAM.A_TEAM && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.A_TEAM)}>A조</DropdownMenuItem>
        )}
        {team !== TEAM.B_TEAM && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.B_TEAM)}>B조</DropdownMenuItem>
        )}
        {team !== TEAM.A_RESERVE && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.A_RESERVE)}>A조 예비</DropdownMenuItem>
        )}
        {team !== TEAM.B_RESERVE && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.B_RESERVE)}>B조 예비</DropdownMenuItem>
        )}
        {/* intentType이 AB_POSSIBLE인 경우에만 AB 가능 옵션 표시 */}
        {team !== TEAM.UNASSIGNED && intentType === "AB_POSSIBLE" && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.UNASSIGNED)}>AB 가능</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {team !== TEAM.EXCLUDED && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.EXCLUDED)} className="text-destructive">
            제외
          </DropdownMenuItem>
        )}
      </>
    )
  }, [moveUser])

  const renderUserCard = (user: SquadMember, team: string) => {
    const isPreferenceMatched =
      (team === TEAM.A_TEAM && user.intentType === "A_TEAM") ||
      (team === TEAM.B_TEAM && user.intentType === "B_TEAM") ||
      (team === TEAM.A_RESERVE && user.intentType === "A_RESERVE") ||
      (team === TEAM.B_RESERVE && user.intentType === "B_RESERVE")

    // Check if desertType exists and is not "NONE" to apply green highlighting
    // const hasDesertType = !!user.desertType && user.desertType !== "NONE"

    // Get the current position (from pending changes or user data)
    const currentPosition = pendingChanges[user.userSeq] ? pendingChanges[user.userSeq].position : user.position || -1

    return (
      <div key={user.userSeq} className="p-3 mb-2 rounded-lg border bg-background" id={`user-${user.userSeq}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="font-medium">{user.userName}</div>
            <div className="text-sm text-muted-foreground">
              Lv.{user.userLevel} | {user.userPower.toLocaleString()}
            </div>
            <Badge variant={isPreferenceMatched ? "outline" : "secondary"} size="sm">
              {getPreferenceLabel(user.intentType)}
            </Badge>
            {currentPosition !== -1 && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                {getPositionLabel(currentPosition)}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(user)}>
              <Pencil className="h-3 w-3" />
              <span className="sr-only">수정</span>
            </Button>

            {/* Add X button to move user to unassigned section - intentType이 AB_POSSIBLE인 경우에만 표시 */}
            {!!user.desertType &&
              user.desertType !== "NONE" &&
              user.intentType === "AB_POSSIBLE" &&
              team !== TEAM.UNASSIGNED && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                  onClick={() => moveUser(user.userSeq, team, TEAM.UNASSIGNED)}
                  title="미배정으로 이동 (최상단에 배치)"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">미배정으로 이동</span>
                </Button>
              )}

            {/* 모두 가능 섹션에서는 제외 버튼 표시 */}
            {team === TEAM.UNASSIGNED && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={() => moveUser(user.userSeq, team, TEAM.EXCLUDED)}
                title="제외 목록으로 이동"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">제외로 이동</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  data-state="closed"
                  aria-haspopup="menu"
                  tabIndex={0}
                >
                  팀 변경
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="min-w-[8rem]">
                {teamMenuItems(team, user.userSeq, user.intentType)}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* A팀과 B팀에서만 포지션 버튼 표시 */}
            {(team === TEAM.A_TEAM || team === TEAM.B_TEAM) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7">
                    포지션
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {POSITIONS.map((position) => (
                    <DropdownMenuItem
                      key={position.value}
                      onClick={() => updateUserPosition(user.userSeq, position.value)}
                      className={currentPosition === position.value ? "bg-accent" : ""}
                    >
                      {position.value !== -1 ? `${position.value}시 - ${position.label}` : position.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Function to open the edit dialog
  const openEditDialog = (user: User) => {
    setCurrentUser(user)
    setIsEditDialogOpen(true)
  }

  // Function to handle successful edit
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setCurrentUser(null)
    // Optionally refresh data or update local state
    const loadData = async () => {
      if (!eventId) return

      setIsLoading(true)
      try {
        // 스쿼드 데이터 로드
        const squadData = await getSquads(Number(eventId))
        setSquadMembers(squadData)

        // 스쿼드 데이터 기반으로 팀 배정
        organizeSquadsByTeam(squadData)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }

  if (!eventId) {
    return (
      <div className="container mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>스쿼드를 조회할 사막전 ID가 필요합니다. 사막전 관리 페이지로 이동합니다.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">스쿼드 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={eventId ? `/events/${eventId}` : "/events"}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">스쿼드 관리 {selectedEvent && `- ${selectedEvent.title}`}</h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="닉네임으로 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm whitespace-nowrap">레벨:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortLevelDirection((prev) => (prev === "asc" ? "desc" : "asc"))
              }}
              className="h-8 px-2"
            >
              {sortLevelDirection === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {Object.keys(pendingChanges).length > 0 && (
            <Button onClick={saveChanges} disabled={isSaving} className="flex-1 md:flex-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  변경사항 저장 ({Object.keys(pendingChanges).length})
                </>
              )}
            </Button>
          )}

          <Button
            onClick={confirmSquads}
            disabled={isConfirming || squads[TEAM.UNASSIGNED].length > 0}
            className="flex-1 md:flex-auto"
            variant="outline"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                확정 중...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />팀 확정
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 포지션 현황판 */}
      <div className="mb-6">
        <PositionStatusBoard
          teamAMembers={squads[TEAM.A_TEAM]}
          teamBMembers={squads[TEAM.B_TEAM]}
          teamAReserveMembers={squads[TEAM.A_RESERVE]}
          teamBReserveMembers={squads[TEAM.B_RESERVE]}
          reserveMembers={squads[TEAM.EXCLUDED]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>A조 ({squads[TEAM.A_TEAM].length}/20)</CardTitle>
              {squads[TEAM.A_TEAM].length > 20 && <Badge variant="destructive">초과</Badge>}
            </div>
            <CardDescription>A조 출전 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_TEAM).length > 0 ? (
              getFilteredUsers(TEAM.A_TEAM).map((user) => renderUserCard(user, TEAM.A_TEAM))
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>B조 ({squads[TEAM.B_TEAM].length}/20)</CardTitle>
              {squads[TEAM.B_TEAM].length > 20 && <Badge variant="destructive">초과</Badge>}
            </div>
            <CardDescription>B조 주전 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.B_TEAM).length > 0 ? (
              getFilteredUsers(TEAM.B_TEAM).map((user) => renderUserCard(user, TEAM.B_TEAM))
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* A팀 예비 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>A조 예비 ({squads[TEAM.A_RESERVE].length}/10)</CardTitle>
              {squads[TEAM.A_RESERVE].length > 10 && <Badge variant="destructive">초과</Badge>}
            </div>
            <CardDescription>Aㅈ 예비 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_RESERVE).length > 0 ? (
              getFilteredUsers(TEAM.A_RESERVE).map((user) => renderUserCard(user, TEAM.A_RESERVE))
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 예비 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>B조 예비 ({squads[TEAM.B_RESERVE].length}/10)</CardTitle>
              {squads[TEAM.B_RESERVE].length > 10 && <Badge variant="destructive">초과</Badge>}
            </div>
            <CardDescription>B조 예비 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.B_RESERVE).length > 0 ? (
              getFilteredUsers(TEAM.B_RESERVE).map((user) => renderUserCard(user, TEAM.B_RESERVE))
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* 모두 가능 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>모두 가능</CardTitle>
            <CardDescription>A조/B조 모두 참여 가능한 인원</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.UNASSIGNED).length > 0 ? (
              getFilteredUsers(TEAM.UNASSIGNED).map((user) => renderUserCard(user, TEAM.UNASSIGNED))
            ) : (
              <div className="text-center py-4 text-muted-foreground">모두 가능 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* 미배정 인원 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>미배정 인원</CardTitle>
            <CardDescription>참여 제외된 인원</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>닉네임</TableHead>
                    <TableHead className="hidden sm:table-cell">레벨</TableHead>
                    <TableHead className="hidden sm:table-cell">전투력</TableHead>
                    <TableHead>선호</TableHead>
                    <TableHead className="hidden md:table-cell">포지션</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredUsers(TEAM.EXCLUDED).length > 0 ? (
                    getFilteredUsers(TEAM.EXCLUDED).map((user) => {
                      const userPosition = pendingChanges[user.userSeq]
                        ? pendingChanges[user.userSeq].position
                        : user.position || -1

                      return (
                        <TableRow key={user.userSeq} id={`user-${user.userSeq}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.userName}</div>
                              <div className="sm:hidden text-xs text-muted-foreground">
                                Lv.{user.userLevel} | {user.userPower.toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{user.userLevel}</TableCell>
                          <TableCell className="hidden sm:table-cell">{user.userPower.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" size="sm">
                              {getPreferenceLabel(user.intentType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {userPosition !== -1 ? getPositionLabel(userPosition) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => openEditDialog(user)}
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">수정</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7"
                                    data-state="closed"
                                    aria-haspopup="menu"
                                    tabIndex={0}
                                  >
                                    팀 변경
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={4} className="min-w-[8rem]">
                                  <DropdownMenuItem onClick={() => moveUser(user.userSeq, TEAM.EXCLUDED, TEAM.A_TEAM)}>
                                    A조
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => moveUser(user.userSeq, TEAM.EXCLUDED, TEAM.B_TEAM)}>
                                    B조
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => moveUser(user.userSeq, TEAM.EXCLUDED, TEAM.A_RESERVE)}
                                  >
                                    A조 예비
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => moveUser(user.userSeq, TEAM.EXCLUDED, TEAM.B_RESERVE)}
                                  >
                                    B조 예비
                                  </DropdownMenuItem>
                                  {/* intentType이 AB_POSSIBLE인 경우에만 AB 가능 옵션 표시 */}
                                  {user.intentType === "AB_POSSIBLE" && (
                                    <DropdownMenuItem
                                      onClick={() => moveUser(user.userSeq, TEAM.EXCLUDED, TEAM.UNASSIGNED)}
                                    >
                                      AB 가능
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        미배정 유저가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 팀 멤버 목록 다이얼로그 */}
      <Dialog open={isTeamMembersDialogOpen} onOpenChange={setIsTeamMembersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTeamType && getTeamName(selectedTeamType)} 멤버 목록</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedTeamType && getTeamMembers(selectedTeamType).length > 0 ? (
              <div className="space-y-2">
                {getTeamMembers(selectedTeamType).map((member) => {
                  const memberPosition = pendingChanges[member.userSeq]
                    ? pendingChanges[member.userSeq].position
                    : member.position || -1

                  return (
                    <div key={member.userSeq} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <div className="font-medium">{member.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          Lv.{member.userLevel} | {member.userPower.toLocaleString()}
                          {memberPosition !== -1 && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400">
                              {getPositionLabel(memberPosition)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsTeamMembersDialogOpen(false)
                          // 테이블에서 해당 유저로 스크롤
                          const userRow = document.getElementById(`user-${member.userSeq}`)
                          if (userRow) {
                            userRow.scrollIntoView({ behavior: "smooth", block: "center" })
                            // 하이라이트 효과
                            userRow.classList.add("bg-accent")
                            setTimeout(() => {
                              userRow.classList.remove("bg-accent")
                            }, 2000)
                          }
                        }}
                      >
                        찾기
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">멤버가 없습니다</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 유저 수정 다이얼로그 */}
      {currentUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>유저 정보 수정</DialogTitle>
            </DialogHeader>
            <UserForm
              mode="edit"
              user={currentUser}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setCurrentUser(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
