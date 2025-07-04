"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Save,
  AlertTriangle,
  Loader2,
  ChevronDown,
  X,
  CheckCircle,
  Clipboard,
  RefreshCw,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSquads, saveSquads, type SquadMember, type GroupedSquadResponse } from "@/app/actions/squad-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PositionStatusBoard } from "@/components/squad/position-status-board"

// API 기본 URL 설정
const API_BASE_URL = "https://api.chunsik.site"

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

// Update the SquadMember type to include zscore as string
declare module "@/app/actions/squad-actions" {
  interface SquadMember {
    zscore?: string
  }
}

// User history type
type UserHistory = {
  week1DesertType: string
  week1SurveyType: string
  week1Played: boolean
  week2DesertType: string
  week2SurveyType: string
  week2Played: boolean
  week3DesertType: string
  week3SurveyType: string
  week3Played: boolean
  week4DesertType: string
  week4SurveyType: string
  week4Played: boolean
}

// Function to sort users based on level and name
const sortUsers = (users: SquadMember[], powerDirection: "asc" | "desc" = "desc"): SquadMember[] => {
  return [...users].sort((a, b) => {
    // Sort by userPower based on direction
    const powerComparison = powerDirection === "desc" ? b.userPower - a.userPower : a.userPower - b.userPower

    if (powerComparison !== 0) {
      return powerComparison
    }

    // If power is the same, sort by userName in ascending order
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<number, { desertType: string; position: number }>>({})
  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)
  const [selectedTeamType, setSelectedTeamType] = useState<string | null>(null)
  const [userHistories, setUserHistories] = useState<Record<number, UserHistory>>({})
  const [loadingHistories, setLoadingHistories] = useState<Record<number, boolean>>({})
  const [expandedHistories, setExpandedHistories] = useState<Record<number, boolean>>({})

  // 팀 확장/축소 상태
  // const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({
  //   teamA: true,
  //   teamB: true,
  // })

  // Sort direction states
  // const [sortNameDirection, setSortNameDirection] = useState<"asc" | "desc">("asc")
  const [sortPowerDirection, setSortPowerDirection] = useState<"asc" | "desc">("desc")

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
          A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection),
          B_TEAM: sortUsers(squadData.B_TEAM || [], sortPowerDirection),
          A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection),
          B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortPowerDirection),
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
  }, [eventId, toast, sortPowerDirection])

  // 유저 히스토리 조회 함수
  const fetchUserHistory = async (userSeq: number) => {
    if (!eventId || loadingHistories[userSeq] || userHistories[userSeq]) return

    setLoadingHistories((prev) => ({ ...prev, [userSeq]: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/user/desert/history/${userSeq}?desertSeq=${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`히스토리 조회 실패: ${response.status} ${response.statusText}`)
      }

      const historyData: UserHistory = await response.json()
      setUserHistories((prev) => ({ ...prev, [userSeq]: historyData }))
    } catch (error) {
      console.error("유저 히스토리 조회 실패:", error)
      toast({
        title: "히스토리 조회 실패",
        description: "유저 히스토리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoadingHistories((prev) => ({ ...prev, [userSeq]: false }))
    }
  }

  // 유저 정보 동기화 함수
  const syncUserData = async () => {
    if (!eventId || isSyncing) return

    setIsSyncing(true)
    try {
      // 동기화 API 호출
      const response = await fetch(`${API_BASE_URL}/desert/roster/sync/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`동기화 실패: ${response.status} ${response.statusText}`)
      }

      // 최소 1초간 로딩 표시
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 데이터 다시 로드
      const squadData = await getSquads(Number(eventId))

      // 각 그룹 정렬
      const sortedSquadData = {
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection),
        B_TEAM: sortUsers(squadData.B_TEAM || [], sortPowerDirection),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection),
        B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortPowerDirection),
        AB_POSSIBLE: squadData.AB_POSSIBLE || [],
        NONE: squadData.NONE || [],
      }

      setSquadMembers(sortedSquadData)

      toast({
        title: "동기화 완료",
        description: "유저 정보가 성공적으로 동기화되었습니다.",
      })
    } catch (error) {
      console.error("유저 정보 동기화 실패:", error)
      toast({
        title: "동기화 실패",
        description: "유저 정보 동기화 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
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
    const members = [...squadMembers[team as keyof GroupedSquadResponse]].sort((a, b) => b.userPower - a.userPower)
    return members
      .map((member, index) => `${index + 1}. ${member.userName} (${member.userPower.toLocaleString()})`)
      .join("\n")
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
  const getPreferenceLabel = (preference: string, isSurvey = false) => {
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
        return isSurvey ? "안함" : "미배정"
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
          newSquadMembers[toTeamKey] = sortUsers([...newSquadMembers[toTeamKey], user], sortPowerDirection)
        }

        setSquadMembers(newSquadMembers)

        // 변경 사항 기록
        setPendingChanges((prev) => ({
          ...prev,
          [userId]: {
            desertType: toTeam, // 미배정(NONE)에서 다른 팀으로 이동 시: "A_TEAM", "B_TEAM", "A_RESERVE", "B_RESERVE" 등
            position: -1, // 포지션을 -1로 초기화 (포지션 없음)
          },
        }))
      }
    },
    [squadMembers, toast, sortPowerDirection],
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
            desertType: change.desertType, // 미배정 → 팀 이동 시 해당 팀 타입
            position: change.position, // 기본값 -1 (포지션 없음)
            isCandidate: true, // 미배정에서 팀으로 이동하면 항상 후보자로 설정
          }
        }),
      }

      await saveSquads(request)

      // 데이터 다시 로드
      const squadData = await getSquads(Number(eventId))

      // 각 그룹 정렬
      const sortedSquadData = {
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection),
        B_TEAM: sortUsers(squadData.B_TEAM || [], sortPowerDirection),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection),
        B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortPowerDirection),
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
      // 모든 인원에 대한 변경사항 생성 (미배정 인원 제외)
      const allChanges: Record<number, { desertType: string; position: number }> = {}

      // 각 팀의 모든 멤버에 대해 변경사항 생성 (미배정 인원 제외)
      Object.entries(squadMembers).forEach(([team, members]) => {
        // 미배정 인원은 제외하고 처리
        if (team !== TEAM.NONE) {
          members.forEach((user) => {
            allChanges[user.userSeq] = {
              desertType: team, // 현재 속해 있는 팀으로 desert_type 설정
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
          isCandidate: true, // 미배정 인원은 이미 제외되었으므로 모두 true
        })),
      }

      await saveSquads(request)

      // 데이터 다시 로드
      const squadData = await getSquads(Number(eventId))

      // 각 그룹 정렬
      const sortedSquadData = {
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection),
        B_TEAM: sortUsers(squadData.B_TEAM || [], sortPowerDirection),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection),
        B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortPowerDirection),
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
    if (position === 0) return "공격/지원" // "공격지원"에서 "공격/지원"으로 변경
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

  // Get zscore label from string value
  const getZScoreLabel = (zscore: string | undefined) => {
    if (!zscore) return null

    switch (zscore) {
      case "top1":
        return { label: "상위 1%", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" }
      case "top10":
        return { label: "상위 10%", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" }
      case "top30":
        return { label: "상위 30%", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" }
      case "middle":
        return { label: "중간층", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" }
      case "bottom30":
        return { label: "하위 30%", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" }
      case "bottom10":
        return { label: "하위 10%", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" }
      case "bottom1":
        return { label: "하위 1%", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" }
      default:
        return null
    }
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
    const currentPosition = pendingChanges[user.userSeq]
      ? pendingChanges[user.userSeq].position
      : user.position !== undefined
        ? user.position
        : -1

    const userHistory = userHistories[user.userSeq]
    const isLoadingHistory = loadingHistories[user.userSeq]

    return (
      <div key={user.userSeq} className="p-3 mb-2 rounded-lg border bg-background" id={`user-${user.userSeq}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="font-medium truncate max-w-[120px] sm:max-w-none">{user.userName}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Lv.{user.userLevel} | {user.userPower.toLocaleString()}
              {user.zscore !== undefined && getZScoreLabel(user.zscore) && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${getZScoreLabel(user.zscore)?.color}`}>
                  {getZScoreLabel(user.zscore)?.label}
                </span>
              )}
            </div>
            <Badge variant={isPreferenceMatched ? "outline" : "secondary"} size="sm">
              {getPreferenceLabel(user.intentType)}
            </Badge>
            {currentPosition >= 0 && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                {getPositionLabel(currentPosition)}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => fetchUserHistory(user.userSeq)}
              disabled={isLoadingHistory}
              title="히스토리 조회"
            >
              {isLoadingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
              <span className="sr-only">히스토리 조회</span>
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
                            {(() => {
                              if (position.value === 0) return "공격/지원"
                              if (position.value === -1) return position.label
                              return `${position.value}시 - ${position.label}`
                            })()}
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

        {/* 히스토리 정보 표시 */}
        {userHistory && (
          <div className="mt-2">
            <button
              onClick={() => setExpandedHistories((prev) => ({ ...prev, [user.userSeq]: !prev[user.userSeq] }))}
              className="w-full p-2 bg-muted/30 rounded border-l-2 border-l-primary/20 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">최근 4주 참석률</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4].map((week) => {
                      const weekKey = `week${week}` as keyof UserHistory
                      const played = userHistory[`${weekKey}Played` as keyof UserHistory] as boolean
                      const desertType = userHistory[`${weekKey}DesertType` as keyof UserHistory] as string

                      return (
                        <div
                          key={week}
                          className={`w-3 h-3 mx-0.5 rounded-full border ${
                            played
                              ? "bg-green-500 border-green-600"
                              : desertType !== "NONE"
                                ? "bg-red-500 border-red-600"
                                : "bg-gray-300 border-gray-400"
                          }`}
                          title={`${week}주전: ${getTeamName(desertType)} ${played ? "참석" : "불참"}`}
                        />
                      )
                    })}
                  </div>
                  {(() => {
                    const totalWeeks = 4
                    const participatedWeeks = [1, 2, 3, 4].filter((week) => {
                      const weekKey = `week${week}` as keyof UserHistory
                      return userHistory[`${weekKey}Played` as keyof UserHistory] as boolean
                    }).length
                    const participationRate = Math.round((participatedWeeks / totalWeeks) * 100)

                    return (
                      <Badge
                        variant={
                          participationRate >= 75 ? "default" : participationRate >= 50 ? "secondary" : "destructive"
                        }
                        className="text-xs px-1.5 py-0.5"
                      >
                        {participationRate}%
                      </Badge>
                    )
                  })()}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${expandedHistories[user.userSeq] ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
            </button>
            {expandedHistories[user.userSeq] && (
              <div className="mt-1 p-2 bg-muted/20 rounded text-xs">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((week) => {
                    const weekKey = `week${week}` as keyof UserHistory
                    const desertType = userHistory[`${weekKey}DesertType` as keyof UserHistory] as string
                    const surveyType = userHistory[`${weekKey}SurveyType` as keyof UserHistory] as string
                    const played = userHistory[`${weekKey}Played` as keyof UserHistory] as boolean

                    return (
                      <div key={week} className="text-center p-1 border rounded">
                        <div className="font-medium">{week}주전</div>
                        <div className="text-muted-foreground">{getPreferenceLabel(desertType, false)}</div>
                        <div className="text-muted-foreground">투표: {getPreferenceLabel(surveyType, true)}</div>
                        <div className={played ? "text-green-600" : "text-red-600"}>{played ? "✓ 참석" : "✗ 불참"}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
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
        <h1 className="text-3xl font-bold">스쿼드 관리 {selectedEvent && `- ${selectedEvent.title}`}</h1>
        <div className="ml-auto">
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/events">사막전 관리</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/surveys?eventId=${eventId}`}>사전조사</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/desert-results?eventId=${eventId}`}>사막전 결과</Link>
            </Button>
          </div>
        </div>
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
            <span className="text-sm whitespace-nowrap">전투력:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDirection = sortPowerDirection === "asc" ? "desc" : "asc"
                setSortPowerDirection(newDirection)

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
              {sortPowerDirection === "asc" ? "↑" : "↓"}
            </Button>
          </div>

          {/* 유저 정보 동기화 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={syncUserData}
            disabled={isSyncing}
            className="h-8"
            title="유저 정보 동기화"
          >
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">동기화</span>
          </Button>
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

      {/* 동기화 중 오버레이 */}
      {isSyncing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">유저 정보 동기화 중...</p>
          </div>
        </div>
      )}

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
    </div>
  )
}
