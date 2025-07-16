"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, UserSquare, Menu, X, Shuffle, ChevronRight, ChevronLeft, LayoutDashboard, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { signOut, useSession } from "next-auth/react"

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
  const { data: session } = useSession()
  const user = session?.user
  
  // 세션 정보 로깅 제거 (불필요한 리렌더링 방지)
  const [windowWidth, setWindowWidth] = useState(0)

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
        {/* 사용자 정보 및 로그아웃 */}
        <div className="p-4 border-t mt-auto">
          {!isSidebarCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                <User className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {user?.serverInfo ? `${user.serverInfo}서버` : '미설정'} • {user?.allianceTag || '미설정'}
                  </p>
                  <p className="text-sm font-medium truncate">{user?.nickname || user?.name}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: '/login' })}
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
                onClick={() => signOut({ callbackUrl: '/login' })}
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
            {/* 모바일 사용자 정보 및 로그아웃 */}
            <div className="p-4 border-t mt-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                  <User className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {user?.serverInfo ? `${user.serverInfo}서버` : '미설정'} • {user?.allianceTag || '미설정'}
                    </p>
                    <p className="text-sm font-medium truncate">{user?.nickname || user?.name}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setOpen(false)
                    signOut({ callbackUrl: '/login' })
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
    </>
  )
}
