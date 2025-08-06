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
              'User-Agent': 'NextAuth-Frontend'
            },
            body: JSON.stringify({
              code: credentials.code,
              redirectUri: credentials.redirectUri
            })
          })
          
          if (!response.ok) {
            return null
          }
          
          const data = await response.json()

          if (data.status === 'login') {
            // 기존 회원: JWT 토큰과 함께 로그인 완료 
            return {
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
          } else if (data.status === 'signup_required') {
            // 신규 회원: 회원가입 필요 플래그와 함께 반환
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
          }
          
          return null
        } catch (error) {
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
              accessToken: data.accessToken, // 백엔드에서 발급한 JWT 토큰
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