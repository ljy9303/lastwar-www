"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  FileSpreadsheet,
  UserSquare,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  CalendarDays,
  ClipboardList,
  Shuffle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

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
    title: "열차장 랜덤뽑기",
    href: "/lottery",
    icon: Shuffle,
  },
  {
    title: "이벤트 관리",
    href: "/events",
    icon: CalendarDays,
  },
  {
    title: "사전조사 관리",
    href: "/surveys",
    icon: FileSpreadsheet,
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
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">사막전 매치 관리</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center h-14 border-b px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h1 className="text-xl font-bold">사막전 매치 관리</h1>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold">사막전 매치 관리</h1>
      </div>
    </>
  )
}
