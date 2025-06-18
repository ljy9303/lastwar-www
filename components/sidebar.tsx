"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  UserSquare,
  Menu,
  X,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  LogIn,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"

// hi yuri
const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
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
  //{
  //  title: "설정",
  //  href: "/settings",
  //  icon: Settings,
  //},
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
  const [pendingCount, setPendingCount] = useState(3) // Example state for pending count
  const { isAuthenticated, user, logout } = useAuth()
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    // Function to update windowWidth state
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Set initial window width
    setWindowWidth(window.innerWidth)

    // Add event listener for window resize
    window.addEventListener("resize", handleResize)

    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", handleResize)
  }, []) // Empty dependency array ensures this effect runs only once on mount

  useEffect(() => {
    if (windowWidth >= 768 && open) {
      setOpen(false)
    }
  }, [windowWidth, open])

  // 공개 라우트에서는 사이드바를 숨김
  const PUBLIC_ROUTES = ["/login", "/auth/callback"]
  if (PUBLIC_ROUTES.includes(pathname)) {
    return null
  }

  // 모바일에서 메뉴 선택 후 자동으로 닫기
  const handleNavigation = () => {
    if (isMobile) {
      setOpen(false)
    }
  }

  // 화면 크기 변경 시 모바일 메뉴 닫기
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth >= 768 && open) {
  //       setOpen(false)
  //     }
  //   }

  //   window.addEventListener("resize", handleResize)
  //   return () => window.removeEventListener("resize", handleResize)
  // }, [open])

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div
        className={`hidden md:flex h-full ${isSidebarCollapsed ? "w-16" : "w-64"} flex-col border-r bg-background transition-all duration-300`}
      >
        {/* 이미지나 로고를 여기에 추가할 수 있습니다 */}
        <div className="p-4 border-b flex items-center justify-between">
          {!isSidebarCollapsed && (
            <Link href="/dashboard">
              <h1 className="text-xl font-bold cursor-pointer hover:text-primary transition-colors">1242 ROKK</h1>
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
        <div className="p-4 border-t mt-auto">
          {isAuthenticated ? (
            <div className="space-y-2">
              {!isSidebarCollapsed && user && (
                <p className="text-xs text-muted-foreground truncate">{user.name || user.email || "사용자"}</p>
              )}
              <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                {!isSidebarCollapsed && "로그아웃"}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/login")}
              className="w-full justify-start"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {!isSidebarCollapsed && "로그인"}
            </Button>
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
              <h1 className="text-xl font-bold">1242 ROKK</h1>
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
                    {/* 예: 미완료 작업 수 표시 */}
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
            <div className="p-4 border-t mt-auto">
              {isAuthenticated ? (
                <div className="space-y-2">
                  {user && (
                    <p className="text-xs text-muted-foreground truncate">{user.name || user.email || "사용자"}</p>
                  )}
                  <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/login")}
                  className="w-full justify-start"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold truncate flex items-center">
          {navItems.find((item) => pathname === item.href)?.title || "1242 ROKK"}
          {pathname !== "/" && (
            <Badge variant="outline" className="ml-2 text-xs">
              {navItems.find((item) => pathname === item.href)?.title}
            </Badge>
          )}
        </h1>
      </div>
    </>
  )
}
