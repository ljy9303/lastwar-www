# LastWar 프론트엔드 로그인 시스템 분석 리포트

## 개요
LastWar 프론트엔드에는 두 가지 로그인 방식이 구현되어 있습니다:
1. **카카오톡 OAuth 로그인** (`/login`)
2. **테스트용 이메일 로그인** (`/test-login`)

## 1. /login 페이지 - 카카오톡 OAuth 로그인

### 구현 방식
- **파일**: `app/login/page.tsx`
- **Provider**: NextAuth의 `kakao` credentials provider
- **인증 플로우**: OAuth 2.0 Authorization Code Grant

### 주요 특징
1. **카카오 로그인 URL 조회**
   ```typescript
   const { loginUrl } = await authAPI.getKakaoLoginUrl(redirectUri)
   window.location.href = loginUrl
   ```

2. **중복 요청 방지**
   - localStorage에 `kakao_login_attempt` 키로 3초 간격 제한
   - 동일한 시간 내 중복 클릭 방지

3. **콜백 처리**
   - **콜백 URL**: `/auth/kakao/callback`
   - NextAuth를 통해 백엔드 `/auth/kakao/login` API 호출
   - 세션 생성 후 로그인 상태에 따른 라우팅

### API 통신 흐름
```
프론트엔드 → 백엔드 /auth/kakao/login-url → 카카오 OAuth URL
프론트엔드 → 카카오 로그인 페이지
카카오 → 프론트엔드 /auth/kakao/callback (code 포함)
프론트엔드 → NextAuth → 백엔드 /auth/kakao/login
백엔드 → NextAuth 세션 생성
```

## 2. /test-login 페이지 - 테스트용 이메일 로그인

### 구현 방식
- **파일**: `app/test-login/page.tsx`
- **Provider**: NextAuth의 `test` credentials provider
- **인증 플로우**: 직접 이메일 기반 인증

### 주요 특징
1. **기본 이메일 설정**
   ```typescript
   const [form, setForm] = useState<TestLoginForm>({
     email: 'os1414@hanmail.net'  // 기본값
   })
   ```

2. **간편한 테스트 인증**
   - 이메일과 자동 생성된 닉네임으로 로그인
   - 기존 계정의 서버연맹으로 즉시 접근 가능

3. **API 통신 흐름**
   ```typescript
   // 1. 백엔드 테스트 로그인 API 직접 호출
   const response = await fetch('/auth/test/login', {
     method: 'POST',
     body: JSON.stringify({ email, nickname })
   })
   
   // 2. NextAuth 세션 생성
   await signIn('test', { email, nickname, redirect: false })
   ```

## 3. "signup_required" 응답 조건과 처리 로직

### 발생 조건
NextAuth 설정에서 `signup_required` 상태는 다음 조건에서 발생합니다:

```typescript
// route.ts (NextAuth 설정)
if (data.status === 'signup_required') {
  return {
    id: data.user.userId.toString(),
    registrationComplete: false,  // 핵심 플래그
    requiresSignup: true         // 추가 플래그
  }
}
```

### 백엔드 응답 기준
- **새 카카오 사용자**: 처음 카카오 로그인 시
- **미완성 회원가입**: `registrationComplete: false`인 사용자
- **서버/연맹 정보 미입력**: `serverInfo`, `allianceTag` 누락

### 프론트엔드 처리 로직

#### 1. 카카오 콜백에서의 처리
```typescript
// app/auth/kakao/callback/page.tsx
const loginResponse = {
  status: session.user.requiresSignup || !session.user.registrationComplete 
    ? 'signup_required' 
    : 'login'
}

if (loginResponse.status === 'signup_required') {
  // sessionStorage에 임시 사용자 정보 저장
  sessionStorage.setItem('signup_user_data', JSON.stringify(tempUserData))
  router.push('/signup')
}
```

#### 2. auth-api.ts에서의 세션 확인
```typescript
// lib/auth-api.ts
async kakaoLogin(request: LoginRequest): Promise<LoginResponse> {
  const session = await getSession()
  
  if (session.user.requiresSignup || !session.user.registrationComplete) {
    return {
      status: 'signup_required',
      user: { ...session.user, registrationComplete: false },
      message: '회원가입이 필요합니다'
    }
  }
  
  return {
    status: 'login',
    user: { ...session.user, registrationComplete: true },
    message: '로그인 성공'
  }
}
```

## 4. 두 로그인 방식의 차이점

### 기능적 차이

| 구분 | 카카오 로그인 (/login) | 테스트 로그인 (/test-login) |
|------|----------------------|---------------------------|
| **목적** | 실제 운영용 OAuth 인증 | 개발/테스트용 간편 인증 |
| **인증 방식** | 카카오 OAuth 2.0 | 이메일 기반 직접 인증 |
| **signup_required** | ✅ 지원 (신규 사용자) | ❌ 지원 안함 (기존 사용자만) |
| **외부 의존성** | 카카오 OAuth 서버 필요 | 백엔드만 필요 |
| **보안** | OAuth 표준 준수 | 단순화된 인증 |
| **리다이렉션** | `/dashboard` | `/` (홈페이지) |

