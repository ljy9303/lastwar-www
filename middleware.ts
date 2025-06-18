import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 인증이 필요하지 않은 경로들
const publicPaths = [
  "/login",
  "/auth/callback",
  "/auth/error",
  "/api/auth",
  "/oauth2",
  "/_next",
  "/favicon.ico",
  "/public",
]

// 경로가 공개 경로인지 확인
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 그대로 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // API 라우트는 별도 처리하지 않음 (서버에서 처리)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // 정적 파일들은 그대로 통과
  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
