import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "kakao",
      name: "Kakao",
      credentials: {
        code: { label: "Code", type: "text" },
        redirectUri: { label: "Redirect URI", type: "text" }
      },
      async authorize(credentials) {
        console.log('[NextAuth Kakao] authorize 시작 - credentials:', {
          code: credentials?.code ? '있음' : '없음',
          redirectUri: credentials?.redirectUri
        })
        
        if (!credentials?.code) {
          console.error('[NextAuth Kakao] 인가코드가 없음')
          return null
        }

        try {
          console.log('[NextAuth Kakao] 백엔드 API 호출 시작')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/kakao/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'NextAuth-Frontend'
            },
            body: JSON.stringify({
              code: credentials.code,
              redirectUri: credentials.redirectUri
            })
          })

          console.log('[NextAuth Kakao] 백엔드 응답 상태:', response.status, response.statusText)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('[NextAuth Kakao] HTTP 에러:', response.status, errorText)
            
            // 400 에러 (authorization code 관련)는 null 반환하여 NextAuth에서 CredentialsSignin 에러 발생
            if (response.status === 400) {
              console.error('[NextAuth Kakao] OAuth 인가코드 오류 - 재시도 또는 새 로그인 필요')
              return null
            }
            
            return null
          }
          
          const data = await response.json()
          console.log('[NextAuth Kakao] 백엔드 응답 데이터:', JSON.stringify(data, null, 2))

          if (data.status === 'login') {
            console.log('[NextAuth Kakao] 로그인 성공 - 사용자 객체 생성')
            // 기존 회원: JWT 토큰과 함께 로그인 완료 (OAuth 인가코드는 저장하지 않음)
            const userObj = {
              id: data.user.userId.toString(),
              email: data.user.email,
              name: data.user.nickname,
              image: data.user.profileImageUrl,
              accessToken: data.accessToken, // 백엔드에서 발급한 JWT 토큰
              serverAllianceId: data.user.serverAllianceId,
              role: data.user.role,
              registrationComplete: data.user.registrationComplete,
              serverInfo: data.user.serverInfo,
              allianceTag: data.user.allianceTag,
              userId: data.user.userId,
              kakaoId: data.user.kakaoId
            }
            console.log('[NextAuth Kakao] 생성된 사용자 객체:', userObj)
            return userObj
          } else if (data.status === 'signup_required') {
            // 신규 회원: 임시 객체 반환하되 registrationComplete = false로 마킹
            console.log('[NextAuth Kakao] 회원가입 필요 - 임시 사용자 객체 반환')
            return {
              id: data.user.userId.toString(),
              email: data.user.email,
              name: data.user.nickname,
              image: data.user.profileImageUrl,
              accessToken: null, // 회원가입 완료 전까지는 토큰 없음
              serverAllianceId: data.user.serverAllianceId,
              role: data.user.role,
              registrationComplete: false, // 회원가입 필요 플래그
              serverInfo: data.user.serverInfo,
              allianceTag: data.user.allianceTag,
              userId: data.user.userId,
              kakaoId: data.user.kakaoId,
              requiresSignup: true // 추가 플래그
            }
          } else {
            console.error('[NextAuth Kakao] 알 수 없는 상태:', data.status)
            return null
          }
        } catch (error) {
          console.error('[NextAuth Kakao] 예외 발생:', error)
          // 네트워크 에러나 JSON 파싱 에러 등
          return null
        }
      }
    }),
    CredentialsProvider({
      id: "test",
      name: "Test Login",
      credentials: {
        email: { label: "Email", type: "email" },
        nickname: { label: "Nickname", type: "text" }
      },
      async authorize(credentials) {
        console.log('[NextAuth Test] authorize 시작 - credentials:', {
          email: credentials?.email ? '있음' : '없음',
          nickname: credentials?.nickname ? '있음' : '없음'
        })
        
        if (!credentials?.email) {
          console.error('[NextAuth Test] 이메일이 없음')
          return null
        }

        try {
          console.log('[NextAuth Test] 백엔드 API 호출 시작')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/test/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              nickname: credentials.nickname
            })
          })

          console.log('[NextAuth Test] 백엔드 응답 상태:', response.status, response.statusText)
          const data = await response.json()
          console.log('[NextAuth Test] 백엔드 응답 데이터:', JSON.stringify(data, null, 2))

          if (response.ok && data.status === 'login') {
            console.log('[NextAuth Test] 로그인 성공 - 사용자 객체 생성')
            const userObj = {
              id: data.user.userId.toString(),
              email: data.user.email,
              name: data.user.nickname,
              image: data.user.profileImageUrl,
              accessToken: data.accessToken, // 백엔드에서 발급한 JWT 토큰만 저장
              serverAllianceId: data.user.serverAllianceId,
              role: data.user.role,
              registrationComplete: data.user.registrationComplete,
              serverInfo: data.user.serverInfo,
              allianceTag: data.user.allianceTag,
              userId: data.user.userId,
              kakaoId: data.user.kakaoId
            }
            console.log('[NextAuth Test] 생성된 사용자 객체:', userObj)
            return userObj
          } else {
            console.error('[NextAuth Test] 로그인 실패 또는 알 수 없는 상태:', data.status)
          }

          return null
        } catch (error) {
          console.error('[NextAuth Test] 예외 발생:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.serverAllianceId = user.serverAllianceId
        token.role = user.role
        token.registrationComplete = user.registrationComplete
        token.serverInfo = user.serverInfo
        token.allianceTag = user.allianceTag
        token.userId = user.id
        token.kakaoId = user.kakaoId
        token.requiresSignup = user.requiresSignup
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.id = token.sub
      session.user.userId = token.userId
      session.user.kakaoId = token.kakaoId
      session.user.nickname = session.user.name  // name을 nickname으로도 사용
      session.user.serverAllianceId = token.serverAllianceId
      session.user.role = token.role
      session.user.registrationComplete = token.registrationComplete
      session.user.serverInfo = token.serverInfo
      session.user.allianceTag = token.allianceTag
      session.user.requiresSignup = token.requiresSignup
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1일 (24시간)
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1일 (24시간)
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }