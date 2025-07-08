# 카카오 OAuth 로그인 및 회원가입 시스템 PRD

## 1. 프로젝트 개요

### 목적
기존 시스템에 카카오 OAuth 기반 로그인 및 회원가입 시스템을 도입하여 사용자 인증을 간소화하고 보안을 강화합니다.

### 핵심 가치
- 이메일 중복 방지를 위한 카카오톡 OAuth 단일 로그인
- 사용자 친화적인 회원가입 플로우
- 서버/연맹 정보 기반 사용자 관리
- 마스터 권한 시스템 구축

## 2. 기능 요구사항

### 2.1 로그인 시스템
**기본 플로우:**
1. 로그인 페이지에서 카카오톡 로그인 버튼만 제공
2. 카카오 OAuth를 통해 이메일 정보 필수 수집
3. 데이터베이스 조회하여 기존 회원 여부 확인
4. 기존 회원: 즉시 로그인 처리
5. 신규 사용자: 회원가입 페이지로 이동

**세션 관리:**
- 로그인 성공 시 세션 생성 및 유지
- 세션 만료 시 자동 로그인 페이지 리다이렉트

### 2.2 회원가입 시스템
**필수 입력 정보:**
- 서버 정보: 숫자만 입력 가능
- 연맹 태그: 문자열 4자리 고정
- 닉네임: 띄어쓰기/특수문자 불가

**검증 규칙:**
- 서버 정보: 숫자만 허용, 1-9999 범위
- 연맹 태그: 영문/숫자 조합 4자리 정확히
- 닉네임: 영문/숫자/한글만 허용, 2-20자

**재가입 처리:**
- 회원가입 중단 후 재로그인 시 회원가입 페이지 재진입
- 불완전한 정보 보유 시 회원가입 페이지로 이동

### 2.3 권한 관리 시스템
**역할 구분:**
- MASTER: 전체 관리 권한
- USER: 일반 사용자 권한

**마스터 권한 확인:**
- 카카오 로그인 이메일 기반 마스터 권한 부여
- 특정 서버/연맹 조합에 대한 마스터 권한 부여

## 3. 기술 사양

### 3.1 환경 설정
**로컬 환경:**
- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:8080

**운영 환경:**
- 프론트엔드: https://rokk.chunsik.site
- 백엔드: https://api.chunsik.site

### 3.2 카카오 OAuth 설정
**인증 정보:**
- REST API 키: fdca9c078cee7dd1ba2b731acc952362
- Client Secret: 1VucGS2KA3uFGf2AxJqeI80ZzDrSTKB9

**리다이렉트 URI:**
- 로컬: http://localhost:3000/auth/kakao/callback
- 운영: https://rokk.chunsik.site/auth/kakao/callback

**사이트 도메인:**
- 로컬: http://localhost:3000
- 운영: https://rokk.chunsik.site

### 3.3 데이터베이스 스키마
**사용자 테이블 (users):**
```sql
CREATE TABLE users (
    user_seq SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    kakao_id VARCHAR(255),
    nickname VARCHAR(50),
    server_info INTEGER,
    alliance_tag VARCHAR(4),
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**세션 테이블 (user_sessions):**
```sql
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_seq INTEGER REFERENCES users(user_seq),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

## 4. 사용자 플로우

### 4.1 로그인 플로우
```
페이지 접속 → 세션 확인 → [세션 유효] → 메인 페이지
                     ↓ [세션 무효]
              로그인 페이지 → 카카오 로그인 버튼 → 카카오 OAuth 인증
                                                        ↓
              [기존 회원] ← 사용자 정보 확인 → [신규/불완전] → 회원가입 페이지
                     ↓                                        ↓
              세션 생성 → 메인 페이지                  정보 입력 → 가입 완료 → 메인 페이지
```

### 4.2 회원가입 플로우
```
회원가입 페이지 → 서버 정보 입력 (숫자) → 검증
                     ↓
              연맹 태그 입력 (4자리) → 검증
                     ↓
              닉네임 입력 (검증) → 폼 제출 → 사용자 정보 저장 → 로그인 완료
```

## 5. API 명세

### 5.1 인증 관련 API
```
POST /auth/kakao/login
- 카카오 Authorization Code를 받아 토큰 교환 및 사용자 정보 조회

GET /auth/session/check
- 현재 세션 유효성 확인

POST /auth/logout
- 세션 무효화 및 로그아웃 처리

POST /auth/signup
- 회원가입 정보 저장 및 세션 생성
```

### 5.2 사용자 관리 API
```
GET /api/user/profile
- 현재 로그인한 사용자 정보 조회

PUT /api/user/profile
- 사용자 정보 수정 (서버, 연맹, 닉네임)

GET /api/user/role
- 사용자 권한 정보 조회
```

## 6. 보안 고려사항

### 6.1 인증 보안
- HTTPS 통신 강제 (운영 환경)
- 세션 토큰 암호화 저장
- CSRF 토큰 적용
- Rate Limiting 적용

### 6.2 데이터 보안
- 개인정보 암호화 저장
- SQL Injection 방지
- XSS 공격 방지
- 민감정보 로깅 제외

## 7. 테스트 계획

### 7.1 기능 테스트
- 카카오 로그인 플로우 테스트
- 회원가입 플로우 테스트
- 세션 관리 테스트
- 권한 시스템 테스트

### 7.2 테스트 페이지
- 인증 상태 확인 페이지
- 권한 테스트 페이지
- 세션 정보 확인 페이지

## 8. 구현 순서

### Phase 1: 백엔드 기반 구조
1. 데이터베이스 스키마 생성
2. 사용자 엔티티 및 Repository 구현
3. 카카오 OAuth 서비스 구현
4. 인증 관련 API 개발

### Phase 2: 프론트엔드 인증 시스템
1. 로그인 페이지 개발
2. 회원가입 페이지 개발
3. 세션 관리 로직 구현
4. 라우팅 가드 구현

### Phase 3: 통합 및 테스트
1. 전체 플로우 테스트
2. 권한 시스템 검증
3. 보안 점검
4. 성능 최적화

## 9. 운영 고려사항

### 9.1 모니터링
- 로그인 성공/실패 율 모니터링
- 회원가입 전환율 추적
- 세션 만료 패턴 분석

### 9.2 유지보수
- 카카오 API 정책 변경 대응
- 사용자 피드백 수집 및 개선
- 보안 업데이트 정기 적용

## 10. 성공 지표

### 10.1 정량적 지표
- 로그인 성공률 > 95%
- 회원가입 완료율 > 80%
- 세션 유지 시간 > 24시간

### 10.2 정성적 지표
- 사용자 만족도 조사
- 고객 지원 문의 감소
- 보안 인시던트 제로