### 기술적 차이

#### 카카오 로그인 플로우
```
1. 카카오 OAuth URL 요청 → 백엔드
2. 카카오 로그인 페이지 → 외부 리다이렉트
3. 인가코드 콜백 → /auth/kakao/callback
4. NextAuth signIn('kakao') → 백엔드 API
5. 세션 확인 → signup_required 또는 login
6. 적절한 페이지로 라우팅
```

#### 테스트 로그인 플로우
```
1. 이메일 입력 → 프론트엔드 폼
2. 백엔드 /auth/test/login → 직접 API 호출
3. NextAuth signIn('test') → 세션 생성
4. 홈페이지로 즉시 이동
```

### NextAuth Provider 설정 차이

#### Kakao Provider
```typescript
CredentialsProvider({
  id: "kakao",
  credentials: {
    code: { label: "Code", type: "text" },
    redirectUri: { label: "Redirect URI", type: "text" }
  },
  async authorize(credentials) {
    // OAuth 인가코드로 백엔드 API 호출
    const response = await fetch('/auth/kakao/login', {
      body: JSON.stringify({
        code: credentials.code,
        redirectUri: credentials.redirectUri
      })
    })
    // signup_required 상태 처리 포함
  }
})
```

#### Test Provider
```typescript
CredentialsProvider({
  id: "test",
  credentials: {
    email: { label: "Email", type: "email" },
    nickname: { label: "Nickname", type: "text" }
  },
  async authorize(credentials) {
    // 이메일/닉네임으로 백엔드 API 호출
    const response = await fetch('/auth/test/login', {
      body: JSON.stringify({
        email: credentials.email,
        nickname: credentials.nickname
      })
    })
    // 기존 사용자만 처리, signup_required 없음
  }
})
```

## 5. 회원가입 처리 (/signup)

### 진입 경로
1. **카카오 로그인에서 signup_required** → sessionStorage 데이터 활용
2. **URL 파라미터** → 백업 방법 (userId, email, nickname)
3. **NextAuth 세션** → registrationComplete: false인 사용자

### 데이터 전달 방식
```typescript
// sessionStorage를 통한 안전한 데이터 전달
const tempUserData = {
  userId: loginResponse.user.userId,
  email: loginResponse.user.email,
  nickname: loginResponse.user.nickname,
  profileImageUrl: loginResponse.user.profileImageUrl,
  timestamp: Date.now()  // 만료 시간 확인용
}
sessionStorage.setItem('signup_user_data', JSON.stringify(tempUserData))
```

### 유효성 검증
- **서버 번호**: 1-9999 숫자
- **연맹 태그**: 3-4자리 영문/숫자
- **닉네임**: 2-20자 한글/영문/숫자

## 6. 보안 고려사항

### 카카오 로그인
- ✅ OAuth 2.0 표준 준수
- ✅ CSRF 방지 (state 파라미터)
- ✅ 중복 요청 방지
- ✅ HttpOnly 쿠키 사용 (NextAuth)

### 테스트 로그인
- ⚠️ 운영 환경에서는 비활성화 필요
- ⚠️ 이메일 기반 단순 인증
- ⚠️ 기존 사용자 계정 직접 접근 가능

## 7. 개선 권장사항

### 단기 개선
1. **테스트 로그인 환경 제한**
   ```typescript
   // 개발 환경에서만 활성화
   if (process.env.NODE_ENV !== 'development') {
     return <div>테스트 로그인은 개발 환경에서만 사용할 수 있습니다</div>
   }
   ```

2. **에러 처리 강화**
   - 네트워크 오류 시 재시도 로직
   - 사용자 친화적인 에러 메시지

3. **로딩 상태 개선**
   - 각 단계별 로딩 메시지
   - 프로그레스 바 추가

### 장기 개선
1. **다른 OAuth 제공자 추가**
   - 네이버, 구글 로그인 지원
   - 통합 OAuth 관리

2. **세션 관리 개선**
   - 자동 토큰 갱신
   - 세션 만료 알림

3. **보안 강화**
   - 2FA (Two-Factor Authentication)
   - 비정상적인 로그인 감지

## 8. 결론

LastWar의 로그인 시스템은 **이중 구조**로 설계되어 있습니다:

- **카카오 로그인**: 실제 사용자를 위한 완전한 OAuth 인증 시스템
- **테스트 로그인**: 개발자를 위한 간편한 디버깅 도구

`signup_required` 상태는 **카카오 로그인에서만** 발생하며, 신규 사용자의 서버/연맹 정보 입력을 위해 설계되었습니다. 두 시스템 모두 NextAuth를 통해 통합 관리되며, 적절한 보안 수준을 유지하고 있습니다.

---
*분석 일자: 2025-01-24*
*분석자: Claude Code*