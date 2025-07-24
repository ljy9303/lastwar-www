# 🎯 후원 버튼 설정 가이드

후원 버튼 기능을 실제 서비스에서 사용하기 위한 설정 방법을 안내합니다.

## 📋 목차
1. [환경변수 설정](#환경변수-설정)
2. [카카오페이 QR 코드 생성](#카카오페이-qr-코드-생성)
3. [QR 코드 이미지 추가](#qr-코드-이미지-추가)
4. [보안 고려사항](#보안-고려사항)

---

## 🔧 환경변수 설정

### 1. .env.local 파일 생성/수정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 추가하세요:

```bash
# Sponsor/Donation Settings
NEXT_PUBLIC_SPONSOR_BANK_NAME="카카오뱅크"
NEXT_PUBLIC_SPONSOR_ACCOUNT_NUMBER="3333-12-3456789"
NEXT_PUBLIC_SPONSOR_ACCOUNT_HOLDER="홍길동"
NEXT_PUBLIC_SPONSOR_KAKAOPAY_URL="https://qr.kakaopay.com/실제QR주소"
NEXT_PUBLIC_SPONSOR_QR_IMAGE="/images/kakaopay-qr.png"
```

### 2. 환경변수 설명

| 변수명 | 설명 | 필수여부 | 예시 |
|--------|------|----------|------|
| `NEXT_PUBLIC_SPONSOR_BANK_NAME` | 후원 계좌 은행명 | ✅ 필수 | `"카카오뱅크"` |
| `NEXT_PUBLIC_SPONSOR_ACCOUNT_NUMBER` | 후원 계좌번호 | ✅ 필수 | `"3333-12-3456789"` |
| `NEXT_PUBLIC_SPONSOR_ACCOUNT_HOLDER` | 예금주명 | ✅ 필수 | `"홍길동"` |
| `NEXT_PUBLIC_SPONSOR_KAKAOPAY_URL` | 카카오페이 QR URL | ✅ 필수 | `"https://qr.kakaopay.com/..."` |
| `NEXT_PUBLIC_SPONSOR_QR_IMAGE` | QR 이미지 경로 | ⭕ 선택 | `"/images/kakaopay-qr.png"` |

> **⚠️ 주의**: `NEXT_PUBLIC_` 접두사가 있는 환경변수는 클라이언트에 노출됩니다. 민감한 정보는 포함하지 마세요.

---

## 📱 카카오페이 QR 코드 생성

### 1. 카카오페이 앱에서 QR 생성

1. **카카오페이 앱** 실행
2. 하단 **"송금"** 탭 선택
3. **"받기"** 버튼 클릭
4. **"QR코드로 받기"** 선택
5. 원하는 금액 설정 (선택사항)
6. QR 코드 생성 완료

### 2. QR 코드 URL 추출

#### 방법 1: 공유하기 (권장)
1. 생성된 QR 화면에서 **"공유하기"** 버튼 클릭
2. **"링크 복사"** 선택
3. 복사된 URL을 `NEXT_PUBLIC_SPONSOR_KAKAOPAY_URL`에 설정

#### 방법 2: QR 스캔
1. 다른 기기에서 QR 코드 스캔
2. 이동된 URL을 복사하여 사용

### 3. 환경변수 업데이트

```bash
# 실제 카카오페이 QR URL로 교체
NEXT_PUBLIC_SPONSOR_KAKAOPAY_URL="https://qr.kakaopay.com/FTaBcD123xyz"
```

---

## 🖼️ QR 코드 이미지 추가

QR 코드를 이미지로 표시하려면 다음 단계를 따르세요:

### 1. QR 이미지 저장

1. 카카오페이 QR 생성 후 **스크린샷** 촬영
2. 또는 **"이미지로 저장"** 기능 사용
3. 이미지를 `public/images/` 폴더에 저장

### 2. 폴더 구조

```
public/
└── images/
    └── kakaopay-qr.png  ← QR 코드 이미지
```

### 3. 환경변수 설정

```bash
# QR 이미지 경로 설정
NEXT_PUBLIC_SPONSOR_QR_IMAGE="/images/kakaopay-qr.png"
```

### 4. 이미지 최적화 팁

- **파일 형식**: PNG 또는 JPG 권장
- **해상도**: 400x400px 이상 권장
- **파일 크기**: 100KB 이하 권장
- **배경**: 흰색 배경 권장

---

## 🔒 보안 고려사항

### 1. 환경변수 관리

```bash
# ✅ 좋은 예 - 공개 정보만 NEXT_PUBLIC_ 사용
NEXT_PUBLIC_SPONSOR_BANK_NAME="카카오뱅크"

# ❌ 나쁜 예 - 민감한 정보는 NEXT_PUBLIC_ 사용 금지
NEXT_PUBLIC_ADMIN_PASSWORD="secret123"  # 절대 금지!
```

### 2. .gitignore 확인

`.env.local` 파일이 Git에 커밋되지 않도록 확인:

```bash
# .gitignore에 포함되어야 할 내용
.env.local
.env.production.local
.env.development.local
.env.test.local
```

### 3. 프로덕션 환경 설정

배포 시 호스팅 플랫폼에서 환경변수를 직접 설정:

#### Vercel 예시:
```bash
vercel env add NEXT_PUBLIC_SPONSOR_BANK_NAME
```

#### Netlify 예시:
Site settings → Environment variables → Add variable

---

## 🧪 테스트 방법

### 1. 개발 환경 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 후원 버튼 클릭하여 테스트
```

### 2. 빌드 테스트

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npm start
```

### 3. 환경변수 확인

브라우저 개발자 도구에서 환경변수가 올바르게 로드되는지 확인:

```javascript
// 콘솔에서 확인
console.log(process.env.NEXT_PUBLIC_SPONSOR_BANK_NAME)
```

---

## 🔄 업데이트 방법

### 후원 정보 변경 시

1. `.env.local` 파일 수정
2. 개발 서버 재시작 (`npm run dev`)
3. 변경사항 확인 후 배포

### QR 코드 갱신 시

1. 새로운 QR 코드 생성
2. 이미지 교체 (`public/images/kakaopay-qr.png`)
3. URL 환경변수 업데이트
4. 캐시 클리어 후 배포

---

## 📞 문제 해결

### 자주 발생하는 문제

#### Q: QR 이미지가 표시되지 않아요
**A**: 다음을 확인해보세요:
- 이미지 파일이 `public/images/` 경로에 있는지
- 환경변수 `NEXT_PUBLIC_SPONSOR_QR_IMAGE` 설정 확인
- 이미지 파일명과 경로가 정확한지

#### Q: 카카오페이 링크가 작동하지 않아요
**A**: 다음을 확인해보세요:
- QR URL이 `https://qr.kakaopay.com/`로 시작하는지
- URL에 특수문자나 공백이 없는지
- 카카오페이 QR이 만료되지 않았는지

#### Q: 환경변수가 적용되지 않아요
**A**: 다음을 시도해보세요:
- 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경변수명에 오타가 없는지 확인

---

## 📚 추가 리소스

- [Next.js 환경변수 가이드](https://nextjs.org/docs/basic-features/environment-variables)
- [카카오페이 개발자 문서](https://developers.kakaopay.com/)
- [Vercel 환경변수 설정](https://vercel.com/docs/environment-variables)

---

💝 **설정이 완료되면 사용자들의 따뜻한 후원을 받을 수 있습니다!**