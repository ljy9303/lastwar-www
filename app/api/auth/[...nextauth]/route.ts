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
        if (!credentials?.code) {
          return null
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/kakao/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: credentials.code,
              redirectUri: credentials.redirectUri
            })
          })

          const data = await response.json()
          console.log('백엔드 카카오 로그인 응답:', JSON.stringify(data, null, 2))

          // 새로운 OAuth 플로우: 백엔드에서 항상 'login' 상태만 반환
          if (response.ok && data.status === 'login') {
            console.log('NextAuth.js 사용자 객체 생성:', {
              id: data.user?.userId?.toString(),
              email: data.user?.email,
              name: data.user?.nickname,
              serverAllianceId: data.user?.serverAllianceId
            })
            
            return {
              id: data.user?.userId?.toString() || '0',
              email: data.user?.email || '',
              name: data.user?.nickname || '',
              image: data.user?.profileImageUrl || null,
              accessToken: data.accessToken || data.jwtToken || data.token || null,
              serverAllianceId: data.user?.serverAllianceId || null,
              role: data.user?.role || 'USER',
              registrationComplete: data.user?.registrationComplete || false,
              serverInfo: data.user?.serverInfo || null,
              allianceTag: data.user?.allianceTag || null,
              userId: data.user?.userId || 0,
              kakaoId: data.user?.kakaoId || ''
            }
          }

          return null
        } catch (error) {
          console.error('Kakao login error:', error)
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
        if (!credentials?.email) {
          return null
        }

        try {
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

          const data = await response.json()

          if (response.ok && data.status === 'login') {
            return {
              id: data.user.userId.toString(),
              email: data.user.email,
              name: data.user.nickname,
              image: data.user.profileImageUrl,
              accessToken: data.accessToken,
              serverAllianceId: data.user.serverAllianceId,
              role: data.user.role,
              registrationComplete: data.user.registrationComplete,
              serverInfo: data.user.serverInfo,
              allianceTag: data.user.allianceTag,
              userId: data.user.userId,
              kakaoId: data.user.kakaoId
            }
          }

          return null
        } catch (error) {
          console.error('Test login error:', error)
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
        console.log('JWT 콜백 - user 객체:', JSON.stringify(user, null, 2))
        token.accessToken = user.accessToken
        token.serverAllianceId = user.serverAllianceId
        token.role = user.role
        token.registrationComplete = user.registrationComplete
        token.serverInfo = user.serverInfo
        token.allianceTag = user.allianceTag
        token.userId = user.id
        token.kakaoId = user.kakaoId
        console.log('JWT 콜백 - 생성된 token:', JSON.stringify(token, null, 2))
      }
      return token
    },
    async session({ session, token }) {
      console.log('세션 콜백 - token 객체:', JSON.stringify(token, null, 2))
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
      console.log('세션 콜백 - 생성된 session:', JSON.stringify(session, null, 2))
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }