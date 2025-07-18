import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl
  
  // 백엔드 JWT 쿠키도 확인 (LASTWAR_JWT)
  const jwtToken = request.cookies.get('LASTWAR_JWT')?.value
  const hasAuth = token || jwtToken
  
  console.log(`[Middleware] ${pathname} - NextAuth: ${token ? 'exists' : 'none'}, JWT: ${jwtToken ? 'exists' : 'none'}`)

  // 로그인 페이지 접근 시 이미 로그인되어 있으면 홈으로 리다이렉트
  if (pathname.startsWith('/login') || pathname.startsWith('/test-login')) {
    if (hasAuth) {
      // 이미 로그인되어 있으면 홈으로 리다이렉트
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 기존 /dashboard 경로 접근 시 홈으로 리다이렉트 (하위 호환성)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 회원가입 페이지는 NextAuth 토큰 없이도 접근 가능
  if (pathname === '/signup') {
    return NextResponse.next()
  }

  // 카카오 콜백 페이지는 NextAuth 토큰 없이도 접근 가능
  if (pathname.startsWith('/auth/kakao/callback')) {
    return NextResponse.next()
  }

  // 보호된 페이지 접근 시 로그인 확인
  if (pathname.startsWith('/admin') || pathname.startsWith('/users') || pathname.startsWith('/events')) {
    if (!hasAuth) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // 홈페이지는 임시로 보호 해제 (테스트용)
  if (pathname === '/') {
    console.log(`[Middleware] 홈페이지 접근 허용 - hasAuth: ${hasAuth}`)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/test-login',
    '/signup',
    '/auth/kakao/callback',
    '/dashboard/:path*',
    '/admin/:path*',
    '/users/:path*',
    '/events/:path*'
  ]
}