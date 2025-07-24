"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, UserSquare, Menu, X, Shuffle, ChevronRight, ChevronLeft, LayoutDashboard, LogOut, User, Edit3, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { signOut, useSession, getSession } from "next-auth/react"
import { authAPI, authUtils } from "@/lib/auth-api"
import { toast } from "@/hooks/use-toast"
import { createLogger } from "@/lib/logger"
import SponsorButton from "@/components/ui/sponsor-button"

const logger = createLogger('Sidebar')

const navItems = [
  {
    title: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "유저 관리",
    href: "/users",
    icon: Users,
  },
  {
    title: "사막전 관리",
    href: "/events",
    icon: UserSquare,
  },
  {
    title: "공략 공유",
    href: "/strategy",
    icon: BookOpen,
  },
  {
    title: "연맹원 랜덤뽑기",
    href: "/lottery",
    icon: Shuffle,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isMobile = useMobile()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [pendingCount, setPendingCount] = useState(3)
  const { data: session, update: updateSession } = useSession()
  
  // NextAuth 세션 정보만 사용 (serverInfo, allianceTag 포함)
  const user = session?.user
  
  const [windowWidth, setWindowWidth] = useState(0)
  
  // 닉네임 수정 모달 상태 관리
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [editingNickname, setEditingNickname] = useState('')
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false)
  const [nicknameError, setNicknameError] = useState('')

  // NextAuth 세션 정보 확인용 로깅
  useEffect(() => {
    if (session?.user) {
      logger.debug('NextAuth 세션 사용자 정보', {
        nickname: session.user.name,
        serverInfo: session.user.serverInfo,
        allianceTag: session.user.allianceTag,
        serverAllianceId: session.user.serverAllianceId
      })
    }
  }, [session])

  // 로그아웃 함수 (NextAuth + 백엔드 쿠키 정리)
  const handleLogout = async () => {
    try {
      logger.debug('로그아웃 시작 - 백엔드 및 NextAuth')
      // 1. 백엔드 로그아웃 API 호출 (JWT 쿠키 정리)
      await authAPI.logout()
      
      // 2. NextAuth 로그아웃
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      logger.error('로그아웃 중 오류', error)
      // 오류가 발생해도 NextAuth 로그아웃은 진행
      await signOut({ callbackUrl: '/login' })
    }
  }

  // 닉네임 유효성 검증 함수
  const validateNickname = (nickname: string): string => {
    if (!nickname) {
      return '닉네임을 입력해주세요'
    }
    if (nickname.length < 2) {
      return '닉네임은 최소 2자 이상이어야 합니다'
    }
    if (nickname.length > 20) {
      return '닉네임은 최대 20자까지 입력 가능합니다'
    }
    if (!/^[a-zA-Z0-9가-힣]+$/.test(nickname)) {
      return '닉네임은 영문자, 숫자, 한글만 사용할 수 있습니다'
    }
    if (nickname === (user?.nickname || user?.name)) {
      return '기존 닉네임과 동일합니다'
    }
    return ''
  }

  // 닉네임 모달 열기
  const openNicknameModal = () => {
    if (!user?.nickname && !user?.name) return
    
    setEditingNickname(user?.nickname || user?.name || '')
    setIsNicknameModalOpen(true)
    setNicknameError('')
    logger.debug('닉네임 수정 모달 열기', { currentNickname: user?.nickname || user?.name })
  }

  // 닉네임 모달 닫기
  const closeNicknameModal = () => {
    setIsNicknameModalOpen(false)
    setEditingNickname('')
    setNicknameError('')
    logger.debug('닉네임 수정 모달 닫기')
  }

  // 닉네임 수정 저장
  const saveNickname = async () => {
    const trimmedNickname = editingNickname.trim()
    const error = validateNickname(trimmedNickname)
    
    if (error) {
      setNicknameError(error)
      return
    }

    setIsUpdatingNickname(true)
    setNicknameError('')

    try {
      logger.debug('닉네임 수정 요청', { newNickname: trimmedNickname })
      
      // 백엔드 API 호출
      const response = await authAPI.updateNickname(trimmedNickname)
      
      if (response.success) {
        closeNicknameModal()
        
        toast({
          title: "닉네임 변경 완료",
          description: `닉네임이 '${trimmedNickname}'로 변경되었습니다. 변경된 정보로 다시 로그인합니다.`,
        })
        
        logger.debug('닉네임 수정 완료 - 로그아웃 진행', { newNickname: trimmedNickname })
        
        // 닉네임 변경 완료 후 강제 로그아웃하여 새로운 JWT 토큰으로 재로그인
        setTimeout(async () => {
          await handleLogout()
        }, 2000) // 토스트 메시지를 보여준 후 로그아웃
      } else {
        throw new Error(response.message || '닉네임 변경에 실패했습니다')
      }
    } catch (error: any) {
      logger.error('닉네임 수정 실패', error)
      setNicknameError(error.message || '닉네임 변경 중 오류가 발생했습니다')
      
      toast({
        title: "닉네임 변경 실패",
        description: error.message || "닉네임 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingNickname(false)
    }
  }

  // 입력 필드 변경 처리
  const handleNicknameChange = (value: string) => {
    setEditingNickname(value)
    if (nicknameError) {
      const error = validateNickname(value.trim())
      setNicknameError(error)
    }
  }

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveNickname()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeNicknameModal()
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (windowWidth >= 768 && open) {
      setOpen(false)
    }
  }, [windowWidth, open])

  const handleNavigation = () => {
    if (isMobile) {
      setOpen(false)
    }
  }

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div
        className={`hidden md:flex h-full ${isSidebarCollapsed ? "w-16" : "w-64"} flex-col border-r bg-background transition-all duration-300`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          {!isSidebarCollapsed && (
            <Link href="/">
              <h1 className="text-xl font-bold cursor-pointer hover:text-primary transition-colors">
                {user?.serverInfo && user?.allianceTag ? `${user.serverInfo} ${user.allianceTag}` : "1242 ROKK"}
              </h1>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={isSidebarCollapsed ? "mx-auto" : ""}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
              title={item.title}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          ))}
        </nav>
        {/* 후원 버튼 */}
        <div className="p-4">
          <SponsorButton collapsed={isSidebarCollapsed} />
        </div>
        {/* 사용자 정보 및 로그아웃 */}
        <div className="p-4 border-t">
          {!isSidebarCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                <User className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {user?.serverInfo ? `${user.serverInfo}서버` : '미설정'} • {user?.allianceTag || '미설정'}
                  </p>
                  <div className="flex items-center gap-2 group">
                    <p className="text-sm font-medium truncate flex-1">{user?.nickname || user?.name}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={openNicknameModal}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="닉네임 수정"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <User className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground" />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleLogout}
                className="w-full"
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 헤더 */}
      <div className="md:hidden flex items-center h-14 border-b px-4 sticky top-0 bg-background z-10 w-full">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] max-w-[300px] p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h1 className="text-xl font-bold">
                {user?.serverInfo && user?.allianceTag ? `${user.serverInfo} ${user.allianceTag}` : "1242 ROKK"}
              </h1>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                  onClick={handleNavigation}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.title}</span>
                    {item.href === "/events" && pendingCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {pendingCount}
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              ))}
            </nav>
            {/* 모바일 후원 버튼 */}
            <div className="p-4">
              <SponsorButton collapsed={false} />
            </div>
            {/* 모바일 사용자 정보 및 로그아웃 */}
            <div className="p-4 border-t">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                  <User className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {user?.serverInfo ? `${user.serverInfo}서버` : '미설정'} • {user?.allianceTag || '미설정'}
                    </p>
                    <div className="flex items-center gap-2 group">
                    <p className="text-sm font-medium truncate flex-1">{user?.nickname || user?.name}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={openNicknameModal}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="닉네임 수정"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setOpen(false)
                    handleLogout()
                  }}
                  className="w-full justify-start gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold truncate flex items-center">
          {navItems.find((item) => pathname === item.href)?.title || (user?.serverInfo && user?.allianceTag ? `${user.serverInfo} ${user.allianceTag}` : "1242 ROKK")}
          {pathname !== "/" &&
            navItems.find((item) => pathname === item.href)?.title && ( // Added check for title existence
              <Badge variant="outline" className="ml-2 text-xs">
                {navItems.find((item) => pathname === item.href)?.title}
              </Badge>
            )}
        </h1>
      </div>

      {/* 닉네임 수정 모달 */}
      <Dialog open={isNicknameModalOpen} onOpenChange={setIsNicknameModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>닉네임 수정</DialogTitle>
            <DialogDescription className="space-y-2">
              <div>새로운 닉네임을 입력해주세요. 2~20자 사이의 영문자, 숫자, 한글만 사용할 수 있습니다.</div>
              <div className="text-amber-600 font-medium">
                ⚠️ 닉네임 변경이 완료되면 자동으로 로그아웃되며, 다시 로그인해야 합니다.
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                닉네임
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="nickname"
                  value={editingNickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="새 닉네임을 입력하세요"
                  className="w-full"
                  disabled={isUpdatingNickname}
                  autoFocus
                />
                {nicknameError && (
                  <p className="text-sm text-red-500">{nicknameError}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeNicknameModal}
              disabled={isUpdatingNickname}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              onClick={saveNickname}
              disabled={isUpdatingNickname || !editingNickname.trim()}
            >
              {isUpdatingNickname ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  변경 중...
                </>
              ) : (
                '변경하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
