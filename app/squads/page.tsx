"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Info,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSquads, saveSquads, type SquadMember, type GroupedSquadResponse } from "@/app/actions/squad-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import { fetchFromAPI } from "@/lib/api-service"
import { DesertEventType } from "@/types/desert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRequiredEvent } from "@/contexts/current-event-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PositionStatusBoard } from "@/components/squad/position-status-board"

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

// API 기본 URL 설정 제거 (fetchFromAPI에서 자동 처리)

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
  NONE: "NONE"
}

// 이벤트 타입에 따른 필터링된 팀 상수 생성
const getFilteredTeams = (eventType?: string) => {
  if (eventType === DesertEventType.A_TEAM_ONLY) {
    // A조만 사용하는 이벤트의 경우 B팀 관련 옵션 제외
    return {
      A_TEAM: TEAM.A_TEAM,
      A_RESERVE: TEAM.A_RESERVE,
      NONE: TEAM.NONE
    }
  }
  // A_B_TEAM이거나 타입이 없는 경우 모든 팀 사용
  return TEAM
}

// 이벤트 타입에 따른 필터링된 데저트 타입 생성
const getFilteredDesertTypes = (eventType?: string) => {
  if (eventType === DesertEventType.A_TEAM_ONLY) {
    return {
      A_TEAM: DESERT_TYPE.A_TEAM,
      A_RESERVE: DESERT_TYPE.A_RESERVE,
      NONE: DESERT_TYPE.NONE
    }
  }
  return DESERT_TYPE
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

// 연맹등급 순서 정의 (R5가 가장 높음)
const GRADE_ORDER = {
  "R5": 5,
  "R4": 4,
  "R3": 3,
  "R2": 2,
  "R1": 1,
  "": 0, // 미지정
} as const

// Function to sort users based on grade and power
const sortUsers = (
  users: SquadMember[], 
  powerDirection: "asc" | "desc" = "desc",
  sortByGrade: boolean = false
): SquadMember[] => {
  return [...users].sort((a, b) => {
    if (sortByGrade) {
      // 연맹등급 우선 정렬
      const gradeA = GRADE_ORDER[a.userGrade as keyof typeof GRADE_ORDER] || 0
      const gradeB = GRADE_ORDER[b.userGrade as keyof typeof GRADE_ORDER] || 0
      const gradeComparison = gradeB - gradeA // 높은 등급(R5) 우선

      if (gradeComparison !== 0) {
        return gradeComparison
      }

      // 등급이 같으면 전투력으로 정렬
      const powerComparison = powerDirection === "desc" ? b.userPower - a.userPower : a.userPower - b.userPower
      if (powerComparison !== 0) {
        return powerComparison
      }
    } else {
      // 전투력 우선 정렬
      const powerComparison = powerDirection === "desc" ? b.userPower - a.userPower : a.userPower - b.userPower
      if (powerComparison !== 0) {
        return powerComparison
      }
    }

    // 최종적으로 이름순 정렬
    return a.userName.localeCompare(b.userName)
  })
}

export default function SquadsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { eventId, eventTitle, goBack } = useRequiredEvent()

  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  // 이벤트 타입에 따른 초기 스쿼드 멤버 상태 생성
  const getInitialSquadMembers = () => {
    // 초기 로딩 시에는 기본값 사용, 이후 useEffect에서 조건부 업데이트
    return {
      A_TEAM: [],
      B_TEAM: [],
      A_RESERVE: [],
      B_RESERVE: [],
      AB_POSSIBLE: [],
      NONE: []
    }
  }

  const [squadMembers, setSquadMembers] = useState<GroupedSquadResponse>(getInitialSquadMembers())
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
  const [sortPowerDirection, setSortPowerDirection] = useState<"asc" | "desc">("desc")
  const [sortByGrade, setSortByGrade] = useState<boolean>(false)

  // 이벤트 ID는 선택적 - 없으면 일반 스쿼드 관리 모드

  // 이벤트 정보와 스쿼드 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        
        // 이벤트 정보 로드 (eventId가 있을 때만)
        let eventData = null
        if (eventId) {
          eventData = await getDesertById(Number(eventId))
          setSelectedEvent(eventData)
        }

        // 스쿼드 데이터 로드
        const squadData = await getSquads(eventId ? Number(eventId) : null)

        // 이벤트 타입에 따른 조건부 그룹 정렬
        const sortedSquadData: GroupedSquadResponse = {
          A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection, sortByGrade),
          A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection, sortByGrade),
          NONE: squadData.NONE || [],
          // A조만 사용하는 이벤트의 경우 B팀 관련 데이터를 빈 배열로 설정
          B_TEAM: eventData?.eventType === DesertEventType.A_TEAM_ONLY ? [] : sortUsers(squadData.B_TEAM || [], sortPowerDirection, sortByGrade),
          B_RESERVE: eventData?.eventType === DesertEventType.A_TEAM_ONLY ? [] : sortUsers(squadData.B_RESERVE || [], sortPowerDirection, sortByGrade),
          AB_POSSIBLE: eventData?.eventType === DesertEventType.A_TEAM_ONLY ? [] : squadData.AB_POSSIBLE || [],
        }

        setSquadMembers(sortedSquadData)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId, sortPowerDirection, sortByGrade])

  // 유저 히스토리 조회 함수
  const fetchUserHistory = async (userSeq: number) => {
    if (!eventId || loadingHistories[userSeq] || userHistories[userSeq]) return

    setLoadingHistories((prev) => ({ ...prev, [userSeq]: true }))

    try {
      const historyData: UserHistory = await fetchFromAPI(`/user/desert/history/${userSeq}?desertSeq=${eventId}`)
      setUserHistories((prev) => ({ ...prev, [userSeq]: historyData }))
    } catch (error) {
      console.error("유저 히스토리 조회 실패:", error)
      toast({
        title: "히스토리 조회 실패",
        description: "유저 히스토리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
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
      await fetchFromAPI(`/desert/roster/sync/${eventId}`)

      // 최소 1초간 로딩 표시
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 데이터 다시 로드
      const squadData = await getSquads(Number(eventId))

      // 각 그룹 정렬 (동기화 시에도 이벤트 타입 고려)
      const sortedSquadData: GroupedSquadResponse = {
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection, sortByGrade),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection, sortByGrade),
        NONE: squadData.NONE || [],
        // A조만 사용하는 이벤트의 경우 B팀 관련 데이터를 빈 배열로 설정
        B_TEAM: selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY ? [] : sortUsers(squadData.B_TEAM || [], sortPowerDirection, sortByGrade),
        B_RESERVE: selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY ? [] : sortUsers(squadData.B_RESERVE || [], sortPowerDirection, sortByGrade),
        AB_POSSIBLE: selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY ? [] : squadData.AB_POSSIBLE || [],
      }

      setSquadMembers(sortedSquadData)

      toast({
        title: "동기화 완료",
        description: "유저 정보가 성공적으로 동기화되었습니다."
      })
    } catch (error) {
      console.error("유저 정보 동기화 실패:", error)
      toast({
        title: "동기화 실패",
        description: "유저 정보 동기화 중 오류가 발생했습니다.",
        variant: "destructive"
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
      .map((member, index) => `${index + 1}. ${member.userName} (Lv.${member.userLevel} | ${formatPower(member.userPower)} | ${member.userGrade || "미지정"})`)
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
          variant: "destructive"
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
      
      // A조만 사용하는 이벤트에서 B팀 관련 이동 차단
      if (selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY) {
        if (toTeam === TEAM.B_TEAM || toTeam === TEAM.B_RESERVE || toTeam === TEAM.AB_POSSIBLE) {
          toast({
            title: "이동 불가",
            description: "A조만 사용하는 이벤트에서는 B팀 관련 옵션을 선택할 수 없습니다.",
            variant: "destructive"
          })
          return
        }
      }
      
      // 인원 초과 경고 표시 (이동은 허용)
      if (
        (toTeam === TEAM.A_TEAM && squadMembers.A_TEAM.length >= 20) ||
        (toTeam === TEAM.B_TEAM && squadMembers.B_TEAM.length >= 20)
      ) {
        toast({
          title: "인원 초과",
          description: "주전 인원이 20명을 초과했습니다.",
          variant: "warning"
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
          variant: "warning"
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
          newSquadMembers[toTeamKey] = sortUsers([...newSquadMembers[toTeamKey], user], sortPowerDirection, sortByGrade)
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

    // eventId가 없으면 일반 모드 경고
    if (!eventId) {
      toast({
          title: "저장 불가",
          description: "일반 스쿼드 관리 모드에서는 저장이 지원되지 않습니다. 특정 사막전을 선택해주세요.",
          variant: "destructive"
        })
      return
    }

    setIsSaving(true)
    try {
      console.log('스쿼드 저장 시작:', {
        changeCount: Object.keys(pendingChanges).length,
        eventId 
      })
      
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
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection, sortByGrade),
        B_TEAM: sortUsers(squadData.B_TEAM || [], sortPowerDirection, sortByGrade),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection, sortByGrade),
        B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortPowerDirection, sortByGrade),
        AB_POSSIBLE: squadData.AB_POSSIBLE || [],
        NONE: squadData.NONE || []
      }

      setSquadMembers(sortedSquadData)

      // 변경 사항 초기화
      setPendingChanges({})

      toast({
          title: "저장 완료",
          description: "스쿼드 변경 사항이 저장되었습니다."
        })
    } catch (error) {
      console.error("스쿼드 저장 실패:", error)
      toast({
          title: "오류 발생",
          description: "스쿼드 저장 중 오류가 발생했습니다.",
          variant: "destructive"
        })
    } finally {
      setIsSaving(false)
    }
  }

  // 팀 확정 함수
  const confirmSquads = async () => {
    // eventId가 null인지 먼저 확인
    if (!eventId) {
      toast({
          title: "이벤트 ID 없음",
          description: "팀 확정을 위해서는 특정 사막전을 선택해야 합니다.",
          variant: "destructive"
        })
      return
    }

    if (squadMembers.AB_POSSIBLE.length > 0) {
      toast({
          title: "AB 가능 인원 존재",
          description: "AB 가능 인원이 존재합니다. 모든 AB 가능 인원을 팀에 배정해주세요.",
          variant: "destructive"
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
              position: pendingChanges[user.userSeq]?.position ?? user.position ?? -1, // pendingChanges에서 우선 가져오기
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
        A_TEAM: sortUsers(squadData.A_TEAM || [], sortPowerDirection, sortByGrade),
        B_TEAM: sortUsers(squadData.B_TEAM || [], sortPowerDirection, sortByGrade),
        A_RESERVE: sortUsers(squadData.A_RESERVE || [], sortPowerDirection, sortByGrade),
        B_RESERVE: sortUsers(squadData.B_RESERVE || [], sortPowerDirection, sortByGrade),
        AB_POSSIBLE: squadData.AB_POSSIBLE || [],
        NONE: squadData.NONE || []
      }

      setSquadMembers(sortedSquadData)

      // 변경 사항 초기화
      setPendingChanges({})

      toast({
          title: "팀 확정 완료",
          description: "스쿼드 구성이 확정되었습니다."
        })
    } catch (error) {
      console.error("팀 확정 실패:", error)
      toast({
          title: "오류 발생",
          description: "팀 확정 중 오류가 발생했습니다.",
          variant: "destructive"
        })
    } finally {
      setIsConfirming(false)
    }
  }

  // AB 가능 인원 자동 배정 함수
  const autoDistributeABUsers = () => {
    if (squadMembers.AB_POSSIBLE.length === 0) return

    console.log('AB 가능 인원 자동 배정 시작:', {
      abUserCount: squadMembers.AB_POSSIBLE.length 
    })

    const abUsers = [...squadMembers.AB_POSSIBLE]
    const aTeamCount = squadMembers.A_TEAM.length
    const bTeamCount = squadMembers.B_TEAM.length
    
    // 전투력 순으로 정렬 (높은 순)
    abUsers.sort((a, b) => (b.userPower || 0) - (a.userPower || 0))
    
    const newSquadMembers = { ...squadMembers }
    const newPendingChanges = { ...pendingChanges }
    
    // AB 가능 인원 목록 초기화
    newSquadMembers.AB_POSSIBLE = []
    
    // 각 유저를 A팀/B팀에 균등하게 배분 (전투력을 고려하여 교대로 배치)
    abUsers.forEach((user, index) => {
      // A팀과 B팀의 현재 인원 수를 고려하여 배정
      const currentACount = newSquadMembers.A_TEAM.length
      const currentBCount = newSquadMembers.B_TEAM.length
      
      let targetTeam: string
      
      if (currentACount < currentBCount) {
        targetTeam = TEAM.A_TEAM
      } else if (currentBCount < currentACount) {
        targetTeam = TEAM.B_TEAM
      } else {
        // 인원이 같을 때는 교대로 배치 (높은 전투력부터 A팀, B팀 순)
        targetTeam = index % 2 === 0 ? TEAM.A_TEAM : TEAM.B_TEAM
      }
      
      // 해당 팀에 유저 추가 및 정렬
      const teamKey = targetTeam as keyof GroupedSquadResponse
      newSquadMembers[teamKey] = sortUsers([...newSquadMembers[teamKey], user], sortPowerDirection, sortByGrade)
      
      // 변경사항 기록
      newPendingChanges[user.userSeq] = {
        desertType: targetTeam,
        position: -1
      }
    })
    
    setSquadMembers(newSquadMembers)
    setPendingChanges(newPendingChanges)
    
    toast({
      title: "스마트 배정 완료",
      description: `${abUsers.length}명의 AB 가능 인원이 A팀/B팀에 균등하게 배정되었습니다.`,
    })
  }

  // 팀 전투력 통계 계산
  const getTeamStats = (teamMembers: SquadMember[]) => {
    if (teamMembers.length === 0) {
      return {
        totalPower: 0,
        averagePower: 0,
        averageLevel: 0,
        topPowerUser: null,
        zScoreDistribution: {}
      }
    }

    const totalPower = teamMembers.reduce((sum, user) => sum + (user.userPower || 0), 0)
    const averagePower = totalPower / teamMembers.length
    const averageLevel = teamMembers.reduce((sum, user) => sum + (user.userLevel || 0), 0) / teamMembers.length
    const topPowerUser = teamMembers.reduce((max, user) => 
      (user.userPower || 0) > (max.userPower || 0) ? user : max, teamMembers[0]
    )

    // Z-Score 분포 계산
    const zScoreDistribution: Record<string, number> = {}
    teamMembers.forEach(user => {
      const zscore = user.zScore || 'unknown'
      zScoreDistribution[zscore] = (zScoreDistribution[zscore] || 0) + 1
    })

    return {
      totalPower,
      averagePower,
      averageLevel,
      topPowerUser,
      zScoreDistribution
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
      case "top5":
        return { label: "상위 5%", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" }
      case "top10":
        return { label: "상위 10%", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" }
      case "top30":
        return { label: "상위 30%", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" }
      case "middle":
        return { label: "중간", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" }
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
    return (team: string, userSeq: number, intentType: string) => {
      // 이벤트 타입에 따른 필터링된 팀 옵션 가져오기
      const filteredTeams = getFilteredTeams(selectedEvent?.eventType)
      
      return (
        <>
          {team !== TEAM.A_TEAM && filteredTeams.A_TEAM && (
            <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.A_TEAM)}>A조</DropdownMenuItem>
          )}
          {team !== TEAM.B_TEAM && filteredTeams.B_TEAM && (
            <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.B_TEAM)}>B조</DropdownMenuItem>
          )}
          {team !== TEAM.A_RESERVE && filteredTeams.A_RESERVE && (
            <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.A_RESERVE)}>A조 예비</DropdownMenuItem>
          )}
          {team !== TEAM.B_RESERVE && filteredTeams.B_RESERVE && (
            <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.B_RESERVE)}>B조 예비</DropdownMenuItem>
          )}
          {/* intentType이 AB_POSSIBLE인 경우에만 AB 가능 옵션 표시 (A+B팀 이벤트에서만) */}
          {team !== TEAM.AB_POSSIBLE && filteredTeams.AB_POSSIBLE && intentType === "AB_POSSIBLE" && (
            <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.AB_POSSIBLE)}>AB 가능</DropdownMenuItem>
          )}
          {team !== TEAM.NONE && filteredTeams.NONE && (
            <DropdownMenuItem onClick={() => moveUser(userSeq, team, TEAM.NONE)}>미배정</DropdownMenuItem>
          )}
        </>
      )
    }
  }, [moveUser, selectedEvent])

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
        {/* 상단: 닉네임과 핵심 정보 - 한 줄 레이아웃 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* 닉네임 - 말줄임표 적용 */}
            <div className="font-medium text-sm truncate max-w-[100px] lg:max-w-[140px]" title={user.userName}>
              {user.userName}
            </div>
            
            {/* 기본 정보 - 컴팩트하게 */}
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Lv.{user.userLevel} | {formatPower(user.userPower)} | {user.userGrade || "미지정"}
            </div>

            {/* Z-Score 배지 - 작게 */}
            {user.zscore !== undefined && getZScoreLabel(user.zscore) && (
              <span className={`text-xs px-1 py-0.5 rounded-full text-[10px] font-medium ${getZScoreLabel(user.zscore)?.color}`}>
                {getZScoreLabel(user.zscore)?.label}
              </span>
            )}
          </div>

          {/* 우측 액션 버튼들과 히스토리 정보 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 4주 참석 현황 - 한 줄로 표시 */}
            {userHistory ? (
              <div className="flex items-center gap-1 text-xs">
                {/* 4주 참석 현황 점표시 - 클릭 가능 */}
                <div 
                  className="flex items-center gap-0.5 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  onClick={() => setExpandedHistories((prev) => ({ ...prev, [user.userSeq]: !prev[user.userSeq] }))}
                  title="클릭하면 상세 정보를 볼 수 있습니다"
                >
                  {[1, 2, 3, 4].map((week) => {
                    const weekKey = `week${week}` as keyof UserHistory
                    const played = userHistory[`${weekKey}Played` as keyof UserHistory] as boolean
                    const desertType = userHistory[`${weekKey}DesertType` as keyof UserHistory] as string

                    return (
                      <div
                        key={week}
                        className={`w-2 h-2 rounded-full border ${
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
              </div>
            ) : (
              !isLoadingHistory && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1 text-xs"
                  onClick={() => fetchUserHistory(user.userSeq)}
                  title="4주 참석 현황 조회"
                >
                  {isLoadingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : "4주참석"}
                </Button>
              )
            )}

            {/* AB 가능 섹션에서는 미배정 버튼 표시 */}
            {team === TEAM.AB_POSSIBLE && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
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
                  className="h-6 px-2 text-xs"
                  data-state="closed"
                  aria-haspopup="menu"
                  tabIndex={0}
                  title="팀 변경"
                >
                  팀변경
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
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-1 text-xs"
                    title="포지션 설정"
                  >
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
                              return `${position.value}시`
                            })()}
                          </span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {positionCounts[position.value]}
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

        {/* 하단: 배지들 - 두 번째 줄 */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge 
            variant={isPreferenceMatched ? "outline" : "secondary"} 
            className="text-xs px-2 py-0.5 h-5"
          >
            {getPreferenceLabel(user.intentType)}
          </Badge>
          
          {currentPosition >= 0 && (
            <Badge 
              variant="outline" 
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 h-5"
            >
              {getPositionLabel(currentPosition)}
            </Badge>
          )}
        </div>

        {/* 4주 상세 정보 펼치기 */}
        {userHistory && expandedHistories[user.userSeq] && (
          <div className="mt-2 p-2 bg-muted/20 rounded text-xs border">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((week) => {
                const weekKey = `week${week}` as keyof UserHistory
                const desertType = userHistory[`${weekKey}DesertType` as keyof UserHistory] as string
                const surveyType = userHistory[`${weekKey}SurveyType` as keyof UserHistory] as string
                const played = userHistory[`${weekKey}Played` as keyof UserHistory] as boolean

                return (
                  <div key={week} className="text-center p-2 border rounded bg-background">
                    <div className="font-medium text-xs mb-1">{week}주전</div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs">
                        <span className="font-medium">배정:</span> {getPreferenceLabel(desertType, false)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        <span className="font-medium">투표:</span> {getPreferenceLabel(surveyType, true)}
                      </div>
                      <div className={`text-xs font-medium ${played ? "text-green-600" : "text-red-600"}`}>
                        {played ? "✓ 참석" : "✗ 불참"}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
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

  // eventId가 없어도 일반 스쿼드 관리 모드로 실행

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">스쿼드 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">
          {eventTitle || '스쿼드 관리'}
        </h1>
        <div className="ml-auto">
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              사막전 관리
            </Button>
            {eventId && (
              <>
                <Button variant="outline" onClick={() => router.push('/surveys')}>
                  사전조사
                </Button>
                <Button variant="outline" onClick={() => router.push('/desert-results')}>
                  사막전 결과
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {!eventId && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            일반 스쿼드 관리 모드입니다. 특정 사막전을 선택하려면 사막전 관리 페이지에서 이동해주세요.
          </AlertDescription>
        </Alert>
      )}

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
            <span className="text-sm whitespace-nowrap">정렬:</span>
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 h-4 w-4 p-0 z-10 bg-background border border-border rounded-full">
                    <Info className="h-2.5 w-2.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>현재: {sortByGrade ? "연맹등급" : "전투력"} 우선 정렬</p>
                  <p>클릭하면 정렬 기준이 변경됩니다</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSortByGrade = !sortByGrade
                  setSortByGrade(newSortByGrade)

                  // 모든 팀에 새 정렬 방식 적용
                  const newSquadMembers = { ...squadMembers }

                  // AB_POSSIBLE과 NONE을 제외한 모든 팀 정렬
                  Object.keys(newSquadMembers).forEach((team) => {
                    if (team !== TEAM.AB_POSSIBLE && team !== TEAM.NONE) {
                      const teamKey = team as keyof GroupedSquadResponse
                      newSquadMembers[teamKey] = sortUsers(newSquadMembers[teamKey], sortPowerDirection, newSortByGrade)
                    }
                  })

                  setSquadMembers(newSquadMembers)
                }}
                className="h-8 px-3"
              >
                <span className={sortByGrade ? "font-semibold text-primary" : "text-muted-foreground"}>
                  연맹등급
                </span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className={!sortByGrade ? "font-semibold text-primary" : "text-muted-foreground"}>
                  전투력
                </span>
              </Button>
            </div>
          </div>

          {/* 유저 정보 동기화 버튼 */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 h-4 w-4 p-0 z-10 bg-background border border-border rounded-full">
                  <Info className="h-2.5 w-2.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>유저 정보 동기화</p>
                <p>유저 관리 기준으로 최신 레벨, 전투력,</p>
                <p>연맹등급 정보를 가져옵니다</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              size="sm"
              onClick={syncUserData}
              disabled={isSyncing}
              className="h-8"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">동기화</span>
            </Button>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {Object.keys(pendingChanges).length > 0 && (
            <Button onClick={saveChanges} disabled={isSaving || !eventId} className="flex-1 md:flex-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  임시 저장 ({Object.keys(pendingChanges).length})
                </>
              )}
            </Button>
          )}

          <div className="relative flex-1 md:flex-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 h-4 w-4 p-0 z-10 bg-background border border-border rounded-full">
                  <Info className="h-2.5 w-2.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>팀 구성 확정</p>
                <p>모든 팀원의 최종 배정을 완료합니다</p>
                <p>⚠️ AB 가능 인원이 모두 배정되어야 실행 가능</p>
              </TooltipContent>
            </Tooltip>
            <Button
              onClick={confirmSquads}
              disabled={isConfirming || squadMembers.AB_POSSIBLE.length > 0 || !eventId}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  확정 중...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  팀 구성 확정
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* AB 가능 인원 안내 메시지 */}
      {squadMembers.AB_POSSIBLE.length > 0 && eventId && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium text-amber-800 dark:text-amber-200">
                팀 구성 확정을 위해 "{squadMembers.AB_POSSIBLE.length}명"의 AB 가능 인원을 구체적인 팀으로 배정해주세요.
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                • 임시 저장: 현재 변경사항만 저장 (개별 유저의 desert_type 변경)
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                • 팀 구성 확정: 모든 팀원의 최종 팀 배정 완료 (AB 가능 인원이 없어야 실행 가능)
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
          eventType={selectedEvent?.eventType}
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <CardTitle>A조 ({squadMembers.A_TEAM.length}/20)</CardTitle>
                {squadMembers.A_TEAM.length > 0 && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>총 {formatPower(getTeamStats(squadMembers.A_TEAM).totalPower)}</span>
                    <span>평균 {formatPower(getTeamStats(squadMembers.A_TEAM).averagePower)}</span>
                    <span>LV {Math.round(getTeamStats(squadMembers.A_TEAM).averageLevel)}</span>
                  </div>
                )}
              </div>
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
          <CardContent className="max-h-[500px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_TEAM as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.A_TEAM as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.A_TEAM),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 - A조만 사용하는 이벤트에서는 숨김 */}
        {selectedEvent?.eventType !== DesertEventType.A_TEAM_ONLY && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <CardTitle>B조 ({squadMembers.B_TEAM.length}/20)</CardTitle>
                  {squadMembers.B_TEAM.length > 0 && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>총 {formatPower(getTeamStats(squadMembers.B_TEAM).totalPower)}</span>
                      <span>평균 {formatPower(getTeamStats(squadMembers.B_TEAM).averagePower)}</span>
                      <span>LV {Math.round(getTeamStats(squadMembers.B_TEAM).averageLevel)}</span>
                    </div>
                  )}
                </div>
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
            <CardContent className="max-h-[500px] overflow-y-auto">
              {getFilteredUsers(TEAM.B_TEAM as keyof GroupedSquadResponse).length > 0 ? (
                getFilteredUsers(TEAM.B_TEAM as keyof GroupedSquadResponse).map((user) =>
                  renderUserCard(user, TEAM.B_TEAM),
                )
              ) : (
                <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
              )}
            </CardContent>
          </Card>
        )}

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
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_RESERVE as keyof GroupedSquadResponse).length > 0 ? (
              getFilteredUsers(TEAM.A_RESERVE as keyof GroupedSquadResponse).map((user) =>
                renderUserCard(user, TEAM.A_RESERVE),
              )
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 예비 - A조만 사용하는 이벤트에서는 숨김 */}
        {selectedEvent?.eventType !== DesertEventType.A_TEAM_ONLY && (
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
            <CardContent className="max-h-[400px] overflow-y-auto">
              {getFilteredUsers(TEAM.B_RESERVE as keyof GroupedSquadResponse).length > 0 ? (
                getFilteredUsers(TEAM.B_RESERVE as keyof GroupedSquadResponse).map((user) =>
                  renderUserCard(user, TEAM.B_RESERVE),
                )
              ) : (
                <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AB 가능 - A조만 사용하는 이벤트에서는 숨김 */}
        {selectedEvent?.eventType !== DesertEventType.A_TEAM_ONLY && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>AB 가능 ({squadMembers.AB_POSSIBLE.length}명)</CardTitle>
                  <CardDescription>A조/B조 모두 참여 가능한 인원</CardDescription>
                </div>
                {squadMembers.AB_POSSIBLE.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={autoDistributeABUsers}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  >
                    스마트 배정
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {getFilteredUsers(TEAM.AB_POSSIBLE as keyof GroupedSquadResponse).length > 0 ? (
                getFilteredUsers(TEAM.AB_POSSIBLE as keyof GroupedSquadResponse).map((user) =>
                  renderUserCard(user, TEAM.AB_POSSIBLE),
                )
              ) : (
                <div className="text-center py-4 text-muted-foreground">AB 가능 유저가 없습니다.</div>
              )}
            </CardContent>
          </Card>
        )}

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
          <CardContent className="max-h-[400px] overflow-y-auto">
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
                          Lv.{member.userLevel} | {formatPower(member.userPower)} | {member.userGrade || "미지정"}
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
    </TooltipProvider>
  )
}
