"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, Edit, RefreshCw } from "lucide-react"
import { 
  getAccounts, 
  getUserLabels, 
  getServerAlliances, 
  updateAccountLabel,
  updateAccountServerAlliance 
} from "@/app/actions/account-actions"
import type { 
  Account, 
  AccountSearchParams, 
  UserLabelOption, 
  ServerAlliance, 
  UserLabel 
} from "@/types/account"
import { getLabelDisplayName, getLabelStyle } from "@/lib/user-label-utils"

export default function AccountsManagePage() {
  const { toast } = useToast()
  
  // 상태 관리
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userLabels, setUserLabels] = useState<UserLabelOption[]>([])
  const [serverAlliances, setServerAlliances] = useState<ServerAlliance[]>([])
  
  // 검색 및 필터링
  const [searchParams, setSearchParams] = useState<AccountSearchParams>({
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // 라벨 수정 다이얼로그
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [newLabel, setNewLabel] = useState<UserLabel | undefined>()
  const [labelChangeReason, setLabelChangeReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // 서버/연맹 수정 다이얼로그
  const [isServerAllianceDialogOpen, setIsServerAllianceDialogOpen] = useState(false)
  const [selectedAccountForServerAlliance, setSelectedAccountForServerAlliance] = useState<Account | null>(null)
  const [newServerAllianceId, setNewServerAllianceId] = useState<number | undefined>()
  const [serverAllianceChangeReason, setServerAllianceChangeReason] = useState("")
  const [isUpdatingServerAlliance, setIsUpdatingServerAlliance] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData()
  }, [])

  // 검색 파라미터 변경 시 계정 목록 새로고침
  useEffect(() => {
    loadAccounts()
  }, [searchParams])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadUserLabels(),
        loadServerAlliances(),
        loadAccounts()
      ])
    } catch (error) {
      console.error("초기 데이터 로드 실패:", error)
      toast({
        title: "오류 발생",
        description: "초기 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await getAccounts(searchParams)
      setAccounts(response.content || [])
      setCurrentPage(response.number || 0)
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (error) {
      console.error("계정 목록 로드 실패:", error)
      toast({
        title: "오류 발생",
        description: "계정 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserLabels = async () => {
    try {
      const labels = await getUserLabels()
      setUserLabels(labels)
    } catch (error) {
      console.error("사용자 라벨 로드 실패:", error)
    }
  }

  const loadServerAlliances = async () => {
    try {
      const alliances = await getServerAlliances()
      setServerAlliances(alliances)
    } catch (error) {
      console.error("서버 연맹 로드 실패:", error)
    }
  }

  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, page: 0 }))
  }

  const handleReset = () => {
    setSearchParams({
      page: 0,
      size: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }))
  }

  const handleLabelChange = async () => {
    if (!selectedAccount) return

    setIsUpdating(true)
    try {
      await updateAccountLabel(selectedAccount.userId, {
        label: newLabel,
        reason: labelChangeReason
      })

      toast({
        title: "라벨 변경 완료",
        description: `${selectedAccount.nickname}의 라벨이 성공적으로 변경되었습니다.`,
      })

      // 목록 새로고침
      await loadAccounts()
      
      // 다이얼로그 닫기
      setIsLabelDialogOpen(false)
      setSelectedAccount(null)
      setNewLabel(undefined)
      setLabelChangeReason("")

    } catch (error) {
      console.error("라벨 변경 실패:", error)
      toast({
        title: "오류 발생",
        description: "라벨 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openLabelDialog = (account: Account) => {
    setSelectedAccount(account)
    setNewLabel(account.label)
    setLabelChangeReason("")
    setIsLabelDialogOpen(true)
  }

  const handleServerAllianceChange = async () => {
    if (!selectedAccountForServerAlliance || !newServerAllianceId) return

    setIsUpdatingServerAlliance(true)
    try {
      await updateAccountServerAlliance(selectedAccountForServerAlliance.userId, {
        serverAllianceId: newServerAllianceId,
        reason: serverAllianceChangeReason
      })

      toast({
        title: "서버/연맹 변경 완료",
        description: `${selectedAccountForServerAlliance.nickname}의 서버/연맹이 성공적으로 변경되었습니다.`,
      })

      // 목록 새로고침
      await loadAccounts()
      
      // 다이얼로그 닫기
      setIsServerAllianceDialogOpen(false)
      setSelectedAccountForServerAlliance(null)
      setNewServerAllianceId(undefined)
      setServerAllianceChangeReason("")

    } catch (error) {
      console.error("서버/연맹 변경 실패:", error)
      toast({
        title: "오류 발생",
        description: "서버/연맹 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingServerAlliance(false)
    }
  }

  const openServerAllianceDialog = (account: Account) => {
    setSelectedAccountForServerAlliance(account)
    setNewServerAllianceId(account.serverAllianceId)
    setServerAllianceChangeReason("")
    setIsServerAllianceDialogOpen(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString('ko-KR')
  }


  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">계정 관리</h1>
        <p className="text-muted-foreground mt-2">
          사용자 계정의 라벨을 관리하고 채팅 메시지 라벨을 동기화할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
          <CardDescription>계정을 검색하고 필터링할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="닉네임 검색..."
                value={searchParams.nickname || ""}
                onChange={(e) => setSearchParams(prev => ({ ...prev, nickname: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                placeholder="이메일 검색..."
                value={searchParams.email || ""}
                onChange={(e) => setSearchParams(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="label">사용자 라벨</Label>
              <Select
                value={searchParams.label || "all"}
                onValueChange={(value) => setSearchParams(prev => ({ 
                  ...prev, 
                  label: value === "all" ? undefined : value as UserLabel 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="라벨 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {userLabels.map((label) => (
                    <SelectItem key={label.value} value={label.value}>
                      {label.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="serverAlliance">서버/연맹</Label>
              <Select
                value={searchParams.serverAllianceId?.toString() || "all"}
                onValueChange={(value) => setSearchParams(prev => ({ 
                  ...prev, 
                  serverAllianceId: value === "all" ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="서버 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {serverAlliances.map((alliance) => (
                    <SelectItem key={alliance.id} value={alliance.id.toString()}>
                      {alliance.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              검색
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 계정 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 목록</CardTitle>
          <CardDescription>
            총 {totalElements}개의 계정 (페이지 {currentPage + 1} / {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>닉네임</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>라벨</TableHead>
                      <TableHead>서버/연맹</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>마지막 로그인</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.userId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{account.nickname}</div>
                            <div className="text-sm text-muted-foreground">{account.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{account.email || "-"}</TableCell>
                        <TableCell>
                          {account.label ? (() => {
                            const labelStyle = getLabelStyle(account.label)
                            return labelStyle ? (
                              <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${labelStyle.bgColor}`}>
                                {account.labelDisplayName}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{account.labelDisplayName}</span>
                            )
                          })() : (
                            <span className="text-muted-foreground">없음</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {account.serverInfo && account.allianceTag ? (
                              `${account.serverInfo} / ${account.allianceTag}`
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(account.lastLoginAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLabelDialog(account)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              라벨 수정
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openServerAllianceDialog(account)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              서버/연맹 변경
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    이전
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber + 1}
                      </Button>
                    )
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 라벨 수정 다이얼로그 */}
      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 라벨 변경</DialogTitle>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-4">
              <div>
                <Label>사용자</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedAccount.nickname} ({selectedAccount.name})
                </div>
              </div>

              <div>
                <Label>현재 라벨</Label>
                <div className="text-sm">
                  {selectedAccount.label ? (() => {
                    const labelStyle = getLabelStyle(selectedAccount.label)
                    return labelStyle ? (
                      <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${labelStyle.bgColor}`}>
                        {selectedAccount.labelDisplayName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{selectedAccount.labelDisplayName}</span>
                    )
                  })() : (
                    <span className="text-muted-foreground">없음</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="newLabel">새 라벨</Label>
                <Select
                  value={newLabel || "remove"}
                  onValueChange={(value) => setNewLabel(value === "remove" ? undefined : value as UserLabel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="라벨 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remove">라벨 제거</SelectItem>
                    {userLabels.map((label) => (
                      <SelectItem key={label.value} value={label.value}>
                        {label.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">변경 사유</Label>
                <Textarea
                  id="reason"
                  placeholder="라벨 변경 사유를 입력하세요..."
                  value={labelChangeReason}
                  onChange={(e) => setLabelChangeReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsLabelDialogOpen(false)}
                  disabled={isUpdating}
                >
                  취소
                </Button>
                <Button
                  onClick={handleLabelChange}
                  disabled={isUpdating}
                >
                  {isUpdating ? "변경 중..." : "변경"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 서버/연맹 변경 다이얼로그 */}
      <Dialog open={isServerAllianceDialogOpen} onOpenChange={setIsServerAllianceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>서버/연맹 변경</DialogTitle>
          </DialogHeader>
          
          {selectedAccountForServerAlliance && (
            <div className="space-y-4">
              <div>
                <Label>사용자</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedAccountForServerAlliance.nickname} ({selectedAccountForServerAlliance.name})
                </div>
              </div>

              <div>
                <Label>현재 서버/연맹</Label>
                <div className="text-sm">
                  {selectedAccountForServerAlliance.serverInfo && selectedAccountForServerAlliance.allianceTag ? (
                    `${selectedAccountForServerAlliance.serverInfo} / ${selectedAccountForServerAlliance.allianceTag}`
                  ) : (
                    <span className="text-muted-foreground">없음</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="newServerAlliance">새 서버/연맹</Label>
                <Select
                  value={newServerAllianceId?.toString() || ""}
                  onValueChange={(value) => setNewServerAllianceId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="서버/연맹 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serverAlliances.map((alliance) => (
                      <SelectItem key={alliance.id} value={alliance.id.toString()}>
                        {alliance.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="serverAllianceReason">변경 사유</Label>
                <Textarea
                  id="serverAllianceReason"
                  placeholder="서버/연맹 변경 사유를 입력하세요..."
                  value={serverAllianceChangeReason}
                  onChange={(e) => setServerAllianceChangeReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsServerAllianceDialogOpen(false)}
                  disabled={isUpdatingServerAlliance}
                >
                  취소
                </Button>
                <Button
                  onClick={handleServerAllianceChange}
                  disabled={isUpdatingServerAlliance || !newServerAllianceId}
                >
                  {isUpdatingServerAlliance ? "변경 중..." : "변경"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}