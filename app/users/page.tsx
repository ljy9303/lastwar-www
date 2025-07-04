"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileDown, FileUp, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Papa from 'papaparse'
import type { User, UserSearchParams } from "@/types/user"
import { getUsers } from "@/app/actions/user-actions"
import { createUsersBatch } from "@/lib/api-service"
import { UserForm } from "@/components/user/user-form"
import { UserList } from "@/components/user/user-list"
import { UserFilter } from "@/components/user/user-filter"
import { UserHistoryList } from "@/components/user/user-history-list"
import { NicknameSearch } from "@/components/user/nickname-search"
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
      ["닉네임", "본부레벨", "전투력", "탈퇴여부"],
      ["name", "level", "power", "leave"],
      ["샘플유저1", "30", "120.5", "false"],
      ["샘플유저2", "29", "95.2", "false"],
      ["SampleUser3", "28", "80.0", "true"]
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

  // CSV 파일 업로드 처리
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    Papa.parse(file, {
      header: false,
      encoding: 'UTF-8',
      complete: async (results) => {
        try {
          const data = results.data as string[][]
          
          // 첫 번째 행이 헤더인지 확인
          const hasHeader = data[0]?.some(cell => 
            cell.includes('닉네임') || cell.includes('name') || 
            cell.includes('본부레벨') || cell.includes('level')
          )
          
          const startIndex = hasHeader ? 1 : 0
          const validRows = data.slice(startIndex).filter(row => 
            row.length >= 2 && row[0]?.trim() && row[1]?.trim()
          )

          if (validRows.length === 0) {
            toast({
              title: "오류",
              description: "유효한 데이터가 없습니다.",
              variant: "destructive",
            })
            return
          }

          // 데이터 변환 (한글/영어 헤더 모두 지원)
          const users = validRows.map(row => {
            // 기본값 설정
            let name = row[0]?.trim() || ''
            let level = parseInt(row[1]?.trim()) || 1
            let power = parseFloat(row[2]?.trim()) || 0
            let leave = false

            // 탈퇴여부 처리 (다양한 형태 지원)
            if (row[3]) {
              const leaveValue = row[3].trim().toLowerCase()
              leave = leaveValue === 'true' || leaveValue === '탈퇴' || leaveValue === 'yes' || leaveValue === '1'
            }

            return {
              name,
              level,
              power,
              leave
            }
          })

          // API 호출하여 배치 생성
          await createUsersBatch(users)
          
          toast({
            title: "성공",
            description: `${users.length}명의 유저가 추가되었습니다.`,
          })
          
          // 유저 목록 새로고침
          loadUsers(searchParams)
          
        } catch (error) {
          console.error('CSV 업로드 오류:', error)
          toast({
            title: "오류",
            description: "CSV 파일 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          })
        } finally {
          setIsUploading(false)
          // 파일 입력 초기화
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      },
      error: (error) => {
        console.error('CSV 파싱 오류:', error)
        toast({
          title: "오류",
          description: "CSV 파일을 읽을 수 없습니다.",
          variant: "destructive",
        })
        setIsUploading(false)
      }
    })
  }

  // CSV 가져오기 버튼 클릭
  const handleImportClick = () => {
    fileInputRef.current?.click()
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
                    CSV 샘플
                  </Button>
                  <Button variant="outline" onClick={exportToCsv} className="flex-1 sm:flex-auto">
                    <FileDown className="mr-2 h-4 w-4" />
                    CSV 내보내기
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleImportClick} 
                    className="flex-1 sm:flex-auto"
                    disabled={isUploading}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {isUploading ? "업로드 중..." : "CSV 가져오기"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
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
    </div>
  )
}
