"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette, Settings, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ThemeSettingsProps {
  className?: string
  onClose?: () => void
}

export function ThemeSettings({ className, onClose }: ThemeSettingsProps) {
  const { theme, setTheme, themes, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse bg-muted rounded" />
            <div className="h-4 w-24 animate-pulse bg-muted rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentTheme = theme === "system" ? systemTheme : theme

  const themeOptions = [
    {
      key: "light",
      icon: Sun,
      label: "라이트 테마",
      description: "밝은 배경과 어두운 텍스트로 주간 작업에 적합",
      preview: "bg-white border border-gray-200",
      active: theme === "light"
    },
    {
      key: "dark", 
      icon: Moon,
      label: "다크 테마",
      description: "어두운 배경과 밝은 텍스트로 야간 작업에 적합하며 눈의 피로를 줄입니다",
      preview: "bg-gray-900 border border-gray-700",
      active: theme === "dark"
    },
    {
      key: "system",
      icon: Monitor,
      label: "시스템 테마",
      description: "운영체제 설정에 따라 자동으로 테마가 변경됩니다",
      preview: currentTheme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200",
      active: theme === "system"
    }
  ]

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          테마 설정
        </CardTitle>
        <CardDescription>
          화면 표시 모드를 선택하세요. 언제든지 변경할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 테마 정보 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">현재 테마</span>
          </div>
          <Badge variant="secondary" className="gap-1">
            {currentTheme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            {currentTheme === "dark" ? "다크" : "라이트"}
            {theme === "system" && " (자동)"}
          </Badge>
        </div>

        <Separator />

        {/* 테마 선택 옵션들 */}
        <div className="space-y-3">
          {themeOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.key}
                onClick={() => setTheme(option.key)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all duration-200 text-left",
                  "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  option.active 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-border/60"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full transition-colors",
                    option.active 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* 테마 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{option.label}</h3>
                      {option.active && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>

                  {/* 테마 미리보기 */}
                  <div className="flex flex-col gap-1">
                    <div className={cn("h-8 w-12 rounded border", option.preview)}>
                      <div className="h-full w-full rounded p-1">
                        <div className="h-1 w-8 bg-current opacity-20 rounded mb-1" />
                        <div className="h-1 w-6 bg-current opacity-40 rounded mb-1" />
                        <div className="h-1 w-4 bg-current opacity-20 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 게임 테마 색상 미리보기 */}
        <Separator />
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">LastWar 테마 색상</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-game-primary border-2 border-background shadow-sm" />
              <span className="text-xs text-muted-foreground">Primary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-game-accent border-2 border-background shadow-sm" />
              <span className="text-xs text-muted-foreground">Accent</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-game-success border-2 border-background shadow-sm" />
              <span className="text-xs text-muted-foreground">Success</span>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        {onClose && (
          <>
            <Separator />
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="w-full"
            >
              완료
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}