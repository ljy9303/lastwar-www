"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  CalendarDays,
  FileSpreadsheet,
  UserSquare,
  ClipboardList,
  Loader2,
  Filter,
  MoreHorizontal,
  Edit,
} from "lucide-react"
import { format, nextFriday, subMonths, addMonths } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getDeserts, createDesert } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { AdvancedPagination } from "@/components/ui/advanced-pagination"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Desert, DesertResponse, DesertSearchParams } from "@/app/actions/event-actions"
import { useMobile } from "@/hooks/use-mobile"
import { DesertEditDialog } from "@/components/desert/desert-edit-dialog"
import type { Desert as DesertType } from "@/types/desert"
import { DesertEventType } from "@/types/desert"

// 이번주 금요일 날짜 계산 함수
function getThisFriday() {
  const today = new Date()

  // 오늘이 금요일(5)인지 확인
  if (today.getDay() === 5) {
    return today
  }

  // 이번주 금요일 계산
  return nextFriday(today)
}

export default function EventsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  
  const [desertResponse, setDesertResponse] = useState<DesertResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tempSearchTerm, setTempSearchTerm] = useState("")
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newEventName, setNewEventName] = useState("")
  const [newEventDate, setNewEventDate] = useState<Date | undefined>(getThisFriday())
  const [newEventType, setNewEventType] = useState<DesertEventType>(DesertEventType.A_B_TEAM)
  const isMobile = useMobile()

  // 사막전 수정 관련 상태
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDesert, setEditingDesert] = useState<DesertType | null>(null)

  // URL에서 초기 상태 읽기
  const getInitialSearchParams = (): DesertSearchParams => {
    return {
      page: parseInt(urlSearchParams.get('page') || '0'),
      size: parseInt(urlSearchParams.get('size') || '10'),
      sortBy: (urlSearchParams.get('sortBy') as "EVENT_DATE" | "CREATE_DATE" | "UPDATE_AT") || "EVENT_DATE",
      sortOrder: (urlSearchParams.get('sortOrder') as "ASC" | "DESC") || "DESC"
    }
  }

  // 검색 필터
  const [searchParams, setSearchParams] = useState<DesertSearchParams>(getInitialSearchParams)
  
  // URL 변경 감지 및 상태 동기화
  useEffect(() => {
    const newParams = getInitialSearchParams()
    const urlSearchTerm = urlSearchParams.get('search') || ''
    
    setSearchParams(newParams)
    setSearchTerm(urlSearchTerm)
    setTempSearchTerm(urlSearchTerm)
    
  }, [urlSearchParams])

  // 임시 필터 상태 (필터 다이얼로그에서 사용)
  const [tempFilters, setTempFilters] = useState({
    fromDate: undefined as Date | undefined,
    toDate: undefined as Date | undefined
  })

  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  // 사막전 목록 로드 - useCallback으로 감싸서 불필요한 재생성 방지
  const loadDeserts = useCallback(
    async (params: DesertSearchParams = {}) => {
      setIsLoading(true)
      try {
        const finalParams = {
          ...searchParams,
          ...params,
          title: searchTerm || undefined,
          fromDate: tempFilters.fromDate ? format(tempFilters.fromDate, "yyyy-MM-dd") : undefined,
          toDate: tempFilters.toDate ? format(tempFilters.toDate, "yyyy-MM-dd") : undefined,
        }
        const data = await getDeserts(finalParams)
        setDesertResponse(data)
      } catch (error) {
        console.error("사막전 목록 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "사막전 목록을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
        setIsInitialLoad(false)
      }
    },
  )

  // 디바운싱된 검색 처리
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      if (searchValue !== searchTerm) {
        setSearchTerm(searchValue)
        const newParams = { ...searchParams, page: 0 }
        setSearchParams(newParams)
        updateURL(newParams)
        loadDeserts({ page: 0 })
      }
    }, 500),
    [searchParams, searchTerm, loadDeserts]
  )

  // 디바운스 함수
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadDeserts()
  }, [])

  // 검색 처리
  const handleSearch = () => {
    setSearchTerm(tempSearchTerm)
    const newParams = { ...searchParams, page: 0 }
    setSearchParams(newParams) // 검색 시 첫 페이지로 이동
    updateURL(newParams)
    loadDeserts({ page: 0 })
  }

  // URL 업데이트 함수
  const updateURL = (params: DesertSearchParams) => {
    const url = new URLSearchParams()
    if (params.page !== undefined && params.page > 0) url.set('page', params.page.toString())
    if (params.size !== undefined && params.size !== 10) url.set('size', params.size.toString())
    if (params.sortBy !== undefined && params.sortBy !== 'EVENT_DATE') url.set('sortBy', params.sortBy)
    if (params.sortOrder !== undefined && params.sortOrder !== 'DESC') url.set('sortOrder', params.sortOrder)
    if (searchTerm) url.set('search', searchTerm)
    
    const newURL = url.toString() ? `?${url.toString()}` : ''
    router.replace(newURL, { scroll: false })
  }

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page }
    setSearchParams(newParams)
    updateURL(newParams)
    loadDeserts({ page })
  }

  // 페이지 크기 변경 처리
  const handlePageSizeChange = (size: number) => {
    const newParams = { 
      ...searchParams, 
      size, 
      page: 0 // 페이지 크기 변경 시 첫 페이지로 이동
    }
    setSearchParams(newParams)
    updateURL(newParams)
    loadDeserts({ size, page: 0 })
  }


  // 필터 적용
  const applyFilters = () => {
    // 필터 적용 로그 (userLogger 대신 console.log 사용)
    console.log('필터 적용:', {
      fromDate: tempFilters.fromDate,
      toDate: tempFilters.toDate 
    })
    const newParams = {
      ...searchParams,
      page: 0,
    }
    setSearchParams(newParams)
    updateURL(newParams)
    loadDeserts({
      page: 0,
      fromDate: tempFilters.fromDate ? format(tempFilters.fromDate, "yyyy-MM-dd") : undefined,
      toDate: tempFilters.toDate ? format(tempFilters.toDate, "yyyy-MM-dd") : undefined,
    })
    setIsFilterDialogOpen(false)
  }

  // 필터 초기화
  const resetFilters = () => {
    const defaultFilters = {
      fromDate: undefined as Date | undefined,
      toDate: undefined as Date | undefined
    }

    setTempFilters(defaultFilters)
    setTempSearchTerm("")
    setSearchTerm("")

    const newParams = {
      page: 0,
      size: 10,
      sortBy: "EVENT_DATE" as "EVENT_DATE" | "CREATE_DATE" | "UPDATE_AT",
      sortOrder: "DESC" as "ASC" | "DESC"
    }

    setSearchParams(newParams)
    updateURL(newParams)
    loadDeserts({
      page: 0,
      size: 10,
      title: undefined,
      fromDate: undefined,
      toDate: undefined
    })

    setIsFilterDialogOpen(false)
  }

  // 사막전 생성 함수
  const handleCreateEvent = async () => {
    if (!newEventName.trim()) {
      toast({
        title: "입력 오류",
        description: "이벤트 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (!newEventDate) {
      toast({
        title: "입력 오류",
        description: "이벤트 날짜를 선택해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      // API 요청 데이터 형식
      const requestData = {
        title: newEventName,
        eventDate: format(newEventDate, "yyyy-MM-dd"),
        eventType: newEventType,
      }

      await createDesert(requestData)

      toast({
        title: "사막전 생성 성공",
        description: `${newEventName} 사막전이 생성되었습니다.`,
      })

      // 사막전 목록 새로고침
      await loadDeserts()

      // 폼 초기화
      setIsCreateEventDialogOpen(false)
      setNewEventName("")
      setNewEventDate(getThisFriday())
      setNewEventType(DesertEventType.A_B_TEAM)
    } catch (error) {
      console.error("사막전 생성 실패:", error)

      // 에러 메시지 추출
      const errorMessage = error instanceof Error ? error.message : "사막전 생성 중 오류가 발생했습니다."

      // 중복 사막전 에러 메시지인지 확인 (백엔드 메시지 패턴 매칭)
      const isDuplicateError =
        errorMessage.includes("이미 존재") || 
        errorMessage.includes("중복") || 
        errorMessage.includes("동일한") ||
        errorMessage.includes("해당 날짜")

      toast({
        title: "사막전 생성 실패",
        description: isDuplicateError 
          ? `선택한 날짜(${format(newEventDate, "yyyy년 MM월 dd일")})에 이미 사막전이 존재합니다. 다른 날짜를 선택해주세요.`
          : errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "yyyy년 MM월 dd일", { locale: ko })
    } catch (error) {
      return dateString
    }
  }

  // 메모이즈된 계산 함수들
  const getParticipantCount = useCallback((desert: Desert) => {
    return (desert.ateamCount || 0) + (desert.bteamCount || 0)
  }, [])

  const getTeamACount = useCallback((desert: Desert) => {
    return desert.ateamCount || 0
  }, [])

  const getTeamBCount = useCallback((desert: Desert) => {
    return desert.bteamCount || 0
  }, [])

  // 메모이즈된 사막전 목록
  const deserts = useMemo(() => {
    return desertResponse?.content || []
  }, [desertResponse?.content])

  // 사막전 수정 핸들러
  const handleEditDesert = (desert: Desert) => {
    const desertForEdit: DesertType = {
      desertSeq: desert.desertSeq,
      title: desert.title,
      eventDate: desert.eventDate,
      deleted: false
    }
    setEditingDesert(desertForEdit)
    setIsEditDialogOpen(true)
  }

  // 사막전 수정 완료 핸들러
  const handleDesertUpdate = (updatedDesert: DesertType) => {
    // 목록 새로고침
    loadDeserts()
    setIsEditDialogOpen(false)
    setEditingDesert(null)
  }

  // 사막전 수정 취소 핸들러
  const handleEditCancel = () => {
    setIsEditDialogOpen(false)
    setEditingDesert(null)
  }

  if (isInitialLoad) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">사막전 목록을 불러오는 중...</p>
      </div>
    )
  }

  // 이 라인은 위에서 메모이즈된 버전으로 대체됨

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">사막전 관리</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="사막전 검색..."
              className="pl-8"
              value={tempSearchTerm}
              onChange={(e) => {
                setTempSearchTerm(e.target.value)
                debouncedSearch(e.target.value)
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => {
                // 필터 다이얼로그를 열 때 기본 날짜 범위 설정 (사용자가 필터를 사용하지 않는 경우에만)
                if (!tempFilters.fromDate && !tempFilters.toDate) {
                  setTempFilters(prev => ({
                    ...prev,
                    fromDate: subMonths(new Date(), 1),
                    toDate: addMonths(new Date(), 1),
                  }))
                }
                setIsFilterDialogOpen(true)
              }} 
              className="flex-1 sm:flex-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            <Button variant="secondary" onClick={handleSearch} className="flex-1 sm:flex-auto">
              검색
            </Button>
          </div>
        </div>

        <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />새 사막전 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 사막전 생성</DialogTitle>
              <DialogDescription>새로운 사막전을 생성합니다.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-name">사막전 이름</Label>
                <Input
                  id="event-name"
                  placeholder="예: 5월 1주차 사막전"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-date">사막전 날짜</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="event-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEventDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {newEventDate ? format(newEventDate, "yyyy년 MM월 dd일", { locale: ko }) : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={newEventDate} onSelect={setNewEventDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-type">사막전 유형</Label>
                <Select value={newEventType} onValueChange={(value) => setNewEventType(value as DesertEventType)}>
                  <SelectTrigger id="event-type">
                    <SelectValue placeholder="사막전 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DesertEventType.A_B_TEAM}>A조, B조 모두 사용</SelectItem>
                    <SelectItem value={DesertEventType.A_TEAM_ONLY}>A조만 사용</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)} disabled={isCreating}>
                취소
              </Button>
              <Button onClick={handleCreateEvent} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 다이얼로그 */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사막전 필터</DialogTitle>
            <DialogDescription>날짜 범위를 설정하여 사막전을 필터링합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>시작 날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tempFilters.fromDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {tempFilters.fromDate
                      ? format(tempFilters.fromDate, "yyyy년 MM월 dd일", { locale: ko })
                      : "시작 날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempFilters.fromDate}
                    onSelect={(date) => setTempFilters((prev) => ({ ...prev, fromDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>종료 날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tempFilters.toDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {tempFilters.toDate
                      ? format(tempFilters.toDate, "yyyy년 MM월 dd일", { locale: ko })
                      : "종료 날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempFilters.toDate}
                    onSelect={(date) => setTempFilters((prev) => ({ ...prev, toDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              초기화
            </Button>
            <Button onClick={applyFilters}>적용</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && !isInitialLoad ? (
        <TableSkeleton rows={searchParams.size || 10} columns={6} />
      ) : !isLoading && deserts.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사막전 이름</TableHead>
                  <TableHead className="hidden md:table-cell">날짜</TableHead>
                  <TableHead className="hidden sm:table-cell">참가자</TableHead>
                  <TableHead className="hidden sm:table-cell">A팀</TableHead>
                  <TableHead className="hidden sm:table-cell">B팀</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deserts.map((desert) => (
                  <TableRow key={desert.desertSeq}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{desert.title}</div>
                        <div className="md:hidden text-xs text-muted-foreground">{formatDate(desert.eventDate)}</div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          참가자: {getParticipantCount(desert)}명 | A팀: {getTeamACount(desert)}명 | B팀:{" "}
                          {getTeamBCount(desert)}명
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(desert.eventDate)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getParticipantCount(desert)}명</TableCell>
                    <TableCell className="hidden sm:table-cell">{getTeamACount(desert)}명</TableCell>
                    <TableCell className="hidden sm:table-cell">{getTeamBCount(desert)}명</TableCell>
                    <TableCell className="text-right">
                      {isMobile ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDesert(desert)}>
                              <Edit className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/surveys?eventId=${desert.desertSeq}`}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                사전조사
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/squads?eventId=${desert.desertSeq}`}>
                                <UserSquare className="h-4 w-4 mr-2" />
                                스쿼드
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/desert-results?eventId=${desert.desertSeq}`}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                사막전 결과
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditDesert(desert)}>
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/surveys?eventId=${desert.desertSeq}`}>
                              <FileSpreadsheet className="h-4 w-4 mr-1" />
                              사전조사
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/squads?eventId=${desert.desertSeq}`}>
                              <UserSquare className="h-4 w-4 mr-1" />
                              스쿼드
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/desert-results?eventId=${desert.desertSeq}`}>
                              <ClipboardList className="h-4 w-4 mr-1" />
                              사막전 결과
                            </Link>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 고급 페이지네이션 */}
          {desertResponse && (
            <div className="mt-6">
              <AdvancedPagination
                currentPage={desertResponse.number}
                totalPages={desertResponse.totalPages}
                onPageChange={handlePageChange}
                showSizeChanger={true}
                pageSize={desertResponse.size}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageSizeChange={handlePageSizeChange}
                showQuickJumper={true}
                showTotal={true}
                totalElements={desertResponse.totalElements}
                showFirstLast={true}
              />
            </div>
          )}
        </>
      ) : !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">등록된 사막전이 없습니다</h3>
            <p className="text-muted-foreground text-center mb-4">새 사막전을 생성하여 관리를 시작하세요.</p>
            <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />새 사막전 생성
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : null}

      {/* 사막전 수정 다이얼로그 */}
      <DesertEditDialog
        isOpen={isEditDialogOpen}
        desert={editingDesert}
        onClose={handleEditCancel}
        onUpdate={handleDesertUpdate}
      />
    </div>
  )
}
