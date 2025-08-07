"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

// 임시 관리자 데이터
const initialAdmins = [
  { id: 1, username: "admin", name: "관리자", role: "ADMIN", canViewHistory: true },
  { id: 2, username: "moderator", name: "운영자", role: "MODERATOR", canViewHistory: true },
  { id: 3, username: "viewer", name: "뷰어", role: "VIEWER", canViewHistory: false },
]

export default function SettingsPage() {
  const [admins, setAdmins] = useState(initialAdmins)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    name: "",
    role: "",
    canViewHistory: false
  })

  // 페이지 방문 로그
  useEffect(() => {
    // 페이지 방문 시 로그 (필요시 추가)
  }, [])

  // 시스템 설정
  const [settings, setSettings] = useState({
    voteDeadline: new Date(new Date().setDate(new Date().getDate() + 7)),
    allowUserEdit: true,
    allowVoteEdit: true,
    allowTeamEdit: true,
    showPowerInSquad: true,
    enableNotifications: false,
    backupFrequency: "daily"
  })

  // 관리자 추가 함수
  const handleAddAdmin = () => {
    const id = admins.length > 0 ? Math.max(...admins.map((a) => a.id)) + 1 : 1
    const newAdminWithId = {
      id,
      username: newAdmin.username,
      name: newAdmin.name,
      role: newAdmin.role,
      canViewHistory: newAdmin.canViewHistory
    }

    setAdmins([...admins, newAdminWithId])

    // 폼 초기화
    setNewAdmin({
      username: "",
      name: "",
      role: "",
      canViewHistory: false
    })

    setIsAddDialogOpen(false)
  }

  // 관리자 삭제 함수
  const handleDeleteAdmin = (id) => {
    if (window.confirm("정말로 이 관리자를 삭제하시겠습니까?")) {
      const deletedAdmin = admins.find((admin) => admin.id === id)
      setAdmins(admins.filter((admin) => admin.id !== id))
    }
  }

  // 역할 표시
  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return "최고 관리자"
      case "MODERATOR":
        return "운영자"
      case "VIEWER":
        return "뷰어"
      default:
        return role
    }
  }

  // 설정 저장 함수
  const saveSettings = () => {
    // 여기에 설정 저장 로직 추가
    alert("설정이 저장되었습니다.")
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">설정 및 권한 관리</h1>

      <Tabs defaultValue="admins">
        <TabsList className="mb-4">
          <TabsTrigger value="admins">관리자 계정</TabsTrigger>
          <TabsTrigger value="system">시스템 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>관리자 계정 관리</CardTitle>
              <CardDescription>시스템 관리자 계정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <OptimizedTouchButton size="mobile-default">
                      <Plus className="mr-2 h-4 w-4" />
                      관리자 추가
                    </OptimizedTouchButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 관리자 추가</DialogTitle>
                      <DialogDescription>새로운 관리자 계정 정보를 입력하세요.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">아이디</Label>
                        <Input
                          id="username"
                          value={newAdmin.username}
                          onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name">이름</Label>
                        <Input
                          id="name"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">권한</Label>
                        <Select
                          value={newAdmin.role}
                          onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="권한 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">최고 관리자</SelectItem>
                            <SelectItem value="MODERATOR">운영자</SelectItem>
                            <SelectItem value="VIEWER">뷰어</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="canViewHistory"
                          checked={newAdmin.canViewHistory}
                          onCheckedChange={(checked) => setNewAdmin({ ...newAdmin, canViewHistory: checked })}
                        />
                        <Label htmlFor="canViewHistory">히스토리 열람 권한</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <OptimizedTouchButton variant="outline" size="mobile-default" onClick={() => setIsAddDialogOpen(false)}>
                        취소
                      </OptimizedTouchButton>
                      <OptimizedTouchButton size="mobile-default" onClick={handleAddAdmin}>추가</OptimizedTouchButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {admins.length === 0 ? (
                <EmptyState
                  variant="users"
                  title="등록된 관리자가 없습니다"
                  description="시스템을 관리할 관리자 계정을 추가해주세요."
                  action={{
                    label: "관리자 추가",
                    onClick: () => setIsAddDialogOpen(true)
                  }}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>아이디</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>권한</TableHead>
                        <TableHead>히스토리 열람</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.id}</TableCell>
                          <TableCell>{admin.username}</TableCell>
                          <TableCell>{admin.name}</TableCell>
                          <TableCell>{getRoleLabel(admin.role)}</TableCell>
                          <TableCell>{admin.canViewHistory ? "O" : "X"}</TableCell>
                          <TableCell className="text-right">
                            <OptimizedTouchButton variant="ghost" size="mobile-icon" onClick={() => handleDeleteAdmin(admin.id)}>
                              <Trash className="h-4 w-4" />
                            </OptimizedTouchButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>시스템 설정</CardTitle>
              <CardDescription>시스템 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="voteDeadline">사전 투표 마감일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !settings.voteDeadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {settings.voteDeadline ? format(settings.voteDeadline, "PPP") : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={settings.voteDeadline}
                      onSelect={(date) => setSettings({ ...settings, voteDeadline: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">권한 설정</h3>

                <div className="flex items-center gap-2">
                  <Switch
                    id="allowUserEdit"
                    checked={settings.allowUserEdit}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowUserEdit: checked })}
                  />
                  <Label htmlFor="allowUserEdit">연맹원 정보 수정 허용</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="allowVoteEdit"
                    checked={settings.allowVoteEdit}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowVoteEdit: checked })}
                  />
                  <Label htmlFor="allowVoteEdit">투표 수정 허용</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="allowTeamEdit"
                    checked={settings.allowTeamEdit}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowTeamEdit: checked })}
                  />
                  <Label htmlFor="allowTeamEdit">팀 편성 수정 허용</Label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">표시 설정</h3>

                <div className="flex items-center gap-2">
                  <Switch
                    id="showPowerInSquad"
                    checked={settings.showPowerInSquad}
                    onCheckedChange={(checked) => setSettings({ ...settings, showPowerInSquad: checked })}
                  />
                  <Label htmlFor="showPowerInSquad">스쿼드 화면에 전투력 표시</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="enableNotifications"
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                  />
                  <Label htmlFor="enableNotifications">알림 활성화</Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="backupFrequency">백업 주기</Label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="백업 주기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">매시간</SelectItem>
                    <SelectItem value="daily">매일</SelectItem>
                    <SelectItem value="weekly">매주</SelectItem>
                    <SelectItem value="monthly">매월</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} className="ml-auto">
                설정 저장
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
