import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })
  const { pathname } = request.nextUrl

  console.log(`[Middleware] pathname: ${pathname}, token exists: ${!!token}`)
  if (token) {
    console.log(`[Middleware] token details:`, JSON.stringify(token, null, 2))
  }

  // 로그인 페이지 접근 시 이미 로그인되어 있으면 홈으로 리다이렉트
  if (pathname.startsWith('/login') || pathname.startsWith('/test-login')) {
    if (token) {
      console.log('[Middleware] 로그인 페이지에서 토큰 발견 - 홈으로 리다이렉트')
      console.log('[Middleware] serverAllianceId:', token.serverAllianceId)
      // serverAllianceId 체크
      if (token.serverAllianceId) {
        console.log('[Middleware] Redirecting to /')
        return NextResponse.redirect(new URL('/', request.url))
      } else {
        // serverAllianceId가 없으면 signup으로
        console.log('[Middleware] Redirecting to /signup')
        return NextResponse.redirect(new URL('/signup', request.url))
      }
    }
    return NextResponse.next()
  }

  // 회원가입 페이지 접근 시
  if (pathname === '/signup') {
    if (!token) {
      console.log('[Middleware] 회원가입 페이지에서 토큰 없음 - 로그인으로 리다이렉트')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // 이미 프로필 완성된 경우 메인으로
    if (token && token.serverAllianceId) {
      console.log('[Middleware] 이미 프로필 완성됨 - 메인으로 리다이렉트')
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
      console.log('[Middleware] 보호된 페이지에서 토큰 없음 - 로그인으로 리다이렉트')
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // 토큰은 있지만 serverAllianceId가 없는 경우
    if (token && !token.serverAllianceId && pathname !== '/signup') {
      console.log('[Middleware] serverAllianceId 없음 - signup으로 리다이렉트')
      return NextResponse.redirect(new URL('/signup', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/test-login',
    '/signup',
    '/dashboard/:path*',
    '/admin/:path*',
    '/users/:path*',
    '/events/:path*'
  ]
}