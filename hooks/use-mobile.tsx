"use client"

import { useState, useEffect } from "react"

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // window가 정의되어 있는지 확인 (SSR 이슈 방지)
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }

      // 초기 확인
      checkMobile()

      // 창 크기 변경 이벤트 리스너 추가
      window.addEventListener("resize", checkMobile)

      // 정리 함수
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile
}
