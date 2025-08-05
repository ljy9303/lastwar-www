"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useCallback, useMemo, useReducer } from "react"
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
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Desert, DesertResponse, DesertSearchParams } from "@/app/actions/event-actions"
import { useMobile } from "@/hooks/use-mobile"
import { DesertEditDialog } from "@/components/desert/desert-edit-dialog"
import type { Desert as DesertType } from "@/types/desert"
import { DesertEventType } from "@/types/desert"
import { useCurrentEvent } from "@/contexts/current-event-context"

// 🔥 성능 최적화: 통합된 State 타입 정의
interface EventsPageState {
  // 데이터 관련
  desertResponse: DesertResponse | null
  searchParams: DesertSearchParams
  
  // UI 상태
  isLoading: boolean
  isInitialLoad: boolean
  searchTerm: string
  tempSearchTerm: string
  
  // 다이얼로그 상태
  dialogs: {
    createEvent: boolean
    editEvent: boolean
    filter: boolean
  }
  
  // 생성 폼 상태
  createForm: {
    isCreating: boolean
    eventName: string
    eventDate: Date | undefined
    eventType: DesertEventType
  }
  
  // 수정 관련 상태
  editingDesert: DesertType | null
  
  // 필터 상태
  tempFilters: {
    fromDate: Date | undefined
    toDate: Date | undefined
  }
}

// 🔥 성능 최적화: State Action 타입 정의
type EventsPageAction =
  | { type: 'SET_DESERT_RESPONSE'; payload: DesertResponse | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOAD'; payload: boolean }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_TEMP_SEARCH_TERM'; payload: string }
  | { type: 'SET_SEARCH_PARAMS'; payload: DesertSearchParams }
  | { type: 'TOGGLE_DIALOG'; payload: { dialog: keyof EventsPageState['dialogs']; open: boolean } }
  | { type: 'SET_CREATE_FORM'; payload: Partial<EventsPageState['createForm']> }
  | { type: 'SET_EDITING_DESERT'; payload: DesertType | null }
  | { type: 'SET_TEMP_FILTERS'; payload: Partial<EventsPageState['tempFilters']> }
  | { type: 'RESET_CREATE_FORM' }
  | { type: 'INIT_FROM_URL'; payload: { searchParams: DesertSearchParams; searchTerm: string } }

// 이번주 금요일 날짜 계산 함수
function getThisFriday() {
  const today = new Date()
  if (today.getDay() === 5) {
    return today
  }
  return nextFriday(today)
}

// 🔥 성능 최적화: useReducer를 사용한 통합된 State 관리
function eventsPageReducer(state: EventsPageState, action: EventsPageAction): EventsPageState {
  switch (action.type) {
    case 'SET_DESERT_RESPONSE':
      return { ...state, desertResponse: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_INITIAL_LOAD':
      return { ...state, isInitialLoad: action.payload }
    
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload }
    
    case 'SET_TEMP_SEARCH_TERM':
      return { ...state, tempSearchTerm: action.payload }
    
    case 'SET_SEARCH_PARAMS':
      return { ...state, searchParams: action.payload }
    
    case 'TOGGLE_DIALOG':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          [action.payload.dialog]: action.payload.open
        }
      }
    
    case 'SET_CREATE_FORM':
      return {
        ...state,
        createForm: {
          ...state.createForm,
          ...action.payload
        }
      }
    
    case 'SET_EDITING_DESERT':
      return { ...state, editingDesert: action.payload }
    
    case 'SET_TEMP_FILTERS':
      return {
        ...state,
        tempFilters: {
          ...state.tempFilters,
          ...action.payload
        }
      }
    
    case 'RESET_CREATE_FORM':
      return {
        ...state,
        createForm: {
          isCreating: false,
          eventName: "",
          eventDate: getThisFriday(),
          eventType: DesertEventType.A_B_TEAM
        }
      }
    
    case 'INIT_FROM_URL':
      return {
        ...state,
        searchParams: action.payload.searchParams,
        searchTerm: action.payload.searchTerm,
        tempSearchTerm: action.payload.searchTerm
      }
    
    default:
      return state
  }
}

// 🔥 성능 최적화: 초기 State 정의
const initialState: EventsPageState = {
  desertResponse: null,
  searchParams: {
    page: 0,
    size: 10,
    sortBy: "EVENT_DATE",
    sortOrder: "DESC"
  },
  isLoading: true,
  isInitialLoad: true,
  searchTerm: "",
  tempSearchTerm: "",
  dialogs: {
    createEvent: false,
    editEvent: false,
    filter: false
  },
  createForm: {
    isCreating: false,
    eventName: "",
    eventDate: getThisFriday(),
    eventType: DesertEventType.A_B_TEAM
  },
  editingDesert: null,
  tempFilters: {
    fromDate: undefined,
    toDate: undefined
  }
}

