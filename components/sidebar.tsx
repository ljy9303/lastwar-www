"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  UserSquare,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  CalendarDays,
  ClipboardList,
  Shuffle,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"

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
    icon: CalendarDays,
  },
  {
    title: "스쿼드 관리",
    href: "/squads",
    icon: UserSquare,
  },
  {
    title: "사후 관리",
    href: "/post-events",
    icon: ClipboardList,
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
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

  // 모바일에서 메뉴 선택 후 자동으로 닫기
  const handleNavigation = () => {
    if (isMobile) {
      setOpen(false)
    }
  }

  // 화면 크기 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && open) {
        setOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [open])

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
        <div className="p-4 border-b flex items-center">
          <h1 className="text-xl font-bold">1242 ROKK</h1>
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
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
        </nav>
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
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold truncate">
          {navItems.find((item) => pathname === item.href)?.title || "1242 ROKK"}
        </h1>
      </div>
    </>
  )
}
