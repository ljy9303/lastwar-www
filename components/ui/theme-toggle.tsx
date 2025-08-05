"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "button" | "icon" | "dropdown"
  collapsed?: boolean
  className?: string
  showTooltip?: boolean
}

export function ThemeToggle({ 
  variant = "dropdown", 
  collapsed = false,
  className,
  showTooltip = true
}: ThemeToggleProps) {
  const { theme, setTheme, themes, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // 하이드레이션 이슈 방지
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", className)}
        disabled
      >
        <div className="h-4 w-4 animate-pulse bg-muted rounded" />
        <span className="sr-only">테마 로딩 중...</span>
      </Button>
    )
  }

  const currentTheme = theme === "system" ? systemTheme : theme
  
  // 테마별 아이콘 및 레이블
  const themeConfig = {
    light: {
      icon: Sun,
      label: "라이트 테마",
      description: "밝은 배경과 어두운 텍스트"
    },
    dark: {
      icon: Moon,
      label: "다크 테마", 
      description: "어두운 배경과 밝은 텍스트"
    },
    system: {
      icon: Monitor,
      label: "시스템 테마",
      description: "시스템 설정에 따라 자동 변경"
    }
  }

  const getCurrentIcon = () => {
    if (theme === "system") {
      return currentTheme === "dark" ? Moon : Sun
    }
    return themeConfig[theme as keyof typeof themeConfig]?.icon || Sun
  }

  const CurrentIcon = getCurrentIcon()

  // 단순 토글 버튼 (라이트 <-> 다크)
  const toggleTheme = () => {
    if (theme === "light" || (theme === "system" && currentTheme === "light")) {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  // 아이콘만 표시하는 버튼
  if (variant === "icon") {
    const IconButton = (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn(
          "h-9 w-9 relative overflow-hidden",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-all duration-200 ease-in-out",
          className
        )}
        aria-label={`현재 ${themeConfig[theme as keyof typeof themeConfig]?.label}. 클릭하여 테마 변경`}
      >
        {/* 아이콘 전환 애니메이션 */}
        <div className="relative h-4 w-4">
          <Sun 
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out transform",
              currentTheme === "dark" 
                ? "rotate-90 scale-0 opacity-0" 
                : "rotate-0 scale-100 opacity-100"
            )}
          />
          <Moon 
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out transform",
              currentTheme === "dark" 
                ? "rotate-0 scale-100 opacity-100" 
                : "-rotate-90 scale-0 opacity-0"
            )}
          />
        </div>
        <span className="sr-only">테마 전환</span>
      </Button>
    )

    if (showTooltip && collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {IconButton}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>테마 변경</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return IconButton
  }

  // 텍스트가 포함된 버튼
  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        onClick={toggleTheme}
        className={cn(
          "justify-start gap-2 w-full",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-all duration-200",
          className
        )}
        aria-label={`현재 ${themeConfig[theme as keyof typeof themeConfig]?.label}. 클릭하여 테마 변경`}
      >
        <div className="relative h-4 w-4 flex-shrink-0">
          <Sun 
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out transform",
              currentTheme === "dark" 
                ? "rotate-90 scale-0 opacity-0" 
                : "rotate-0 scale-100 opacity-100"
            )}
          />
          <Moon 
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out transform",
              currentTheme === "dark" 
                ? "rotate-0 scale-100 opacity-100" 
                : "-rotate-90 scale-0 opacity-0"
            )}
          />
        </div>
        {!collapsed && (
          <span className="text-sm">
            {currentTheme === "dark" ? "라이트 테마로 변경" : "다크 테마로 변경"}
          </span>
        )}
      </Button>
    )
  }

  // 드롭다운 메뉴 (기본값)
  const DropdownButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 relative overflow-hidden",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-all duration-200",
            className
          )}
          aria-label="테마 선택 메뉴 열기"
        >
          <div className="relative h-4 w-4">
            <Sun 
              className={cn(
                "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out transform",
                currentTheme === "dark" 
                  ? "rotate-90 scale-0 opacity-0" 
                  : "rotate-0 scale-100 opacity-100"
              )}
            />
            <Moon 
              className={cn(
                "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out transform",
                currentTheme === "dark" 
                  ? "rotate-0 scale-100 opacity-100" 
                  : "-rotate-90 scale-0 opacity-0"
              )}
            />
          </div>
          <span className="sr-only">테마 선택</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56"
        side={collapsed ? "right" : "bottom"}
      >
        {Object.entries(themeConfig).map(([themeKey, config]) => {
          const Icon = config.icon
          const isActive = theme === themeKey
          
          return (
            <DropdownMenuItem
              key={themeKey}
              onClick={() => setTheme(themeKey)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                "focus:bg-accent focus:text-accent-foreground",
                isActive && "bg-accent/50 text-accent-foreground"
              )}
              aria-label={`${config.label}로 변경. ${config.description}`}
            >
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground">
                  {config.description}
                </span>
                {isActive && (
                  <span className="text-xs font-medium text-primary">
                    현재 선택됨
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (showTooltip && collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {DropdownButton}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>테마 선택</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return DropdownButton
}

// 컴팩트한 테마 스위치 컴포넌트 (모바일 친화적)
export function CompactThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("h-6 w-11 bg-muted rounded-full animate-pulse", className)} />
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "touch-optimized min-touch-target",
        isDark ? "bg-primary" : "bg-muted",
        className
      )}
      role="switch"
      aria-checked={isDark}
      aria-label={`테마를 ${isDark ? "라이트" : "다크"} 모드로 변경`}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background transition-transform duration-300 ease-in-out",
          "flex items-center justify-center",
          "shadow-lg",
          isDark ? "translate-x-6" : "translate-x-1"
        )}
      >
        {isDark ? (
          <Moon className="h-2.5 w-2.5 text-primary" />
        ) : (
          <Sun className="h-2.5 w-2.5 text-muted-foreground" />
        )}
      </span>
    </button>
  )
}