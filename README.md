# LastWar Frontend

Next.js 기반의 LastWar 게임 관리 웹 애플리케이션입니다.

## 🚀 실행 방법

### 로컬 개발 환경

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **로컬 개발 서버 실행**
   ```bash
   # 로컬 API 서버 연동 (권장)
   npm run dev:local
   
   # 또는 기본 개발 서버
   npm run dev
   ```

3. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

## 🔧 환경 설정

### 로컬 개발 (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```
- 로컬에서 실행되는 API 서버와 연동
- 자동으로 로드됨 (git에서 제외)

### 프로덕션 환경
기본값으로 `https://api.chunsik.site` 사용

## 🛠️ 기술 스택

- **Next.js**: 15.2.4 (React 프레임워크)
- **React**: 19 (UI 라이브러리)
- **TypeScript**: 5 (타입 안전성)
- **Tailwind CSS**: 3.4.17 (스타일링)
- **Radix UI**: 접근성 우수한 UI 컴포넌트
- **React Hook Form**: 폼 관리
- **Zod**: 스키마 검증
- **Recharts**: 차트 라이브러리
- **Framer Motion**: 애니메이션
- **Canvas Confetti**: 시각 효과

## 📁 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── dashboard/         # 대시보드 페이지
│   ├── users/            # 사용자 관리
│   ├── squads/           # 스쿼드 관리
│   ├── events/           # 이벤트 관리
│   ├── lottery/          # 추첨 시스템
│   ├── desert-results/   # 사막 결과
│   ├── post-events/      # 이벤트 후 처리
│   ├── surveys/          # 설문조사
│   ├── votes/            # 투표 시스템
│   └── settings/         # 설정
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── user/             # 사용자 관련 컴포넌트
│   ├── squad/            # 스쿼드 관련 컴포넌트
│   ├── lottery/          # 추첨 관련 컴포넌트
│   └── sidebar.tsx       # 네비게이션 사이드바
├── lib/                  # 유틸리티 라이브러리
│   ├── api-service.ts    # API 호출 서비스
│   └── utils.ts          # 공통 유틸리티
├── hooks/                # 커스텀 React 훅
├── types/                # TypeScript 타입 정의
└── public/               # 정적 파일
```

## 🎨 UI/UX 특징

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 지원
- Tailwind CSS의 반응형 유틸리티 활용

### 다크/라이트 테마
- `next-themes`를 통한 테마 전환
- 시스템 설정 자동 인식

### 접근성
- Radix UI 컴포넌트로 WAI-ARIA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환

### 사용자 경험
- 로딩 상태 표시
- 에러 처리 및 알림
- 부드러운 애니메이션 (Framer Motion)

## 📱 주요 기능

### 사용자 관리
- 사용자 목록 조회/필터링
- 사용자 정보 CRUD
- 사용자 이력 추적
- 등급 관리

### 스쿼드 관리
- 포지션별 상태 보드
- 팀 구성 관리
- 성과 추적

### 이벤트 시스템
- 사막 이벤트 관리
- 참가자 명단 관리
- 결과 입력 및 통계

### 추첨 시스템
- 애니메이션 추첨 효과
- 결과 표시
- 이력 관리

### 대시보드 및 통계
- 실시간 통계 대시보드
- 차트를 통한 데이터 시각화
- 성과 지표 모니터링

## 🔌 API 연동

### API 서비스 (`lib/api-service.ts`)
```typescript
// 환경별 API 베이스 URL 자동 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.chunsik.site"

// 타입 안전한 API 호출
fetchFromAPI<UserResponse>('/api/users')
```

### 에러 처리
- HTTP 상태 코드별 에러 처리
- 사용자 친화적 에러 메시지
- 네트워크 에러 대응

### 로딩 상태 관리
- 각 페이지별 `loading.tsx` 파일
- 스켈레톤 UI로 로딩 표시

## 🎯 개발 가이드

### 컴포넌트 개발
```bash
# 새 UI 컴포넌트 추가
npx shadcn-ui@latest add [component-name]
```

### 스타일링 규칙
- Tailwind CSS 클래스 우선 사용
- 커스텀 CSS는 최소화
- `clsx`와 `tailwind-merge`로 조건부 스타일링

### 타입 안전성
- 모든 API 응답에 대한 타입 정의
- Zod를 이용한 런타임 검증
- TypeScript strict 모드 활용

### 폼 관리
```typescript
// React Hook Form + Zod 조합
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
})
```

## 🧪 개발 도구

### 린팅 및 포맷팅
```bash
# ESLint 실행
npm run lint

# 자동 수정
npm run lint -- --fix
```

### 타입 체크
```bash
# TypeScript 컴파일 확인
npx tsc --noEmit
```

## 📦 배포

### Vercel (권장)
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 설정

### Docker
```bash
# Docker 이미지 빌드
docker build -t lastwar-frontend .

# 컨테이너 실행
docker run -p 3000:3000 lastwar-frontend
```

### 정적 빌드 (선택사항)
```bash
# 정적 사이트 생성
npm run build
npm run export
```

## 🔍 성능 최적화

### Next.js 기본 최적화
- 자동 코드 분할
- 이미지 최적화 (`next/image`)
- 폰트 최적화 (`next/font`)

### 커스텀 최적화
- 동적 임포트로 번들 크기 최적화
- React.memo로 불필요한 리렌더링 방지
- useMemo, useCallback 적절히 활용

## 🚨 문제 해결

### 일반적인 문제

1. **API 연결 오류**
   ```bash
   # 환경 변수 확인
   echo $NEXT_PUBLIC_API_BASE_URL
   
   # API 서버 상태 확인
   curl http://localhost:8080/actuator/health
   ```

2. **빌드 오류**
   ```bash
   # node_modules 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **포트 충돌**
   ```bash
   # 다른 포트로 실행
   npm run dev -- -p 3001
   ```

### 디버깅 도구
- React Developer Tools
- Next.js DevTools  
- 브라우저 개발자 도구

## 📞 지원

개발 중 문제 발생 시:
1. 브라우저 콘솔 확인
2. Next.js 개발 서버 로그 확인  
3. API 서버 연결 상태 확인
4. 환경 변수 설정 확인

## 🔄 환경별 실행 요약

| 환경 | API 서버 | 프론트 서버 | API URL |
|------|----------|-------------|---------|
| **로컬** | `java -jar build/libs/lastwar.jar --spring.profiles.active=local` | `npm run dev:local` | `http://localhost:8080` |
| **프로덕션** | `java -jar build/libs/lastwar.jar` | `npm run build && npm start` | `https://api.chunsik.site` |