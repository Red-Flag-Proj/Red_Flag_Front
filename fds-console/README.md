# FDS Console Frontend

이 폴더는 Red Flag FDS 관리자 콘솔의 프론트엔드 애플리케이션입니다. React, TypeScript, Vite 기반으로 구성되어 있으며 이상거래 모니터링, 관리자 조치, 정책 관리, 감사 로그, 리포트 다운로드 화면을 제공합니다.

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Recharts
- Tailwind CSS
- Lucide React

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

필요한 경우 프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_ADMIN_EMAIL=admin@fds.local
VITE_ADMIN_PASSWORD=Admin1234!
```

환경 변수를 지정하지 않으면 위 기본값이 사용됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

Vite 개발 서버가 실행되며 브라우저가 자동으로 열립니다.

## 사용 가능한 스크립트

```bash
npm run dev
```

개발 서버를 실행합니다.

```bash
npm run build
```

TypeScript 빌드 검사를 수행한 뒤 프로덕션 번들을 생성합니다.

```bash
npm run lint
```

ESLint로 코드 품질을 검사합니다.

```bash
npm run preview
```

생성된 프로덕션 빌드를 로컬에서 미리 봅니다.

## 주요 화면

| 경로 | 화면 | 설명 |
| --- | --- | --- |
| `/` | Dashboard | FDS 전체 지표, 위험 거래 현황, 차트 요약 |
| `/alerts` | Alert Queue | 이상거래 알림 목록 및 필터링 |
| `/alerts/:id` | Transaction Detail | 거래 상세, 위험 사유, 관리자 조치, ARS 확인 이력 |
| `/policy` | Policy Management | 정책 규칙 조회 및 활성화 상태 변경 |
| `/audit` | Audit Log | 관리자 조치 및 정책 변경 감사 로그 |
| `/reports` | Reports | 부정거래 리포트 다운로드 |

## 폴더 구조

```text
src/
  app/          라우터 및 앱 진입 구성
  components/   공통 UI, 레이아웃 컴포넌트
  data/         목업 데이터
  pages/        라우트별 페이지 컴포넌트
  services/     백엔드 API 연동 및 응답 매핑
  store/        Zustand 상태 관리
  types/        FDS 도메인 타입
  utils/        유틸리티 함수
```

## API 연동

API 호출은 `src/services/fdsService.ts`에서 관리합니다.

- 기본 API 주소: `http://localhost:4000/api`
- 인증 토큰은 로그인 성공 후 `localStorage`의 `fds_token`에 저장됩니다.
- 401 응답이 발생하면 관리자 계정으로 다시 로그인한 뒤 요청을 한 번 재시도합니다.

현재 프론트엔드가 사용하는 주요 API는 다음과 같습니다.

- `POST /auth/login`
- `GET /admin/stats`
- `GET /admin/suspicious-transactions`
- `GET /admin/transactions/:id`
- `POST /admin/transactions/:id/actions`
- `GET /admin/policy-rules`
- `POST /admin/policy-rules/:id/toggle`
- `GET /reports/fraud.csv`
- `GET /reports/fraud.pdf`

## 상태 관리

전역 상태는 `src/store/useFdsStore.ts`에서 Zustand로 관리합니다.

- 대시보드 통계
- 이상거래 목록
- 선택된 거래 상세
- 정책 규칙 목록
- 감사 로그
- 로딩 및 오류 상태

## 개발 참고

- 라우트 정의는 `src/app/router.tsx`에 있습니다.
- 백엔드 응답을 화면 타입으로 변환하는 로직은 `src/services/fdsService.ts`의 mapper 함수에서 처리합니다.
- 관리자 조치 메모 검증 로직은 `src/utils/memoValidation.ts`에 있습니다.
- 디자인 자산은 `src/assets`와 `public` 폴더에 있습니다.
