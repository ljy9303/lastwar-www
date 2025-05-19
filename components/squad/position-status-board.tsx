"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronRight, Shield, Swords, Building2, Microscope, Hammer, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { SquadMember } from "@/app/actions/squad-actions"

// 포지션 정보 타입
interface PositionInfo {
  value: number
  label: string
  description?: string
  icon?: React.ReactNode
}

// 포지션 상수
const POSITIONS: PositionInfo[] = [
  { value: 0, label: "공격/지원", description: "공격 및 지원 담당", icon: <Swords className="h-4 w-4" /> },
  { value: 1, label: "1시", description: "1시 병원", icon: <Shield className="h-4 w-4" /> },
  { value: 2, label: "2시", description: "2시 병원", icon: <Shield className="h-4 w-4" /> },
  { value: 4, label: "4시", description: "4시 정련소", icon: <Hammer className="h-4 w-4" /> },
  { value: 5, label: "5시", description: "5시 테크센터", icon: <Building2 className="h-4 w-4" /> },
  { value: 7, label: "7시", description: "7시 병원", icon: <Shield className="h-4 w-4" /> },
  { value: 8, label: "8시", description: "8시 병원", icon: <Shield className="h-4 w-4" /> },
  { value: 10, label: "10시", description: "10시 정련소", icon: <Hammer className="h-4 w-4" /> },
  { value: 11, label: "11시", description: "11시 정보센터", icon: <Microscope className="h-4 w-4" /> },
]

interface PositionStatusBoardProps {
  teamAMembers: SquadMember[]
  teamBMembers: SquadMember[]
  teamAReserveMembers?: SquadMember[]
  teamBReserveMembers?: SquadMember[]
  reserveMembers?: SquadMember[] // 이전 버전과의 호환성을 위해 유지
}

