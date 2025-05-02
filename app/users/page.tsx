"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileDown, FileUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { User, UserSearchParams } from "@/types/user"
import { getUsers } from "@/app/actions/user-actions"
import { UserForm } from "@/components/user/user-form"
import { UserList } from "@/components/user/user-list"
import { UserFilter } from "@/components/user/user-filter"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = ["ID", "닉네임", "본부레벨", "전투력", "연맹탈퇴여부"]
    const csvContent = [
      headers.join(","),
      ...users.map((user) => [user.id, user.name, user.level, user.power, user.leave ? "O" : "X"].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `유저목록_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">유저 관리</h1>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">유저 목록</TabsTrigger>
          <TabsTrigger value="history">변경 히스토리</TabsTrigger>
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

              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
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
                  <Button variant="outline" onClick={exportToCsv}>
                    <FileDown className="mr-2 h-4 w-4" />
                    CSV 내보내기
                  </Button>
                  <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    CSV 가져오기
                  </Button>
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
              <div className="text-center py-8 text-muted-foreground">히스토리 기능은 아직 구현되지 않았습니다.</div>
            </CardContent>
          </Card>
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
