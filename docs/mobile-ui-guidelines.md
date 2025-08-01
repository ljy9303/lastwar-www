# LastWar 모바일 UI/UX 최적화 가이드라인

## 📱 개요

LastWar 게임 관리 시스템의 모바일 환경 최적화를 위한 종합 가이드라인입니다.

## 🎯 설계 원칙

### 1. 모바일 우선 (Mobile First)
- 모든 컴포넌트는 모바일에서 먼저 디자인
- 점진적 향상 (Progressive Enhancement) 적용
- 터치 인터페이스 최우선 고려

### 2. 접근성 우선 (Accessibility First)
- WCAG 2.1 AA 기준 준수
- 스크린 리더 완전 지원
- 키보드 네비게이션 보장

### 3. 성능 최우선 (Performance First)
- Core Web Vitals 최적화
- 모바일 네트워크 환경 고려
- 배터리 효율성 중시

## 🔧 구현된 컴포넌트

### 터치 최적화 컴포넌트
- `TouchButton`: 44px 이상 터치 타겟 보장
- `FloatingActionButton`: 모바일 FAB 패턴
- `SwipeCard`: 제스처 기반 액션

### 레이아웃 시스템
- `ResponsiveContainer`: 디바이스별 최적 레이아웃
- `ResponsiveGrid`: 적응형 그리드 시스템
- `ResponsiveStack`: 유연한 스택 레이아웃

### 데이터 표시
- `MobileUserTable`: 모바일/데스크톱 적응형 테이블
- `OptimizedImage`: 성능 최적화 이미지
- `AvatarImage`: 사용자 프로필 이미지

### 접근성 향상
- `AccessibleFormField`: 완전 접근 가능한 폼
- `AccessibleTextarea`: 스크린 리더 최적화
- `AccessibleSelect`: 키보드 네비게이션 지원

## 📐 디자인 토큰

### 브레이크포인트
```typescript
MOBILE_BREAKPOINTS = {
  xs: 320,   // 초소형 모바일
  sm: 375,   // 표준 모바일
  md: 428,   // 대형 모바일
  lg: 768,   // 태블릿 세로
  xl: 1024,  // 태블릿 가로
  '2xl': 1280 // 데스크톱
}
```

### 터치 타겟 크기
```typescript
TOUCH_TARGETS = {
  minimum: 44,      // WCAG 최소 기준
  recommended: 48,  // 권장 크기
  comfortable: 56   // 편안한 터치
}
```

### 게임 UI 특화
```typescript
GAME_UI_GUIDELINES = {
  USER_GRADES: {
    minSize: 32,
    borderRadius: 8,
    gradientSupport: true
  },
  ACTION_BUTTONS: {
    minHeight: 44,
    minWidth: 88,
    rippleEffect: true
  }
}
```

## 🚀 성능 최적화 전략

### 1. 이미지 최적화
- WebP/AVIF 포맷 우선 사용
- 디바이스별 해상도 최적화
- Lazy loading 기본 적용
- 압축률 85% (품질/용량 균형)

### 2. 번들 최적화
- 코드 스플리팅으로 초기 로딩 최소화
- Tree shaking으로 불필요한 코드 제거
- 모바일용 폴리필 최소화

### 3. 렌더링 최적화
- GPU 가속 적극 활용
- will-change 속성 선택적 사용
- 리플로우/리페인트 최소화

## 🎨 시각적 계층 구조

### 모바일 정보 우선순위
1. **최우선**: 사용자명, 등급, 상태
2. **중요**: 레벨, 전투력, 액션 버튼
3. **부가**: 최근 업데이트, 부가 정보

### 색상 및 대비
- 최소 4.5:1 대비율 보장
- 고대비 모드 지원
- 색각 이상자 고려한 색상 선택

## 📱 디바이스별 최적화

### iPhone (iOS Safari)
```css
/* 줌인 방지 */
input { font-size: 16px !important; }

/* 동적 뷰포트 */
.container { height: 100dvh; }

/* 안전 영역 */
.safe-area { padding: env(safe-area-inset-top) }
```

### Android Chrome
```css
/* 하드웨어 가속 */
.gpu-layer { transform: translateZ(0); }

/* 터치 하이라이트 제거 */
* { -webkit-tap-highlight-color: transparent; }
```

## 🔄 인터랙션 패턴

### 제스처 지원
- **스와이프**: 카드 액션 (편집/삭제)
- **롱프레스**: 상세 정보 표시
- **더블탭**: 빠른 액션 실행
- **핀치줌**: 이미지/데이터 상세보기

### 피드백 시스템
- **시각적**: 버튼 press 상태, 리플 효과
- **촉각적**: 햅틱 피드백 (iOS)
- **청각적**: 선택적 사운드 피드백

## 🧪 테스트 전략

### 디바이스 테스트
- iPhone SE (최소 화면)
- iPhone 14 Pro (표준)
- Galaxy S23 (Android 대표)
- iPad Mini (태블릿)

### 네트워크 테스트
- 3G 저속 연결
- 4G LTE 표준
- WiFi 고속 연결
- 오프라인 상태

### 접근성 테스트
- VoiceOver (iOS)
- TalkBack (Android)  
- 키보드 전용 네비게이션
- 고대비 모드

## 📊 성능 지표 목표

### Core Web Vitals
- **LCP**: < 2.5초
- **FID**: < 100ms
- **CLS**: < 0.1

### 모바일 특화 지표
- **TTI**: < 3.8초
- **First Paint**: < 1.2초
- **Bundle Size**: < 250KB (gzipped)

## 🛠️ 개발 도구 및 설정

### VS Code 확장
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- axe Accessibility Linter

### 브라우저 개발도구
- Lighthouse (성능 및 접근성)
- Chrome DevTools Mobile Emulation
- Firefox Responsive Design Mode

## 📋 체크리스트

### 컴포넌트 개발 시
- [ ] 44px 이상 터치 타겟 확인
- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환성 테스트
- [ ] 모바일/데스크톱 반응형 확인
- [ ] 성능 프로파일링 실행

### 배포 전 확인
- [ ] 모든 브레이크포인트에서 레이아웃 검증
- [ ] 터치 인터랙션 정상 작동
- [ ] 이미지 최적화 적용 확인
- [ ] 접근성 표준 준수 검증
- [ ] Core Web Vitals 목표 달성

## 🔮 향후 개선 계획

### 단기 (1-2개월)
- PWA 기능 추가
- 오프라인 지원 강화
- 푸시 알림 시스템

### 중기 (3-6개월)
- 다크모드 완전 최적화
- 다국어 지원 (i18n)
- 고급 제스처 패턴

### 장기 (6개월+)
- AR/VR 인터페이스 고려
- 음성 인터페이스 지원
- AI 기반 개인화 UI

---

**마지막 업데이트**: 2025년 1월
**담당자**: LastWar UI/UX Team
**버전**: 1.0.0