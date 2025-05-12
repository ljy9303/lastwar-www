"use client"

import { useState, useEffect } from "react"

export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 초기 설정
    setIsMobile(window.innerWidth < breakpoint)

    // 리사이즈 이벤트 핸들러
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // 이벤트 리스너 등록
    window.addEventListener("resize", handleResize)

    // 클린업 함수
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [breakpoint])

  return isMobile
}
