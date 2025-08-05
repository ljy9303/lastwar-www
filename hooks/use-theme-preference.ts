"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ThemePreference {
  theme: string | undefined
  systemTheme: string | undefined
  currentTheme: string | undefined
  isLight: boolean
  isDark: boolean
  isSystem: boolean
  setTheme: (theme: string) => void
  toggleTheme: () => void
  mounted: boolean
}

export function useThemePreference(): ThemePreference {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === "system" ? systemTheme : theme
  
  const isLight = currentTheme === "light"
  const isDark = currentTheme === "dark"
  const isSystem = theme === "system"

  const toggleTheme = () => {
    if (theme === "light" || (theme === "system" && currentTheme === "light")) {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  return {
    theme,
    systemTheme,
    currentTheme,
    isLight,
    isDark,
    isSystem,
    setTheme,
    toggleTheme,
    mounted
  }
}

// 테마 변경 시 애니메이션 클래스 관리
export function useThemeTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const handleThemeChange = (callback: () => void) => {
    setIsTransitioning(true)
    document.documentElement.classList.add('theme-transitioning')
    
    callback()
    
    setTimeout(() => {
      setIsTransitioning(false)
      document.documentElement.classList.remove('theme-transitioning')
    }, 300)
  }

  return {
    isTransitioning,
    handleThemeChange
  }
}

// 테마별 스타일 유틸리티
export function useThemeStyles() {
  const { currentTheme, mounted } = useThemePreference()

  const getThemeClass = (lightClass: string, darkClass: string) => {
    if (!mounted) return lightClass // SSR 기본값
    return currentTheme === "dark" ? darkClass : lightClass
  }

  const getGameThemeColors = () => ({
    primary: "hsl(var(--game-primary))",
    secondary: "hsl(var(--game-secondary))",
    accent: "hsl(var(--game-accent))",
    success: "hsl(var(--game-success))",
    warning: "hsl(var(--game-warning))",
    danger: "hsl(var(--game-danger))",
  })

  return {
    getThemeClass,
    getGameThemeColors,
    currentTheme,
    mounted
  }
}