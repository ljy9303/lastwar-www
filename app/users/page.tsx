"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileDown, FileUp, Download, Bot } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { User, UserSearchParams } from "@/types/user"
import { fetchFromAPI, buildQueryString } from "@/lib/api-service"
import { autoUpsertUsers } from "@/lib/api-service"
import { UserForm } from "@/components/user/user-form"
import { UserList } from "@/components/user/user-list"
import { UserFilter } from "@/components/user/user-filter"
import { UserHistoryList } from "@/components/user/user-history-list"
import { NicknameSearch } from "@/components/user/nickname-search"
import { CsvImportExplanationDialog } from "@/components/user/csv-import-explanation-dialog"
import { UserMergeDialog } from "@/components/user/user-merge-dialog"
import { UserGradeStatistics } from "@/components/user/user-grade-statistics"
import { useToast } from "@/hooks/use-toast"
import { getSession } from "next-auth/react"

export default function UsersPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchParams, setSearchParams] = useState<UserSearchParams>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isImportExplanationOpen, setIsImportExplanationOpen] = useState(false)
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)

  // 연맹원 목록 로드
  const loadUsers = async (params: UserSearchParams = {}) => {
    setIsLoading(true)
    try {
      const queryString = buildQueryString(params)
      const data = await fetchFromAPI(`/user${queryString}`)
      setUsers(data)
    } catch (error) {
      console.error("연맹원 목록 로드 실패:", error)
      toast({
        title: "오류 발생",
        description: "연맹원 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadUsers(searchParams)
  }, [])

  // 필터 적용
  const handleFilter = (params: UserSearchParams) => {
    setSearchParams(params)
    loadUsers(params)
  }

  // 연맹원 추가 성공 처리
  const handleAddSuccess = () => {
    setIsAddDialogOpen(false)
    loadUsers(searchParams)
  }

  // 연맹원 수정 다이얼로그 열기
  const handleEdit = (user: User) => {
    setCurrentUser(user)
    setIsEditDialogOpen(true)
  }

  // 연맹원 수정 성공 처리
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setCurrentUser(null)
    loadUsers(searchParams)
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

  // CSV 샘플 다운로드
  const downloadSampleCsv = () => {
    const sampleData = [
      ["닉네임", "본부레벨", "전투력", "등급"],
      ["샘플연맹원1", "30", "120.5", "R5"],
      ["샘플연맹원2", "29", "95.2", "R4"]
    ]
    
    const csv = Papa.unparse(sampleData)
    const blob = new Blob(['\uFEFF' + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "연맹원정보_샘플.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CSV 내보내기 (개선)
  const exportToCsv = () => {
    const data = [
      ["닉네임", "본부레벨", "전투력", "등급", "탈퇴여부", "생성일", "수정일"],
      ...users.map((user) => [
        user.name,
        user.level,
        user.power,
        user.userGrade,
        user.leave ? "true" : "false",
        new Date(user.createdAt).toLocaleDateString(),
        new Date(user.updatedAt).toLocaleDateString()
      ])
    ]

    const csv = Papa.unparse(data)
    const blob = new Blob(['\uFEFF' + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `연맹원목록_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CSV 데이터 검증 함수
  const validateCsvData = (data: string[][]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    console.log("CSV 검증 시작...")
    console.log("첫 번째 행:", data[0])
    
    // 최소 행 개수 확인
    if (data.length < 2) {
      const error = `CSV 파일에 최소 2줄이 필요합니다. (현재: ${data.length}줄)`
      console.error(error)
      errors.push(error)
      return { isValid: false, errors }
    }
    
    // 헤더 확인
    const firstRow = data[0] || []
    console.log("첫 번째 행 분석:", firstRow)
    
    const hasHeader = firstRow.some(cell => 
      cell && (cell.includes('닉네임') || cell.includes('name') || 
      cell.includes('본부레벨') || cell.includes('level'))
    )
    
    console.log("헤더 존재 여부:", hasHeader)
    
    if (!hasHeader) {
      const error = `CSV 파일에 올바른 헤더가 없습니다. 첫 번째 행: [${firstRow.join(', ')}]`
      console.error(error)
      errors.push(error)
    }
    
    const startIndex = hasHeader ? 1 : 0
    const dataRows = data.slice(startIndex)
    console.log(`데이터 행 수: ${dataRows.length} (시작 인덱스: ${startIndex})`)
    
    // 각 행 검증
    dataRows.forEach((row, index) => {
      const rowNum = index + startIndex + 1
      console.log(`${rowNum}행 검증:`, row)
      
      // 빈 행 건너뛰기
      if (!row || row.every(cell => !cell || !cell.trim())) {
        console.log(`${rowNum}행: 빈 행 건너뛰기`)
        return
      }
      
      // 최소 컬럼 개수 확인 (닉네임만 필수)
      if (row.length < 1) {
        const error = `${rowNum}행: 최소 1개 컬럼이 필요합니다. (현재: ${row.length}개, 데이터: [${row.join(', ')}])`
        console.error(error)
        errors.push(error)
        return
      }
      
      // 닉네임 검증
      const name = row[0]?.trim()
      console.log(`${rowNum}행 닉네임:`, name)
      if (!name || name.length < 2 || name.length > 20) {
        const error = `${rowNum}행: 닉네임은 2-20자 사이여야 합니다. (현재: "${name}", 길이: ${name?.length || 0})`
        console.error(error)
        errors.push(error)
      }
      
      // 본부레벨 검증 (선택사항, 빈 값은 허용)
      const levelStr = row[1]?.trim()
      if (levelStr && levelStr !== '') {
        const level = parseInt(levelStr)
        console.log(`${rowNum}행 레벨:`, levelStr, "->", level)
        if (isNaN(level) || level < 1 || level > 35) {
          const error = `${rowNum}행: 본부레벨은 1-35 사이의 숫자여야 합니다. (현재: "${levelStr}")`
          console.error(error)
          errors.push(error)
        }
      } else {
        console.log(`${rowNum}행 레벨: 빈 값 (기본값 1 사용)`)
      }
      
      // 전투력 검증 (선택사항, 빈 값은 허용)
      const powerStr = row[2]?.trim()
      if (powerStr && powerStr !== '') {
        const power = parseFloat(powerStr)
        console.log(`${rowNum}행 전투력:`, powerStr, "->", power)
        if (isNaN(power) || power < 0) {
          const error = `${rowNum}행: 전투력은 0 이상의 숫자여야 합니다. (현재: "${powerStr}")`
          console.error(error)
          errors.push(error)
        }
      } else {
        console.log(`${rowNum}행 전투력: 빈 값 (기본값 0.0 사용)`)
      }
      
      // 등급 검증 (선택사항, 빈 값은 허용)
      const userGrade = row[3]?.trim()
      if (userGrade && userGrade !== '') {
        const validGrades = ['R1', 'R2', 'R3', 'R4', 'R5']
        console.log(`${rowNum}행 등급:`, userGrade)
        if (!validGrades.includes(userGrade)) {
          const error = `${rowNum}행: 등급은 R1, R2, R3, R4, R5 중 하나여야 합니다. (현재: "${userGrade}")`
          console.error(error)
          errors.push(error)
        }
      } else {
        console.log(`${rowNum}행 등급: 빈 값 (기본값 R1 사용)`)
      }
    })
    
    console.log(`CSV 검증 완료. 총 ${errors.length}개 오류`)
    return { isValid: errors.length === 0, errors }
  }

  // Excel 파일을 파싱하여 2D 배열로 변환
  const parseExcelFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
          resolve(jsonData as string[][])
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsArrayBuffer(file)
    })
  }

  // CSV 데이터를 User 객체 배열로 변환
  const processCsvData = async (data: string[][]): Promise<any[]> => {
    console.log("processCsvData 시작...")
    
    const hasHeader = data[0]?.some(cell => 
      cell && (cell.includes('닉네임') || cell.includes('name') || 
      cell.includes('본부레벨') || cell.includes('level'))
    )
    
    console.log("헤더 감지:", hasHeader)
    
    const startIndex = hasHeader ? 1 : 0
    const allRows = data.slice(startIndex)
    console.log("처리할 전체 행:", allRows.length)
    
    // 현재 로그인한 사용자의 server_alliance_id 가져오기
    let serverAllianceId: number | null = null
    try {
      const session = await getSession()
      serverAllianceId = session?.user?.serverAllianceId || null
      console.log("현재 사용자의 server_alliance_id:", serverAllianceId)
    } catch (error) {
      console.error("세션 정보 가져오기 실패:", error)
      throw new Error("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.")
    }
    
    if (!serverAllianceId) {
      throw new Error("연맹 정보가 없습니다. 로그인 상태를 확인해주세요.")
    }
    
    const validRows = allRows.filter((row, index) => {
      const rowNum = index + startIndex + 1
      
      // 빈 행 필터링
      if (!row || row.every(cell => !cell || !cell.trim())) {
        console.log(`${rowNum}행: 빈 행 제외`)
        return false
      }
      
      // 컬럼 수 확인 (최소 1개: 닉네임만 필수)
      if (row.length < 1) {
        console.log(`${rowNum}행: 컬럼 수 부족 (${row.length}개) - 제외`)
        return false
      }
      
      // 필수 데이터 확인 (닉네임만 필수)
      if (!row[0]?.trim()) {
        console.log(`${rowNum}행: 닉네임 누락 - 제외`)
        return false
      }
      
      console.log(`${rowNum}행: 유효한 데이터 - 포함`)
      return true
    })
    
    console.log("유효한 행 수:", validRows.length)

    const processedMembers = validRows.map((row, index) => {
      // 레벨 처리: 빈 값이면 1로 기본값 설정
      let level = 1
      const levelStr = row[1]?.trim()
      if (levelStr && levelStr !== '') {
        const parsedLevel = parseInt(levelStr)
        level = (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 35) ? 1 : parsedLevel
      }
      
      // 전투력 처리: 빈 값이면 0.0으로 기본값 설정
      let power = 0.0
      const powerStr = row[2]?.trim()
      if (powerStr && powerStr !== '') {
        const parsedPower = parseFloat(powerStr)
        power = isNaN(parsedPower) ? 0.0 : parsedPower
      }
      
      // 등급 처리: 빈 값이면 R1로 기본값 설정
      let userGrade = 'R1'
      const gradeStr = row[3]?.trim()
      if (gradeStr && gradeStr !== '') {
        const validGrades = ['R1', 'R2', 'R3', 'R4', 'R5']
        userGrade = validGrades.includes(gradeStr) ? gradeStr : 'R1'
      }
      
      const memberObj = {
        name: row[0]?.trim() || '',
        level: level,
        power: power,
        userGrade: userGrade,
        serverAllianceId: serverAllianceId // 현재 사용자의 server_alliance_id 추가
      }
      console.log(`연맹원 ${index + 1} 생성:`, memberObj)
      return memberObj
    })
    
    console.log("processCsvData 완료. 생성된 연맹원 수:", processedMembers.length)
    return processedMembers
  }

  // CSV 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log("파일이 선택되지 않음")
      return
    }

    console.log("CSV 파일 업로드 시작:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    })

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      const error = `파일 크기가 5MB를 초과합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      console.error(error)
      toast({
        title: "오류",
        description: error,
        variant: "destructive"
      })
      return
    }

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      const error = `엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다. (현재: ${file.name})`
      console.error(error)
      toast({
        title: "오류",
        description: error,
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    
    const processFileData = async (data: string[][]) => {
      try {
        // 1단계: 데이터 포맷 검증
        console.log("파싱된 데이터:", data)
        console.log("데이터 행 수:", data.length)
        
        const validation = validateCsvData(data)
        console.log("데이터 검증 결과:", validation)
        
        if (!validation.isValid) {
          console.error("데이터 검증 실패:", validation.errors)
          
          // 에러를 더 읽기 쉽게 포맷팅
          const errorMessage = validation.errors.length > 5 
            ? `${validation.errors.slice(0, 5).join('\n')}\n... 및 ${validation.errors.length - 5}개 추가 오류`
            : validation.errors.join('\n')
          
          toast({
            title: `데이터 검증 실패 (${validation.errors.length}개 오류)`,
            description: errorMessage,
            variant: "destructive",
            duration: 10000, // 10초간 표시
          })
          return
        }

        // 2단계: 데이터 가공
        console.log("데이터 가공 시작...")
        const processedUsers = await processCsvData(data)
        console.log("가공된 연맹원 데이터:", processedUsers)
        console.log("가공된 연맹원 수:", processedUsers.length)
        
        if (processedUsers.length === 0) {
          console.error("가공 후 유효한 데이터가 없음")
          toast({
            title: "오류",
            description: "유효한 데이터가 없습니다. 콘솔에서 자세한 정보를 확인하세요.",
            variant: "destructive"
          })
          return
        }

        // 3단계: 자동 upsert 처리 (단순화)
        await processUsersWithAutoUpsert(processedUsers)
        
      } catch (error) {
        console.error('파일 처리 오류:', error)
        toast({
          title: "오류",
          description: "파일 처리 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      } finally {
        setIsUploading(false)
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    // 파일 타입에 따라 다른 파서 사용
    if (fileName.endsWith('.csv')) {
      // CSV 파일 처리
      Papa.parse(file, {
        header: false,
        encoding: 'UTF-8',
        complete: async (results) => {
          const data = results.data as string[][]
          await processFileData(data)
        },
        error: (error) => {
          console.error('CSV 파싱 오류:', error)
          console.error('파일 정보:', {
            name: file.name,
            size: file.size,
            type: file.type
          })
          toast({
            title: "CSV 파일 파싱 오류",
            description: `CSV 파일을 읽을 수 없습니다. 오류: ${error.message || error}`,
            variant: "destructive"
          })
          setIsUploading(false)
        }
      })
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Excel 파일 처리
      try {
        const data = await parseExcelFile(file)
        await processFileData(data)
      } catch (error) {
        console.error('Excel 파싱 오류:', error)
        console.error('파일 정보:', {
          name: file.name,
          size: file.size,
          type: file.type
        })
        toast({
          title: "Excel 파일 파싱 오류",
          description: `Excel 파일을 읽을 수 없습니다. 오류: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive"
        })
        setIsUploading(false)
      }
    }
  }

  // CSV 가져오기 버튼 클릭 (설명 팝업 표시)
  const handleImportClick = () => {
    setIsImportExplanationOpen(true)
  }

  // 설명 팝업에서 확인 버튼 클릭 (실제 파일 선택)
  const handleConfirmImport = () => {
    fileInputRef.current?.click()
  }

  // 자동 upsert 처리 (단순화)
  const processUsersWithAutoUpsert = async (users: any[]) => {
    console.log("자동 upsert 시작. 처리할 연맹원 수:", users.length)
    
    try {
      const result = await autoUpsertUsers(users)
      console.log("자동 upsert 결과:", result)
      
      // 결과 토스트 표시
      let message = ""
      if (result.insertedCount > 0) {
        message += `신규 ${result.insertedCount}건`
      }
      if (result.updatedCount > 0) {
        if (message) message += ", "
        message += `기존 ${result.updatedCount}건 업데이트`
      }
      if (result.failedCount > 0) {
        if (message) message += ", "
        message += `실패 ${result.failedCount}건`
      }
      
      if (message) {
        toast({
          title: "CSV 가져오기 완료",
          description: message,
          variant: result.failedCount > 0 ? "destructive" : "default",
          duration: 8000
        })
      }
      
      // 실패한 항목이 있으면 추가 정보 표시
      if (result.failedCount > 0 && result.failedNames.length > 0) {
        toast({
          title: "처리 실패 항목",
          description: `실패: ${result.failedNames.join(', ')}`,
          variant: "destructive",
          duration: 10000
        })
      }
      
    } catch (error) {
      console.error('자동 upsert 실패:', error)
      toast({
        title: "오류",
        description: "CSV 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      // 상태 초기화 및 연맹원 목록 새로고침
      await finalizeAllProcessing()
    }
  }


  // 모든 처리 완료
  const finalizeAllProcessing = async () => {
    // 연맹원 목록 새로고침
    await loadUsers(searchParams)
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">연맹원 관리</h1>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">연맹원 목록</TabsTrigger>
          <TabsTrigger value="history">변경 히스토리</TabsTrigger>
          <TabsTrigger value="nickname-search">예전 닉네임 검색</TabsTrigger>
          <TabsTrigger value="merge">데이터 통합</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>연맹원 목록</CardTitle>
              <CardDescription>
                게임 연맹원 정보를 관리합니다. 검색 및 필터링을 통해 원하는 연맹원을 찾을 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <UserFilter onFilter={handleFilter} initialFilters={searchParams} />
              </div>

              <div className="mb-6">
                <UserGradeStatistics 
                  onGradeClick={(grade) => {
                    const newParams = { ...searchParams, userGrade: grade, leave: false }
                    setSearchParams(newParams)
                    loadUsers(newParams)
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <OptimizedTouchButton 
                        size="mobile-default" 
                        className="flex-1 sm:flex-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        연맹원 추가
                      </OptimizedTouchButton>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">새 연맹원 추가</DialogTitle>
                      </DialogHeader>
                      <UserForm mode="create" onSuccess={handleAddSuccess} onCancel={() => setIsAddDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  
                  <Link href="/users/ai-add">
                    <OptimizedTouchButton 
                      size="mobile-default" 
                      variant="outline"
                      className="flex-1 sm:flex-auto w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/20 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      AI 연맹원 등록
                    </OptimizedTouchButton>
                  </Link>
                </div>

                <div className="flex gap-2">
                  <OptimizedTouchButton 
                    variant="outline" 
                    size="mobile-default" 
                    onClick={downloadSampleCsv} 
                    className="flex-1 sm:flex-auto border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    샘플 파일
                  </OptimizedTouchButton>
                  <OptimizedTouchButton 
                    variant="outline" 
                    size="mobile-default"
                    onClick={handleImportClick} 
                    className="flex-1 sm:flex-auto border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {isUploading ? "업로드 중..." : "파일 가져오기"}
                  </OptimizedTouchButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-muted-foreground bg-muted transition ease-in-out duration-150">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로딩 중...
                  </div>
                </div>
              ) : (
                <UserList users={users} onEdit={handleEdit} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>변경 히스토리</CardTitle>
              <CardDescription>연맹원 정보 변경 내역을 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserHistoryList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nickname-search">
          <NicknameSearch />
        </TabsContent>

        <TabsContent value="merge">
          <Card>
            <CardHeader>
              <CardTitle>사용자 데이터 통합</CardTitle>
              <CardDescription>
                닉네임을 변경한 사용자의 데이터를 기존 사용자로 통합합니다. 
                예: "아빠"(신규) → "아빠꽁치"(기존)로 모든 데이터를 이관
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">주의사항</h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• 이 작업은 되돌릴 수 없습니다</li>
                        <li>• 소스 사용자의 모든 데이터가 타겟 사용자로 이관됩니다</li>
                        <li>• 소스 사용자는 완전히 삭제됩니다</li>
                        <li>• 로스터, 사막전 히스토리, 연맹 데이터 등이 모두 통합됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400 mt-0.5">💡</div>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">사용 예시</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        "아빠꽁치" 사용자가 게임에서 닉네임을 "아빠"로 변경했고, 
                        관리자가 실수로 "아빠"를 신규 사용자로 등록한 경우:
                        <br />
                        <span className="font-medium text-blue-800 dark:text-blue-200">소스: "아빠" (신규) → 타겟: "아빠꽁치" (기존)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <OptimizedTouchButton 
                  size="mobile-default"
                  onClick={() => setIsMergeDialogOpen(true)}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
                >
                  사용자 데이터 통합 시작
                </OptimizedTouchButton>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 유저 수정 다이얼로그 */}
      {currentUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">연맹원 정보 수정</DialogTitle>
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

      {/* CSV 가져오기 설명 다이얼로그 */}
      <CsvImportExplanationDialog
        isOpen={isImportExplanationOpen}
        onClose={() => setIsImportExplanationOpen(false)}
        onConfirm={handleConfirmImport}
      />

      {/* 사용자 데이터 통합 다이얼로그 */}
      <UserMergeDialog
        isOpen={isMergeDialogOpen}
        onClose={() => setIsMergeDialogOpen(false)}
        onMergeComplete={() => {
          setIsMergeDialogOpen(false)
          loadUsers(searchParams) // 사용자 목록 새로고침
        }}
        users={users}
      />

    </div>
  )
}
