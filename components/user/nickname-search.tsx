"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, User, History, Calendar } from "lucide-react"
import { searchByOldNickname, searchUsersByNickname, getUserDetailWithHistory } from "@/app/actions/user-history-actions"
import type { UserNicknameHistoryResponse, UserNicknameSearchResponse, UserSearchResult } from "@/types/user-history"
import { UserHistoryChange } from "@/components/user/user-history-change"
import { useToast } from "@/hooks/use-toast"

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

export function NicknameSearch() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<UserNicknameHistoryResponse | null>(null)
  const [userList, setUserList] = useState<UserSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [showUserList, setShowUserList] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "검색어 입력",
        description: "닉네임을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setSearchResult(null)
    setUserList([])
    setShowUserList(false)
    
    try {
      // 먼저 연맹원 목록을 검색
      const userListResult = await searchUsersByNickname(searchTerm.trim())
      
      if (userListResult.matchedUsers.length === 0) {
        toast({
          title: "검색 결과 없음",
          description: "해당 닉네임을 가진 연맹원를 찾을 수 없습니다.",
          variant: "default",
        })
        setUserList([])
        setShowUserList(false)
      } else if (userListResult.matchedUsers.length === 1) {
        // 연맹원가 1명이면 바로 상세 정보 조회
        const detailResult = await getUserDetailWithHistory(userListResult.matchedUsers[0].userSeq)
        setSearchResult(detailResult)
        setShowUserList(false)
        toast({
          title: "검색 성공",
          description: `"${searchTerm}" 닉네임의 연맹원 정보를 찾았습니다.`,
        })
      } else {
        // 연맹원가 여러명이면 선택할 수 있도록 목록 표시
        setUserList(userListResult.matchedUsers)
        setShowUserList(true)
        toast({
          title: "여러 연맹원 발견",
          description: `"${searchTerm}" 닉네임으로 ${userListResult.matchedUsers.length}명의 연맹원를 찾았습니다. 원하는 연맹원를 선택해주세요.`,
        })
      }
    } catch (error) {
      console.error("검색 중 오류:", error)
      toast({
        title: "검색 실패",
        description: "검색 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
      setSearchResult(null)
      setUserList([])
      setShowUserList(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = async (user: UserSearchResult) => {
    setIsLoading(true)
    try {
      const detailResult = await getUserDetailWithHistory(user.userSeq)
      setSearchResult(detailResult)
      setShowUserList(false)
      toast({
        title: "연맹원 선택 완료",
        description: `${user.name} 연맹원의 상세 정보를 조회했습니다.`,
      })
    } catch (error) {
      console.error("연맹원 상세 정보 조회 중 오류:", error)
      toast({
        title: "조회 실패",
        description: "연맹원 정보 조회 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* 검색 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            닉네임 검색
          </CardTitle>
          <CardDescription>
            현재 닉네임 또는 과거에 사용했던 닉네임을 입력하여 연맹원 정보와 변경 이력을 조회할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="닉네임을 입력하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button onClick={handleSearch} disabled={isLoading || !searchTerm.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 연맹원 목록 선택 섹션 */}
      {showUserList && userList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              검색된 연맹원 목록
              <Badge variant="secondary">{userList.length}명</Badge>
            </CardTitle>
            <CardDescription>
              원하는 연맹원를 선택하여 상세 정보를 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {userList.map((user) => (
                <Button
                  key={user.userSeq}
                  variant="outline"
                  className="justify-start p-4 h-auto"
                  onClick={() => handleUserSelect(user)}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Lv.{user.level} • {formatPower(user.power)} • {user.leave ? "탈퇴" : "활동중"}
                      </div>
                    </div>
                    <Badge variant={user.leave ? "destructive" : "default"}>
                      {user.leave ? "탈퇴" : "활동중"}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 검색 결과 섹션 */}
      {hasSearched && !showUserList && (
        <>
          {searchResult?.currentUser ? (
            <div className="space-y-6">
              {/* 현재 연맹원 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    현재 연맹원 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">현재 닉네임</div>
                      <div className="font-medium">{searchResult.currentUser.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">본부 레벨</div>
                      <div className="font-medium">Lv.{searchResult.currentUser.level}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">전투력</div>
                      <div className="font-medium">{formatPower(searchResult.currentUser.power)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">연맹 상태</div>
                      <Badge variant={searchResult.currentUser.leave ? "destructive" : "default"}>
                        {searchResult.currentUser.leave ? "탈퇴" : "활동중"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">연맹원 등급</div>
                      <div className="font-medium">{searchResult.currentUser.userGrade}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">가입일</div>
                      <div className="font-medium">
                        {new Date(searchResult.currentUser.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 닉네임 변경 이력 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    닉네임 변경 이력
                    <Badge variant="secondary">{searchResult.nicknameHistory.length}건</Badge>
                  </CardTitle>
                  <CardDescription>
                    닉네임 변경 내역만 표시됩니다. (이전 닉네임 → 새 닉네임)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchResult.nicknameHistory.length > 0 ? (
                    <div className="space-y-4">
                      {searchResult.nicknameHistory.map((history) => (
                        <div key={history.historyId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(history.updatedAt).toLocaleString("ko-KR")}
                              </span>
                            </div>
                          </div>
                          <UserHistoryChange changes={history.changes} isNicknameHistoryOnly={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      닉네임 변경 이력이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 전체 변경 이력 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    전체 변경 이력
                    <Badge variant="secondary">{searchResult.allHistory.length}개</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResult.allHistory.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {searchResult.allHistory.map((history) => (
                        <div key={history.historyId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(history.updatedAt).toLocaleString("ko-KR")}
                              </span>
                            </div>
                          </div>
                          <UserHistoryChange changes={history.changes} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      변경 이력이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            !isLoading && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">
                    "{searchTerm}" 닉네임을 가진 연맹원를 찾을 수 없습니다.
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}
    </div>
  )
}