export default function EventsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const { navigateToEventPage } = useCurrentEvent()
  const isMobile = useMobile()
  
  // 🔥 성능 최적화: 단일 useReducer로 모든 상태 관리
  const [state, dispatch] = useReducer(eventsPageReducer, initialState)

  // URL에서 초기 상태 읽기 (메모이제이션)
  const getInitialSearchParams = useCallback((): DesertSearchParams => {
    return {
      page: parseInt(urlSearchParams.get('page') || '0'),
      size: parseInt(urlSearchParams.get('size') || '10'),  
      sortBy: (urlSearchParams.get('sortBy') as "EVENT_DATE" | "CREATE_DATE" | "UPDATE_AT") || "EVENT_DATE",
      sortOrder: (urlSearchParams.get('sortOrder') as "ASC" | "DESC") || "DESC"
    }
  }, [urlSearchParams])

  // URL 변경 감지 및 상태 동기화 (단일 effect로 통합)
  useEffect(() => {
    const newParams = getInitialSearchParams()
    const urlSearchTerm = urlSearchParams.get('search') || ''
    
    dispatch({
      type: 'INIT_FROM_URL',
      payload: { searchParams: newParams, searchTerm: urlSearchTerm }
    })
  }, [urlSearchParams, getInitialSearchParams])

  // 🔥 성능 최적화: 병렬 API 호출 최적화
  const loadDeserts = useCallback(
    async (params: DesertSearchParams = {}) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const finalParams = {
          ...state.searchParams,
          ...params,
          title: state.searchTerm || undefined,
          fromDate: state.tempFilters.fromDate ? format(state.tempFilters.fromDate, "yyyy-MM-dd") : undefined,
          toDate: state.tempFilters.toDate ? format(state.tempFilters.toDate, "yyyy-MM-dd") : undefined,
        }

        // 🔥 병렬 처리: 필요한 경우 여러 API를 동시 호출
        const [data] = await Promise.all([
          getDeserts(finalParams),
          // 추가 API가 필요한 경우 여기에 추가
          // getCachedUserInfo(), // 예시
          // getSystemStatus()   // 예시
        ])
        
        dispatch({ type: 'SET_DESERT_RESPONSE', payload: data })
      } catch (error) {
        console.error("사막전 목록 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "사막전 목록을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        })
        dispatch({ type: 'SET_DESERT_RESPONSE', payload: null })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
        dispatch({ type: 'SET_INITIAL_LOAD', payload: false })
      }
    },
    [state.searchParams, state.searchTerm, state.tempFilters, toast]
  )

  // 디바운싱된 검색 처리 (메모이제이션 최적화)
  const debouncedSearch = useMemo(() => {
    const debounce = <T extends (...args: any[]) => any>(
      func: T,
      wait: number
    ): ((...args: Parameters<T>) => void) => {
      let timeout: NodeJS.Timeout
      return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
      }
    }

    return debounce((searchValue: string) => {
      if (searchValue !== state.searchTerm) {
        dispatch({ type: 'SET_SEARCH_TERM', payload: searchValue })
        const newParams = { ...state.searchParams, page: 0 }
        dispatch({ type: 'SET_SEARCH_PARAMS', payload: newParams })
        updateURL(newParams, searchValue)
        loadDeserts({ page: 0 })
      }
    }, 500)
  }, [state.searchTerm, state.searchParams, loadDeserts])

  // 초기 로드 (의존성 최적화)
  useEffect(() => {
    if (state.isInitialLoad) {
      loadDeserts()
    }
  }, [state.isInitialLoad]) // loadDeserts 의존성 제거로 무한 루프 방지

  // URL 업데이트 함수 (메모이제이션)
  const updateURL = useCallback((params: DesertSearchParams, searchTerm?: string) => {
    const url = new URLSearchParams()
    if (params.page !== undefined && params.page > 0) url.set('page', params.page.toString())
    if (params.size !== undefined && params.size !== 10) url.set('size', params.size.toString())
    if (params.sortBy !== undefined && params.sortBy !== 'EVENT_DATE') url.set('sortBy', params.sortBy)
    if (params.sortOrder !== undefined && params.sortOrder !== 'DESC') url.set('sortOrder', params.sortOrder)
    if (searchTerm || state.searchTerm) url.set('search', searchTerm || state.searchTerm)
    
    const newURL = url.toString() ? `?${url.toString()}` : ''
    router.replace(newURL, { scroll: false })
  }, [router, state.searchTerm])

  // 이벤트 핸들러들 (메모이제이션)
  const handleSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: state.tempSearchTerm })
    const newParams = { ...state.searchParams, page: 0 }
    dispatch({ type: 'SET_SEARCH_PARAMS', payload: newParams })
    updateURL(newParams, state.tempSearchTerm)
    loadDeserts({ page: 0 })
  }, [state.tempSearchTerm, state.searchParams, updateURL, loadDeserts])

  const handlePageChange = useCallback((page: number) => {
    const newParams = { ...state.searchParams, page }
    dispatch({ type: 'SET_SEARCH_PARAMS', payload: newParams })
    updateURL(newParams)
    loadDeserts({ page })
  }, [state.searchParams, updateURL, loadDeserts])

  const handleSizeChange = useCallback((size: string) => {
    const newParams = { ...state.searchParams, size: parseInt(size), page: 0 }
    dispatch({ type: 'SET_SEARCH_PARAMS', payload: newParams })
    updateURL(newParams)
    loadDeserts({ size: parseInt(size), page: 0 })
  }, [state.searchParams, updateURL, loadDeserts])

  // 🔥 성능 최적화: 이벤트 생성 최적화 (병렬 처리)
  const handleCreateEvent = useCallback(async () => {
    if (!state.createForm.eventName.trim() || !state.createForm.eventDate) {
      toast({
        title: "필수 정보 누락",
        description: "사막전 이름과 날짜를 모두 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    dispatch({ type: 'SET_CREATE_FORM', payload: { isCreating: true } })

    try {
      const newDesert = await createDesert({
        title: state.createForm.eventName.trim(),
        eventDate: format(state.createForm.eventDate, "yyyy-MM-dd"),
        eventType: state.createForm.eventType
      })

      toast({
        title: "사막전 생성 완료",
        description: `${newDesert.title} 사막전이 생성되었습니다.`
      })

      // 폼 리셋 및 다이얼로그 닫기를 병렬로 처리
      dispatch({ type: 'RESET_CREATE_FORM' })
      dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'createEvent', open: false } })
      
      // 목록 새로고침
      loadDeserts()
    } catch (error) {
      console.error("사막전 생성 실패:", error)
      toast({
        title: "생성 실패",
        description: "사막전 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      dispatch({ type: 'SET_CREATE_FORM', payload: { isCreating: false } })
    }
  }, [state.createForm, toast, loadDeserts])

  // 렌더링 최적화를 위한 메모이제이션
  const desertTableRows = useMemo(() => {
    if (!state.desertResponse?.deserts) return null

    return state.desertResponse.deserts.map((desert) => (
      <TableRow key={desert.desertSeq} className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{desert.title}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-muted-foreground">
            {format(new Date(desert.eventDate), "yyyy년 MM월 dd일 (E)", { locale: ko })}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {desert.eventType === DesertEventType.A_TEAM_ONLY ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                A조 전용
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                A·B조 모두
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2"
            >
              <Link href={`/events/${desert.desertSeq}/survey`}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                사전조사
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2"
            >
              <Link href={`/events/${desert.desertSeq}/prepare`}>
                <UserSquare className="h-4 w-4 mr-1" />
                스쿼드
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2"
            >
              <Link href={`/events/${desert.desertSeq}/result`}>
                <ClipboardList className="h-4 w-4 mr-1" />
                결과
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    dispatch({ type: 'SET_EDITING_DESERT', payload: desert })
                    dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'editEvent', open: true } })
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  수정
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    ))
  }, [state.desertResponse?.deserts])

  // 🔥 최종 렌더링 (컴포넌트 구조는 기존과 동일하되 상태 참조만 변경)
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">사막전 관리</h1>
          <p className="text-muted-foreground">사막전 이벤트를 생성하고 관리합니다</p>
        </div>
        <Button
          onClick={() => dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'createEvent', open: true } })}
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          새 사막전
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="사막전 이름으로 검색..."
                  value={state.tempSearchTerm}
                  onChange={(e) => {
                    dispatch({ type: 'SET_TEMP_SEARCH_TERM', payload: e.target.value })
                    debouncedSearch(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                검색
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'filter', open: true } })}
              >
                <Filter className="mr-2 h-4 w-4" />
                필터
              </Button>
              <Select value={state.searchParams.size?.toString()} onValueChange={handleSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5개</SelectItem>
                  <SelectItem value="10">10개</SelectItem>
                  <SelectItem value="20">20개</SelectItem>
                  <SelectItem value="50">50개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card>
        <CardContent className="p-0">
          {state.isLoading && state.isInitialLoad ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사막전 이름</TableHead>
                      <TableHead>이벤트 날짜</TableHead>
                      <TableHead>이벤트 타입</TableHead>
                      <TableHead>액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.isLoading && !state.isInitialLoad ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            사막전 목록 불러오는 중...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : state.desertResponse?.deserts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          등록된 사막전이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      desertTableRows
                    )}
                  </TableBody>
                </Table>

                {state.desertResponse && state.desertResponse.totalElements > 0 && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      총 {state.desertResponse.totalElements}개 중{" "}
                      {state.desertResponse.pageable.offset + 1}-
                      {Math.min(
                        state.desertResponse.pageable.offset + state.desertResponse.numberOfElements,
                        state.desertResponse.totalElements
                      )}개 표시
                    </div>
                    <Pagination
                      currentPage={state.desertResponse.pageable.pageNumber}
                      totalPages={state.desertResponse.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 사막전 생성 다이얼로그 */}
      <Dialog
        open={state.dialogs.createEvent}
        onOpenChange={(open) => dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'createEvent', open } })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 사막전 생성</DialogTitle>
            <DialogDescription>새로운 사막전 이벤트를 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-name">사막전 이름</Label>
              <Input
                id="event-name"
                value={state.createForm.eventName}
                onChange={(e) => dispatch({ type: 'SET_CREATE_FORM', payload: { eventName: e.target.value } })}
                placeholder="예: 2024년 1월 첫째주 사막전"
              />
            </div>
            <div className="grid gap-2">
              <Label>이벤트 날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !state.createForm.eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {state.createForm.eventDate ? (
                      format(state.createForm.eventDate, "yyyy년 MM월 dd일 (E)", { locale: ko })
                    ) : (
                      <span>날짜를 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={state.createForm.eventDate}
                    onSelect={(date) => dispatch({ type: 'SET_CREATE_FORM', payload: { eventDate: date } })}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-type">이벤트 타입</Label>
              <Select
                value={state.createForm.eventType}
                onValueChange={(value: DesertEventType) => dispatch({ type: 'SET_CREATE_FORM', payload: { eventType: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DesertEventType.A_B_TEAM}>A조, B조 모두 사용</SelectItem>
                  <SelectItem value={DesertEventType.A_TEAM_ONLY}>A조만 사용</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'createEvent', open: false } })}
            >
              취소
            </Button>
            <Button onClick={handleCreateEvent} disabled={state.createForm.isCreating}>
              {state.createForm.isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 사막전 수정 다이얼로그 */}
      {state.editingDesert && (
        <DesertEditDialog
          isOpen={state.dialogs.editEvent}
          desert={state.editingDesert}
          onClose={() => {
            dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'editEvent', open: false } })
            dispatch({ type: 'SET_EDITING_DESERT', payload: null })
          }}
          onUpdate={(updatedDesert) => {
            // 목록에서 해당 사막전 업데이트
            if (state.desertResponse) {
              const updatedDeserts = state.desertResponse.deserts.map(d =>
                d.desertSeq === updatedDesert.desertSeq ? updatedDesert : d
              )
              dispatch({
                type: 'SET_DESERT_RESPONSE',
                payload: { ...state.desertResponse, deserts: updatedDeserts }
              })
            }
            dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'editEvent', open: false } })
            dispatch({ type: 'SET_EDITING_DESERT', payload: null })
          }}
        />
      )}

      {/* 필터 다이얼로그 */}
      <Dialog
        open={state.dialogs.filter}
        onOpenChange={(open) => dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'filter', open } })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>필터 설정</DialogTitle>
            <DialogDescription>날짜 범위로 사막전을 필터링합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>시작 날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !state.tempFilters.fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {state.tempFilters.fromDate ? (
                      format(state.tempFilters.fromDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>시작 날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={state.tempFilters.fromDate}
                    onSelect={(date) => dispatch({ type: 'SET_TEMP_FILTERS', payload: { fromDate: date } })}
                    initialFocus
                    locale={ko}
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
                      "justify-start text-left font-normal",
                      !state.tempFilters.toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {state.tempFilters.toDate ? (
                      format(state.tempFilters.toDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>종료 날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={state.tempFilters.toDate}
                    onSelect={(date) => dispatch({ type: 'SET_TEMP_FILTERS', payload: { toDate: date } })}
                    disabled={(date) => state.tempFilters.fromDate ? date < state.tempFilters.fromDate : false}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                dispatch({ type: 'SET_TEMP_FILTERS', payload: { fromDate: undefined, toDate: undefined } })
                dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'filter', open: false } })
                loadDeserts()
              }}
            >
              초기화
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: 'TOGGLE_DIALOG', payload: { dialog: 'filter', open: false } })
                loadDeserts()
              }}
            >
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}