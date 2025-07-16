import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // 로그인 페이지 접근 시 이미 로그인되어 있으면 홈으로 리다이렉트
  if (pathname.startsWith('/login') || pathname.startsWith('/test-login')) {
    if (token) {
      // 이미 로그인되어 있으면 홈으로 리다이렉트
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 기존 /dashboard 경로 접근 시 홈으로 리다이렉트 (하위 호환성)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 보호된 페이지 접근 시 로그인 확인
  if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/users') || pathname.startsWith('/events')) {
    if (!token) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/test-login',
    '/dashboard/:path*',
    '/admin/:path*',
    '/users/:path*',
    '/events/:path*'
  ]
}