export function PositionStatusBoard({
  teamAMembers = [],
  teamBMembers = [],
  teamAReserveMembers = [],
  teamBReserveMembers = [],
  reserveMembers = [],
}: PositionStatusBoardProps) {
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({
    teamA: true,
    teamB: true,
  })

  const { toast } = useToast()

  // 포지션 정보를 텍스트 포맷으로 변환하는 함수
  const generatePositionText = (
    teamName: string,
    members: SquadMember[],
    positionGroups: Record<number, SquadMember[]>,
    teamReserveMembers: SquadMember[] = [],
  ) => {
    let text = `사막 ${teamName}조\n\n`

    // 공격/지원 포지션 처리
    const attackMembers = positionGroups[0] || []
    if (attackMembers.length > 0) {
      text += "* 공격/지원:\n"
      // 5명씩 나누어 표시
      for (let i = 0; i < attackMembers.length; i += 5) {
        const chunk = attackMembers.slice(i, i + 5)
        text += chunk.map((m) => m.userName).join(", ") + "\n"
      }
      text += "\n"
    }

    // 나머지 포지션 처리 (포지션 미지정(-1) 제외)
    POSITIONS.slice(1).forEach((position) => {
      const posMembers = positionGroups[position.value] || []
      if (posMembers.length > 0) {
        text += `* ${position.label}: ${posMembers.map((m) => m.userName).join(", ")}\n`
      }
    })

    // 해당 팀의 예비 출정 인원 추가
    if (teamReserveMembers.length > 0) {
      text += "\n* 예비 출정 : " + teamReserveMembers.map((m) => m.userName).join(", ") + "\n"
    }

    return text
  }

  // 클립보드에 복사하는 함수
  const copyToClipboard = (team: "A" | "B") => {
    try {
      const positionGroups = team === "A" ? teamAPositions : teamBPositions
      const members = team === "A" ? teamAMembers : teamBMembers
      // 팀에 따라 적절한 예비 인원 목록 사용
      const teamReserveMembers = team === "A" ? teamAReserveMembers : teamBReserveMembers

      // 디버깅을 위한 로그
      console.log(`${team}팀 포지션 그룹:`, positionGroups)
      console.log(`${team}팀 예비 인원:`, teamReserveMembers)

      const text = generatePositionText(team, members, positionGroups, teamReserveMembers)
      console.log(`클립보드에 복사할 텍스트:`, text)

      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast({
            title: "복사 완료!",
            description: `${team}팀 포지션 정보가 클립보드에 복사되었습니다.`,
            duration: 3000,
          })
        })
        .catch((err) => {
          console.error("클립보드 복사 실패:", err)
          toast({
            title: "복사 실패",
            description: "클립보드 접근 권한이 없습니다.",
            variant: "destructive",
            duration: 3000,
          })
        })
    } catch (error) {
      console.error("클립보드 복사 중 오류 발생:", error)
      toast({
        title: "오류 발생",
        description: "클립보드 복사 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // 팀 확장/축소 토글 함수
  const toggleTeam = (team: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [team]: !prev[team],
    }))
  }

  // 모든 팀 확장/축소 토글 함수
  const toggleAllTeams = () => {
    const allExpanded = Object.values(expandedTeams).every(Boolean)
    setExpandedTeams({
      teamA: !allExpanded,
      teamB: !allExpanded,
    })
  }

  // 포지션별로 멤버 그룹화
  const groupMembersByPosition = (members: SquadMember[] = []) => {
    const positionGroups: Record<number, SquadMember[]> = {}

    // 포지션 그룹 초기화
    POSITIONS.forEach((pos) => {
      positionGroups[pos.value] = []
    })

    // 포지션이 없는 멤버를 위한 그룹 (-1)
    positionGroups[-1] = []

    // 멤버를 포지션별로 분류
    members.forEach((member) => {
      const position = member.position !== undefined ? member.position : -1
      if (positionGroups[position]) {
        positionGroups[position].push(member)
      } else {
        positionGroups[-1].push(member)
      }
    })

    return positionGroups
  }

  // 포지션이 지정된 멤버 수 계산
  const countAssignedMembers = (positionGroups: Record<number, SquadMember[]>) => {
    let count = 0
    POSITIONS.forEach((pos) => {
      count += positionGroups[pos.value]?.length || 0
    })
    return count
  }

  const teamAPositions = groupMembersByPosition(teamAMembers)
  const teamBPositions = groupMembersByPosition(teamBMembers)

  // 포지션이 지정된 멤버 수
  const teamAAssignedCount = countAssignedMembers(teamAPositions)
  const teamBAssignedCount = countAssignedMembers(teamBPositions)

  // 포지션별 멤버 목록 렌더링
  const renderPositionMembers = (positionGroups: Record<number, SquadMember[]>) => {
    return POSITIONS.map((position) => {
      const members = positionGroups[position.value] || []
      // 공격/지원 포지션(value: 0)은 멤버가 없어도 항상 표시
      if (members.length === 0 && position.value !== 0) return null

      return (
        <div key={position.value} className="mb-2 p-2 rounded-lg bg-background border">
          <h4 className="text-xs font-medium flex items-center mb-1">
            <div className="mr-1 flex items-center justify-center w-5 h-5 rounded-full bg-muted">{position.icon}</div>
            <span className="font-semibold">{position.label}</span>
            <Badge variant="outline" className="ml-2">
              {members.length}명
            </Badge>
            {position.description && (
              <span className="text-muted-foreground ml-1 text-xs">- {position.description}</span>
            )}
          </h4>
          {members.length > 0 ? (
            <div className="pl-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {members.map((member) => (
                <div
                  key={member.userSeq}
                  className="flex items-center py-0.5 px-1 rounded hover:bg-muted/50 transition-colors text-sm"
                >
                  <span className="font-medium">{member.userName}</span>
                  <span className="text-xs text-muted-foreground ml-1">Lv.{member.userLevel}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="pl-6 text-sm text-muted-foreground">배정된 멤버가 없습니다.</div>
          )}
        </div>
      )
    }).filter(Boolean)
  }

  // 예비 인원 렌더링
  const renderReserveMembers = (reserveMembers: SquadMember[] = []) => {
    if (reserveMembers.length === 0) return null

    return (
      <div className="mb-2 p-2 rounded-lg bg-background border">
        <h4 className="text-xs font-medium flex items-center mb-1">
          <div className="mr-1 flex items-center justify-center w-5 h-5 rounded-full bg-muted">
            <Swords className="h-4 w-4" />
          </div>
          <span className="font-semibold">예비 출정</span>
          <Badge variant="outline" className="ml-2">
            {reserveMembers.length}명
          </Badge>
        </h4>
        <div className="pl-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {reserveMembers.map((member) => (
            <div
              key={member.userSeq}
              className="flex items-center py-0.5 px-1 rounded hover:bg-muted/50 transition-colors text-sm"
            >
              <span className="font-medium">{member.userName}</span>
              <span className="text-xs text-muted-foreground ml-1">Lv.{member.userLevel}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">포지션 현황</h2>
        <button
          onClick={toggleAllTeams}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {Object.values(expandedTeams).every(Boolean) ? "모두 접기" : "모두 펼치기"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* A팀 포지션 현황 */}
        <Card className="border-red-200 dark:border-red-900/30 overflow-hidden">
          <CardHeader
            className="pb-2 cursor-pointer bg-red-50/50 dark:bg-red-900/10"
            onClick={() => toggleTeam("teamA")}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                {expandedTeams.teamA ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                A조 포지션 현황
                <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {teamAAssignedCount}/{teamAMembers?.length || 0}명
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard("A")
                }}
                title="포지션 정보 복사"
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">포지션 정보 복사</span>
              </Button>
            </CardTitle>
          </CardHeader>
          {expandedTeams.teamA && (
            <CardContent className="pt-4">
              {renderPositionMembers(teamAPositions)}
              {renderReserveMembers(teamAReserveMembers)}
              {Object.values(teamAPositions).every((members) => members.length === 0) &&
                teamAReserveMembers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">배정된 멤버가 없습니다.</div>
                )}
            </CardContent>
          )}
        </Card>

        {/* B팀 포지션 현황 */}
        <Card className="border-blue-200 dark:border-blue-900/30 overflow-hidden">
          <CardHeader
            className="pb-2 cursor-pointer bg-blue-50/50 dark:bg-blue-900/10"
            onClick={() => toggleTeam("teamB")}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                {expandedTeams.teamB ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                B조 포지션 현황
                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {teamBAssignedCount}/{teamBMembers?.length || 0}명
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard("B")
                }}
                title="포지션 정보 복사"
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">포지션 정보 복사</span>
              </Button>
            </CardTitle>
          </CardHeader>
          {expandedTeams.teamB && (
            <CardContent className="pt-4">
              {renderPositionMembers(teamBPositions)}
              {renderReserveMembers(teamBReserveMembers)}
              {Object.values(teamBPositions).every((members) => members.length === 0) &&
                teamBReserveMembers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">배정된 멤버가 없습니다.</div>
                )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
