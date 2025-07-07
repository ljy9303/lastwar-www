"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileDown, FileUp, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { User, UserSearchParams } from "@/types/user"
import { getUsers } from "@/app/actions/user-actions"
import { autoUpsertUsers } from "@/lib/api-service"
import { UserForm } from "@/components/user/user-form"
import { UserList } from "@/components/user/user-list"
import { UserFilter } from "@/components/user/user-filter"
import { UserHistoryList } from "@/components/user/user-history-list"
import { NicknameSearch } from "@/components/user/nickname-search"
import { CsvImportExplanationDialog } from "@/components/user/csv-import-explanation-dialog"
import { useToast } from "@/hooks/use-toast"

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

  // 유저 목록 로드
  const loadUsers = async (params: UserSearchParams = {}) => {
    setIsLoading(true)
    try {
      const data = await getUsers(params)
      setUsers(data)
    } catch (error) {
      console.error("유저 목록 로드 실패:", error)
      toast({
        title: "오류 발생",
        description: "유저 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
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

  // 유저 추가 성공 처리
  const handleAddSuccess = () => {
    setIsAddDialogOpen(false)
    loadUsers(searchParams)
  }

  // 유저 수정 다이얼로그 열기
  const handleEdit = (user: User) => {
    setCurrentUser(user)
    setIsEditDialogOpen(true)
  }

  // 유저 수정 성공 처리
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
      ["샘플유저1", "30", "120.5", "R5"],
      ["샘플유저2", "29", "95.2", "R4"],
      ["SampleUser3", "28", "80.0", "R3"]
    ]
    
    const csv = Papa.unparse(sampleData)
    const blob = new Blob(['\uFEFF' + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "유저정보_샘플.csv")
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
    link.setAttribute("download", `유저목록_${new Date().toISOString().split("T")[0]}.csv`)
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
      
      // 최소 컬럼 개수 확인
      if (row.length < 4) {
        const error = `${rowNum}행: 최소 4개 컬럼이 필요합니다. (현재: ${row.length}개, 데이터: [${row.join(', ')}])`
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
      
      // 본부레벨 검증
      const levelStr = row[1]?.trim()
      const level = parseInt(levelStr)
      console.log(`${rowNum}행 레벨:`, levelStr, "->", level)
      if (isNaN(level) || level < 1 || level > 50) {
        const error = `${rowNum}행: 본부레벨은 1-50 사이의 숫자여야 합니다. (현재: "${levelStr}")`
        console.error(error)
        errors.push(error)
      }
      
      // 전투력 검증
      const powerStr = row[2]?.trim()
      const power = parseFloat(powerStr)
      console.log(`${rowNum}행 전투력:`, powerStr, "->", power)
      if (isNaN(power) || power < 0) {
        const error = `${rowNum}행: 전투력은 0 이상의 숫자여야 합니다. (현재: "${powerStr}")`
        console.error(error)
        errors.push(error)
      }
      
      // 등급 검증
      const userGrade = row[3]?.trim()
      const validGrades = ['R1', 'R2', 'R3', 'R4', 'R5']
      console.log(`${rowNum}행 등급:`, userGrade)
      if (!validGrades.includes(userGrade)) {
        const error = `${rowNum}행: 등급은 R1, R2, R3, R4, R5 중 하나여야 합니다. (현재: "${userGrade}")`
        console.error(error)
        errors.push(error)
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
  const processCsvData = (data: string[][]): any[] => {
    console.log("processCsvData 시작...")
    
    const hasHeader = data[0]?.some(cell => 
      cell && (cell.includes('닉네임') || cell.includes('name') || 
      cell.includes('본부레벨') || cell.includes('level'))
    )
    
    console.log("헤더 감지:", hasHeader)
    
    const startIndex = hasHeader ? 1 : 0
    const allRows = data.slice(startIndex)
    console.log("처리할 전체 행:", allRows.length)
    
    const validRows = allRows.filter((row, index) => {
      const rowNum = index + startIndex + 1
      
      // 빈 행 필터링
      if (!row || row.every(cell => !cell || !cell.trim())) {
        console.log(`${rowNum}행: 빈 행 제외`)
        return false
      }
      
      // 컬럼 수 확인
      if (row.length < 4) {
        console.log(`${rowNum}행: 컬럼 수 부족 (${row.length}개) - 제외`)
        return false
      }
      
      // 필수 데이터 확인
      if (!row[0]?.trim() || !row[1]?.trim()) {
        console.log(`${rowNum}행: 필수 데이터 누락 (닉네임: "${row[0]}", 레벨: "${row[1]}") - 제외`)
        return false
      }
      
      console.log(`${rowNum}행: 유효한 데이터 - 포함`)
      return true
    })
    
    console.log("유효한 행 수:", validRows.length)

    const processedUsers = validRows.map((row, index) => {
      const userObj = {
        name: row[0]?.trim() || '',
        level: parseInt(row[1]?.trim()) || 1,
        power: parseFloat(row[2]?.trim()) || 0,
        userGrade: row[3]?.trim() || 'R1'
      }
      console.log(`유저 ${index + 1} 생성:`, userObj)
      return userObj
    })
    
    console.log("processCsvData 완료. 생성된 유저 수:", processedUsers.length)
    return processedUsers
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
        variant: "destructive",
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
        variant: "destructive",
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
        const processedUsers = processCsvData(data)
        console.log("가공된 유저 데이터:", processedUsers)
        console.log("가공된 유저 수:", processedUsers.length)
        
        if (processedUsers.length === 0) {
          console.error("가공 후 유효한 데이터가 없음")
          toast({
            title: "오류",
            description: "유효한 데이터가 없습니다. 콘솔에서 자세한 정보를 확인하세요.",
            variant: "destructive",
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
          variant: "destructive",
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
            variant: "destructive",
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
          variant: "destructive",
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
    console.log("자동 upsert 시작. 처리할 유저 수:", users.length)
    
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
          duration: 8000,
        })
      }
      
      // 실패한 항목이 있으면 추가 정보 표시
      if (result.failedCount > 0 && result.failedNames.length > 0) {
        toast({
          title: "처리 실패 항목",
          description: `실패: ${result.failedNames.join(', ')}`,
          variant: "destructive",
          duration: 10000,
        })
      }
      
    } catch (error) {
      console.error('자동 upsert 실패:', error)
      toast({
        title: "오류",
        description: "CSV 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      // 상태 초기화 및 유저 목록 새로고침
      await finalizeAllProcessing()
    }
  }


  // 모든 처리 완료
  const finalizeAllProcessing = async () => {
    // 유저 목록 새로고침
    await loadUsers(searchParams)
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">유저 관리</h1>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">유저 목록</TabsTrigger>
          <TabsTrigger value="history">변경 히스토리</TabsTrigger>
          <TabsTrigger value="nickname-search">예전 닉네임 검색</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>유저 목록</CardTitle>
              <CardDescription>
                게임 유저 정보를 관리합니다. 검색 및 필터링을 통해 원하는 유저를 찾을 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <UserFilter onFilter={handleFilter} initialFilters={searchParams} />
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <div className="flex gap-2">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 sm:flex-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        유저 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>새 유저 추가</DialogTitle>
                      </DialogHeader>
                      <UserForm mode="create" onSuccess={handleAddSuccess} onCancel={() => setIsAddDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadSampleCsv} className="flex-1 sm:flex-auto">
                    <Download className="mr-2 h-4 w-4" />
                    샘플 파일
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleImportClick} 
                    className="flex-1 sm:flex-auto"
                    disabled={isUploading}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {isUploading ? "업로드 중..." : "파일 가져오기"}
                  </Button>
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
                <div className="text-center py-8">로딩 중...</div>
              ) : (
                <UserList users={users} onEdit={handleEdit} onDeleted={() => loadUsers(searchParams)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>변경 히스토리</CardTitle>
              <CardDescription>유저 정보 변경 내역을 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserHistoryList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nickname-search">
          <NicknameSearch />
        </TabsContent>
      </Tabs>

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

      {/* CSV 가져오기 설명 다이얼로그 */}
      <CsvImportExplanationDialog
        isOpen={isImportExplanationOpen}
        onClose={() => setIsImportExplanationOpen(false)}
        onConfirm={handleConfirmImport}
      />

    </div>
  )
}
