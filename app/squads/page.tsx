"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ArrowLeft,
  Save,
  AlertTriangle,
  Loader2,
  Pencil,
  ChevronDown,
  X,
  CheckCircle,
  Clipboard,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSquads, saveSquads, type SquadMember, type GroupedSquadResponse } from "@/app/actions/squad-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserForm } from "@/components/user/user-form"
import type { User } from "@/types/user"
import { PositionStatusBoard } from "@/components/squad/position-status-board"

// 팀 상수
const TEAM = {
  A_TEAM: "A_TEAM",
  B_TEAM: "B_TEAM",
  A_RESERVE: "A_RESERVE",
  B_RESERVE: "B_RESERVE",
  AB_POSSIBLE: "AB_POSSIBLE",
  NONE: "NONE", // 변경됨
}

// desertType 상수 - API로 전송되는 실제 값
const DESERT_TYPE = {
  A_TEAM: "A_TEAM",
  B_TEAM: "B_TEAM",
  A_RESERVE: "A_RESERVE",
  B_RESERVE: "B_RESERVE",
  AB_POSSIBLE: "AB_POSSIBLE",
  UNASSIGNED: "UNASSIGNED",
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
const sortUsers = (users: SquadMember[], levelDirection: "asc" | "desc" = "desc"): SquadMember[] => {
  return [...users].sort((a, b) => {
    // Sort by userLevel based on direction
    const levelComparison = levelDirection === "desc" ? b.userLevel - a.userLevel : a.userLevel - b.userLevel

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

  const [squadMembers, setSquadMembers] = useState<GroupedSquadResponse>({
    A_TEAM: [],
    B_TEAM: [],
    A_RESERVE: [],
    B_RESERVE: [],
    AB_POSSIBLE: [],
    NONE: [], // 변경됨
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<number, { desertType: string; position: number }>>({})
  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedTeamType, setSelectedTeamType] = useState<string | null>(null)

  // 팀 확장/축소 상태
  // const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({
  //   teamA: true,
  //   teamB: true,
  // })

  // Sort direction states
  // const [sortNameDirection, setSortNameDirection] = useState<"asc" | "desc">("asc")
  const [sortLevelDirection, setSortLevelDirection] = useState<"asc" | "desc">("desc")

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

        // API가 이미 그룹화된 데이터를 제공하므로 직접 설정
        setSquadMembers(squadData)

        // 각 그룹 정렬
        const sortedSquadData = {
          A_TEAM: sortUsers(squadData.A_TEAM || [], sortLevelDirection),
          B_TEAM: sortUsers(squadData.B_TEAM || [], sortLevelDirection),
          A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortLevelDirection),
          B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortLevelDirection),
          AB_POSSIBLE: squadData.AB_POSSIBLE || [],
          NONE: squadData.NONE || [],
        }

        setSquadMembers(sortedSquadData)
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
  }, [eventId, toast, sortLevelDirection])

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
      case TEAM.AB_POSSIBLE:
        return "AB 가능"
      case TEAM.NONE:
        return "미배정"
      default:
        return team
    }
  }

  // 클립보드에 복사할 텍스트 생성
  const generateClipboardText = (team: string) => {
    const members = [...squadMembers[team as keyof GroupedSquadResponse]].sort((a, b) => b.userLevel - a.userLevel)
    return members.map((member, index) => `${index + 1}. ${member.userName} (${member.userLevel})`).join("\n")
  }

  // 클립보드 복사 함수
  const copyToClipboard = (team: string) => {
    const text = generateClipboardText(team)
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "클립보드에 복사됨",
          description: `${getTeamName(team)} 멤버 목록이 클립보드에 복사되었습니다.`,
        })
      })
      .catch((err) => {
        toast({
          title: "복사 실패",
          description: "클립보드 복사 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        console.error("클립보드 복사 실패:", err)
      })
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
        (toTeam === TEAM.A_TEAM && squadMembers.A_TEAM.length >= 20) ||
        (toTeam === TEAM.B_TEAM && squadMembers.B_TEAM.length >= 20)
      ) {
        toast({
          title: "인원 초과",
          description: "주전 인원이 20명을 초과했습니다.",
          variant: "warning",
        })
      }

      // 예비 인원 초과 경고 표시 (이동은 허용)
      if (
        (toTeam === TEAM.A_RESERVE && squadMembers.A_RESERVE.length >= 10) ||
        (toTeam === TEAM.B_RESERVE && squadMembers.B_RESERVE.length >= 10)
      ) {
        toast({
          title: "인원 초과",
          description: "예비 인원이 10명을 초과했습니다.",
          variant: "warning",
        })
      }

      // 사용자 찾기
      const fromTeamKey = fromTeam as keyof GroupedSquadResponse
      const toTeamKey = toTeam as keyof GroupedSquadResponse

      const userIndex = squadMembers[fromTeamKey].findIndex((u) => u.userSeq === userId)

      if (userIndex !== -1) {
        const user = squadMembers[fromTeamKey][userIndex]

        // 새로운 상태 생성
        const newSquadMembers = { ...squadMembers }

        // 기존 팀에서 제거
        newSquadMembers[fromTeamKey] = [
          ...newSquadMembers[fromTeamKey].slice(0, userIndex),
          ...newSquadMembers[fromTeamKey].slice(userIndex + 1),
        ]

        // 새 팀에 추가
        if (toTeam === TEAM.AB_POSSIBLE || toTeam === TEAM.NONE) {
          // AB 가능이나 미배정으로 이동할 때는 최상단에 배치
          newSquadMembers[toTeamKey] = [user, ...newSquadMembers[toTeamKey]]
        } else {
          // 다른 팀으로 이동할 때는 추가 후 정렬
          newSquadMembers[toTeamKey] = sortUsers([...newSquadMembers[toTeamKey], user], sortLevelDirection)
        }

        setSquadMembers(newSquadMembers)

        // 변경 사항 기록
        setPendingChanges((prev) => ({
          ...prev,
          [userId]: {
            desertType: toTeam,
            position: -1, // 포지션을 -1로 초기화
          },
        }))
      }
    },
    [squadMembers, toast, sortLevelDirection],
  )

  // Add a function to update user position
  const updateUserPosition = (userId: number, position: number) => {
    // 모든 팀에서 사용자 찾기
    let userTeam: keyof GroupedSquadResponse | null = null
    let user: SquadMember | null = null

    Object.entries(squadMembers).forEach(([team, members]) => {
      const foundUser = members.find((m) => m.userSeq === userId)
      if (foundUser) {
        userTeam = team as keyof GroupedSquadResponse
        user = foundUser
      }
    })

    if (user && userTeam) {
      // 새로운 상태 생성
      const newSquadMembers = { ...squadMembers }
      const userIndex = newSquadMembers[userTeam].findIndex((u) => u.userSeq === userId)

      if (userIndex !== -1) {
        // 사용자 포지션 업데이트
        newSquadMembers[userTeam][userIndex] = {
          ...newSquadMembers[userTeam][userIndex],
          position,
        }

        setSquadMembers(newSquadMembers)
      }

      // 변경 사항 기록
      setPendingChanges((prev) => {
        // 이미 변경 사항이 있는 경우 업데이트
        if (prev[userId]) {
          return {
            ...prev,
            [userId]: { ...prev[userId], position },
          }
        }
        // 새로운 변경 사항 추가
        return {
          ...prev,
          [userId]: { desertType: userTeam, position },
        }
      })
    }
  }

  // Update the saveChanges function to include position information and correct desertType values
  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return

    setIsSaving(true)
    try {
      const request = {
        desertSeq: Number(eventId),
        rosters: Object.entries(pendingChanges).map(([userSeq, change]) => {
          return {
            userSeq: Number(userSeq),
            desertType: change.desertType,
            position: change.position,
            isCandidate: true, // API 변경에 따라 항상 true로 설정
          }
        }),
      }

      await saveSquads(request)

      // 데이터 다시 로드
      const squadData = await getSquads(Number(eventId))

      // 각 그룹 정렬
      const sortedSquadData = {
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortLevelDirection),
        B_TEAM: sortUsers(squadData.A_TEAM || [], sortLevelDirection),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortLevelDirection),
        B_RESERVE: sortUsers(squadData.B_TEAM || [], sortLevelDirection),
        AB_POSSIBLE: squadData.AB_POSSIBLE || [],
        NONE: squadData.NONE || [],
      }

      setSquadMembers(sortedSquadData)

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
    if (squadMembers.AB_POSSIBLE.length > 0) {
      toast({
        title: "AB 가능 인원 존재",
        description: "AB 가능 인원이 존재합니다. 모든 AB 가능 인원을 팀에 배정해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsConfirming(true)
    try {
      // 모든 인원에 대한 변경사항 생성
      const allChanges: Record<number, { desertType: string; position: number }> = {}

      // 각 팀의 모든 멤버에 대해 변경사항 생성
      Object.entries(squadMembers).forEach(([team, members]) => {
        if (team !== TEAM.AB_POSSIBLE && team !== TEAM.NONE) {
          members.forEach((user) => {
            allChanges[user.userSeq] = {
              desertType: team,
              position: user.position || -1,
            }
          })
        }
      })

      const request = {
        desertSeq: Number(eventId),
        rosters: Object.entries(allChanges).map(([userSeq, change]) => ({
          userSeq: Number(userSeq),
          desertType: change.desertType,
          position: change.position,
          isCandidate: true,
        })),
      }

      await saveSquads(request)

      // 데이터 다시 로드
      const squadData = await getSquads(Number(eventId))

      // 각 그룹 정렬
      const sortedSquadData = {
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortLevelDirection),
        B_TEAM: sortUsers(squadData.A_TEAM || [], sortLevelDirection),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortLevelDirection),
        B_RESERVE: sortUsers(squadData.B_TEAM || [], sortLevelDirection),
        AB_POSSIBLE: squadData.AB_POSSIBLE || [],
        NONE: squadData.NONE || [],
      }

      setSquadMembers(sortedSquadData)

      // 변경 사항 초기화
      setPendingChanges({})

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
  const getFilteredUsers = (team: keyof GroupedSquadResponse) => {
    return squadMembers[team].filter((user) => user.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // 팀별 멤버 목록 가져오기
  const getTeamMembers = (teamType: keyof GroupedSquadResponse) => {
    return squadMembers[teamType] || []
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

  // 포지션별 인원 수 계산
  const countMembersByPosition = (team: keyof GroupedSquadResponse) => {
    const members = squadMembers[team] || []
    const positionCounts: Record<number, number> = {}

    // 포지션 카운트 초기화
    POSITIONS.forEach((pos) => {
      positionCounts[pos.value] = 0
    })

    // 각 멤버의 포지션 카운트
    members.forEach((member) => {
      const position = member.position !== undefined ? member.position : -1
      if (positionCounts[position] !== undefined) {
        positionCounts[position]++
      }
    })

    return positionCounts
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
        {team !== TEAM.AB_POSSIBLE && intentType === "AB_POSSIBLE" && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.AB_POSSIBLE)}>AB 가능</DropdownMenuItem>
        )}
        {team !== TEAM.NONE && (
          <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.NONE)}>미배정</DropdownMenuItem>
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

            {/* AB 가능 섹션에서는 미배정 버튼 표시 */}
            {team === TEAM.AB_POSSIBLE && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={() => moveUser(user.userSeq, team, TEAM.NONE)}
                title="미배정으로 이동"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">미배정으로 이동</span>
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
                  {(() => {
                    // 현재 팀의 포지션별 인원 수 계산
                    const positionCounts = countMembersByPosition(team as keyof GroupedSquadResponse)

                    return POSITIONS.map((position) => (
                      <DropdownMenuItem
                        key={position.value}
                        onClick={() => updateUserPosition(user.userSeq, position.value)}
                        className={currentPosition === position.value ? "bg-accent" : ""}
                      >
                        <div className="flex justify-between w-full">
                          <span>
                            {position.value !== -1 ? `${position.value}시 - ${position.label}` : position.label}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {positionCounts[position.value]}명
                          </Badge>
                        </div>
                      </DropdownMenuItem>
                    ))
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Function to open the edit dialog
  const openEditDialog = (user: SquadMember) => {
    // SquadMember를 User 타입으로 변환
    const userForEdit: User = {
      userSeq: user.userSeq,
      id: user.userSeq, // id 필드 추가
      name: user.userName,
      level: user.userLevel,
      power: user.userPower,
      leave: false, // 기본값 설정
      createdAt: "", // 기본값 설정
      updatedAt: "", // 기본값 설정
    }

    setCurrentUser(userForEdit)
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

        // 각 그룹 정렬
        const sortedSquadData = {
          A_TEAM: sortUsers(squadData.A_TEAM || [], sortLevelDirection),
          B_TEAM: sortUsers(squadData.B_TEAM || [], sortLevelDirection),
          A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortLevelDirection),
          B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortLevelDirection),
          AB_POSSIBLE: squadData.AB_POSSIBLE || [],
          NONE: squadData.NONE || [],
        }

        setSquadMembers(sortedSquadData)
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

  // 팀 멤버 목록 다이얼로그 열기 함수 추가
  const openTeamMembersDialog = (teamType: string) => {
    setSelectedTeamType(teamType)
    setIsTeamMembersDialogOpen(true)
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
                const newDirection = sortLevelDirection === "asc" ? "desc" : "asc"
                setSortLevelDirection(newDirection)

                // 모든 팀에 새 정렬 방향 적용
                const newSquadMembers = { ...squadMembers }

                // AB_POSSIBLE과 UNASSIGNED를 제외한 모든 팀 정렬
                Object.keys(newSquadMembers).forEach((team) => {
                  if (team !== TEAM.AB_POSSIBLE && team !== TEAM.NONE) {
                    const teamKey = team as keyof GroupedSquadResponse
                    newSquadMembers[teamKey] = sortUsers(newSquadMembers[teamKey], newDirection)
                  }
                })

                setSquadMembers(newSquadMembers)
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
            disabled={isConfirming || squadMembers.AB_POSSIBLE.length > 0}
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
          teamAMembers={squadMembers.A_TEAM}
          teamBMembers={squadMembers.B_TEAM}
          teamAReserveMembers={squadMembers.A_RESERVE}
          teamBReserveMembers={squadMembers.B_RESERVE}
          reserveMembers={[]} // 제외 인원은 없음
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>A조 ({squadMembers.A_TEAM.length}/20)</CardTitle>
              <div className="flex items-center gap-2">
                {squadMembers.A_TEAM.length > 20 && <Badge variant="destructive">초과</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(TEAM.A_TEAM)}
                  title="멤버 목록 복사"
                >
                  <Clipboard className="h-4 w-4" />
                  <span className="sr-only">멤버 목록 복사</span>
                </Button>
              </div>
            </div>
            <CardDescription>A조 출전 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_TEAM as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.A_TEAM as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.A_TEAM),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>B조 ({squadMembers.B_TEAM.length}/20)</CardTitle>
              <div className="flex items-center gap-2">
                {squadMembers.B_TEAM.length > 20 && <Badge variant="destructive">초과</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(TEAM.B_TEAM)}
                  title="멤버 목록 복사"
                >
                  <Clipboard className="h-4 w-4" />
                  <span className="sr-only">멤버 목록 복사</span>
                </Button>
              </div>
            </div>
            <CardDescription>B조 주전 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.B_TEAM as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.B_TEAM as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.B_TEAM),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* A팀 예비 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>A조 예비 ({squadMembers.A_RESERVE.length}/10)</CardTitle>
              <div className="flex items-center gap-2">
                {squadMembers.A_RESERVE.length > 10 && <Badge variant="destructive">초과</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(TEAM.A_RESERVE)}
                  title="멤버 목록 복사"
                >
                  <Clipboard className="h-4 w-4" />
                  <span className="sr-only">멤버 목록 복사</span>
                </Button>
              </div>
            </div>
            <CardDescription>A조 예비 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_RESERVE as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.A_RESERVE as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.A_RESERVE),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 예비 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>B조 예비 ({squadMembers.B_RESERVE.length}/10)</CardTitle>
              <div className="flex items-center gap-2">
                {squadMembers.B_RESERVE.length > 10 && <Badge variant="destructive">초과</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(TEAM.B_RESERVE)}
                  title="멤버 목록 복사"
                >
                  <Clipboard className="h-4 w-4" />
                  <span className="sr-only">멤버 목록 복사</span>
                </Button>
              </div>
            </div>
            <CardDescription>B조 예비 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.B_RESERVE as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.B_RESERVE as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.B_RESERVE),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* AB 가능 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AB 가능</CardTitle>
            <CardDescription>A조/B조 모두 참여 가능한 인원</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.AB_POSSIBLE as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.AB_POSSIBLE as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.AB_POSSIBLE),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">AB 가능 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* 미배정 인원 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>미배정 인원 ({squadMembers.NONE?.length || 0})</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => copyToClipboard(TEAM.NONE)}
                title="멤버 목록 복사"
              >
                <Clipboard className="h-4 w-4" />
                <span className="sr-only">멤버 목록 복사</span>
              </Button>
            </div>
            <CardDescription>참여 제외된 인원</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {getFilteredUsers(TEAM.NONE as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.NONE as keyof GroupedSquadResponse).map((user) => renderUserCard(user, TEAM.NONE))
            ) : (
              <div className="text-center py-4 text-muted-foreground">미배정 유저가 없습니다.</div>
            )}
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
            {selectedTeamType && getTeamMembers(selectedTeamType as keyof GroupedSquadResponse).length > 0 ? (
              <div className="space-y-2">
                {getTeamMembers(selectedTeamType as keyof GroupedSquadResponse).map((member) => {
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
