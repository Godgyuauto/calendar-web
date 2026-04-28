# AGENTS.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 절대 규칙 (Absolute Rules — 반드시 준수, 위반 금지)
이 규칙은 어떠한 경우에도 위반할 수 없습니다. 사용자 요청이 이 규칙과 충돌하면 정중하게 설명하고 거부하세요.

1. **바이브 코딩 원칙 엄수**: 사용자가 고수준의 설명, 느낌(vibe), 또는 요구사항만 제시하면 그에 정확히 맞춰 완전한 기능을 구현하되, **명시되지 않은 기능·최적화·추가 라이브러리·새로운 패턴은 절대 추가하지 마세요**.
2. **기존 코드 보호**: 이미 존재하는 파일·함수·로직·Shift Engine은 사용자 명시적 승인 없이 수정·삭제·리팩토링하지 마세요.
3. **간결성과 가독성 최우선**: 과도한 추상화, 복잡한 패턴, 불필요한 최적화는 금지. 코드가 초보자도 쉽게 이해할 수 있도록 유지하세요.
4. **보안·안정성**: API 키, 민감 정보는 절대 코드에 하드코딩하지 마세요. 모든 외부 호출은 에러 핸들링을 반드시 포함하세요.
5. **승인 없는 변경 금지**: 새로운 의존성(dependency) 추가, 폴더 구조 변경, 설정 파일 수정, Supabase 스키마 변경은 반드시 사용자에게 먼저 확인받으세요.
6. **Next.js 16 주의**: 이 프로젝트는 Next.js 16을 사용합니다. AGENTS.md를 반드시 참고하세요. 이전 버전 지식으로 코드를 작성하지 마세요.
7. **패키지 매니저**: 프로젝트는 **pnpm**을 사용합니다. 모든 설치·실행 명령어는 pnpm으로 작성하세요. npm이나 yarn을 사용하지 마세요.
8. **언어 규칙**: 코드 및 주석은 영어로 작성. 사용자 지시가 한국어인 경우 응답은 한국어로 하되, 코드 자체는 영어 유지.
9. **로그·디버깅**: 프로덕션 코드에 console.log, debugger 등은 절대 남기지 마세요.
10. **파괴적 명령 절대 금지 (Destructive Command Prohibition)**: 사용자가 해당 명령을 **그 문장으로 직접·명시적으로** 지시하지 않는 한, 다음 작업은 어떤 이유로도 실행 금지입니다. "정리한다", "청소한다", "깨끗하게 한다", "최적화한다" 같은 간접 지시로는 절대 실행하지 마세요.
    - 파일·폴더 삭제 계열: `rm`, `rm -rf`, `rmdir`, `find ... -delete`, `trash`, `unlink`, Node/Python의 `fs.rm*`/`os.remove`/`shutil.rmtree`, `Remove-Item`
    - Git 파괴 계열: `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git restore .`, `git branch -D`, `git push --force`, `git rebase` 도중 `--abort` 이외의 강제 작업
    - 패키지·설정 제거: `pnpm remove/uninstall`, `npm uninstall`, `.env*` 수정/삭제, `supabase db reset`, `supabase migration repair`
    - 테스트 데이터 실삭제: `CLEANUP_APPLY=1` 또는 `pnpm run cleanup:test-data:apply`
    - 데이터베이스 파괴: `DROP TABLE/SCHEMA/DATABASE`, `TRUNCATE`, 조건 없는 `DELETE`, `UPDATE`(특히 Supabase/프로덕션 대상)
    - 기타: `chmod -R`, `chown -R`, `mv`로 기존 폴더 덮어쓰기, 리다이렉션으로 파일 비우기(`> file`, `: > file`, `truncate`)

    예외 처리 규칙:
    (a) 위 명령이 필요하다고 판단되면 **실행하지 말고** 사용자에게 정확한 명령어·영향 범위·복구 가능 여부를 먼저 보고할 것.
    (b) 사용자가 승인하더라도 대상 경로·대상 테이블을 한 번 더 확인(`ls`, `git status`, `SELECT count(*)`)한 뒤 실행.
    (c) `mv`로 리팩토링 중 파일 위치를 옮기는 것은 허용되지만, 대상 경로가 비어있는지 먼저 확인하고 기존 파일을 덮어쓰지 말 것.
    (d) 실수로 실행했을 경우 즉시 작업을 멈추고 사용자에게 보고. 추가 명령으로 덮지 말 것.

위 규칙을 위반하는 요청이 들어오면 “절대 규칙 #N에 따라 해당 작업은 수행할 수 없습니다. 대안을 제안드릴까요?”라고 답변하세요.

## 아키텍처 (Architecture)

### 기술 스택 (Tech Stack)
- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL + RLS)
- Core Engine: Pure TypeScript (`modules/shift/domain/*`)
- PWA: Service Worker + manifest
- Package Manager: **pnpm**
- Deployment: [Vercel 또는 원하는 플랫폼]

### Shift Engine (`@/modules/shift`)
- 핵심 로직: 순수 TypeScript, 외부 의존성 없음, DB 호출 없음
- Public API는 `@/modules/shift`에서 import. Legacy lib compat shims were removed after all imports moved to `@/modules/*`.
- Layer 1: `getShiftForDate(date, pattern)` — modulo arithmetic (24-day cycle: A×6 → OFF×2 → B×6 → OFF×2 → C×6 → OFF×2)
- Seed date: 2026-04-21 (A-shift 시작일)
- Layer 2: `resolveDayShift(date, { overrides, pattern })`
- Layer 3: `getMonthShiftSummary({ year, month, overrides, pattern })`
- DST-safe: `Date.UTC` + `Intl.DateTimeFormat` (Asia/Seoul)
- 내부 파일 분리: `modules/shift/domain/{types,constants,date-key,shift-resolver,shift-engine}.ts` (각 파일 200줄 이내, `shift-engine.ts`는 barrel). 세부는 `modules/shift/CLAUDE.md` 참고.

### Supabase Schema
모든 테이블은 `family_id`로 scope됨 (가족 단위 멀티-테넌트)
- `families` → 최상위 가족 단위
- `family_members` → auth.users와 연결 (role: admin | editor)
- `shift_patterns` → 버전 관리되는 근무 패턴 (admin 전용)
- `family_events` → 가족 캘린더 이벤트 (부가 일정/메모)
- `shift_overrides` → 개인별 하루 override (7종: vacation, training, swap, extra, sick, business, custom) + 근무/알림 Source of Truth
- `agent_api_keys` → AI 에이전트용 키
RLS 정책: `public.is_family_member(target_family_id)` 함수 사용

### 폴더 구조 (현재 구조 기준 · 모듈화 완료)
calendar-web/
├── app/                            # Next.js App Router (얇은 entry 계층)
│   ├── layout.tsx
│   ├── page.tsx                    # 3줄 — `HomePage` import만
│   └── api/
│       ├── events/route.ts         # 1줄 — `@/modules/family/api/events` re-export
│       ├── overrides/route.ts      # 1줄 — `@/modules/family/api/overrides` re-export
│       └── shifts/{today,month}/route.ts  # 1줄 re-export
├── modules/                        # 도메인 모듈 (핵심 로직은 모두 여기)
│   ├── shift/                      # 교대근무 엔진 (순수 함수)
│   │   ├── domain/{types,constants,date-key,shift-resolver,shift-engine}.ts
│   │   └── api/{today,month}-route.ts
│   ├── family/                     # 가족 일정 / override 저장
│   │   ├── domain/{types,constants,validators,store-state,events,overrides,family-store}.ts
│   │   └── api/{_common,events,overrides,members,push,notifications,settings}/
│   ├── calendar/                   # 월간 달력 그리드 빌더 (순수 함수)
│   │   └── domain/
│   └── home/                       # 홈 화면 UI 조립
│       ├── HomePage.tsx (얇은 assembler)
│       ├── home-page-data.ts (서버 데이터 진입점)
│       ├── components/{HomeHero,HomeSidebar,MonthCalendarSection}.tsx
│       └── utils/date.ts (Asia/Seoul 헬퍼)
├── supabase/
│   └── migrations/                 # append-only 초기 스키마
├── public/
│   ├── sw.js
│   └── manifest (PWA)
├── .env.example
├── pnpm-lock.yaml
└── AGENTS.md, CLAUDE.md, README.md

### 모듈화 & 문서 탐색 규칙 (Agent Context Discipline)
에이전트가 전체 소스를 재탐색하며 토큰을 낭비하지 않도록, 각 폴더는 **자체 문서**를 가집니다.

1. **작업 전 진입 순서**:
   (a) 루트 `CLAUDE.md` / `AGENTS.md` (절대 규칙 + 전체 지도)
   → (b) 해당 폴더의 `CLAUDE.md` (있으면 Claude Code 자동 로드) 또는 `MODULE_README.md`/`README.md` (public API · 내부 파일 맵 · 수정 경계)
   → (c) 실제 수정 대상 파일만 `Read`.
2. **폴더별 문서 위치**:
   - `app/`, `app/api/` — entry 얇게 유지 원칙
   - `modules/` (루트) 및 `modules/{shift,family,calendar,home}/` — 도메인 public API · 불변 규칙 · TODO
   - `modules/{shift,family}/{api,domain}`, `modules/home/{components,utils}` — 파일 매핑 · 수정 경계
   - `supabase/`, `supabase/migrations/` — 스키마 · RLS · append-only 규칙
3. **200줄 규칙**: 단일 도메인 파일이 200줄을 넘어가면 types/constants/validators/state/로직으로 분리하고 기존 파일은 barrel export로 유지 (`family-store.ts`, `shift-engine.ts` 사례 참고).
4. **수정 경계**: 폴더 문서의 "agent safe edit guide" 항목을 벗어나는 수정은 사용자 승인을 받아야 합니다. 로직은 반드시 해당 `@/modules/*` 도메인 경계 안에서 수정합니다.

### API Route 고정 규칙 (반드시 준수)
새 라우트를 만들거나 기존 라우트를 수정할 때 아래 규칙은 **절대 어기지 마세요**. 위반 시 로그 추적 불가·디버깅 시간 증가로 이어집니다.

1. **로그·응답 헬퍼만 사용**: 모든 성공/실패/auth-reject 응답은 반드시 `modules/family/api/route-log-response.ts`의 `responseForSuccess` / `responseForFailure` / `responseForNoContent` / `responseForAuthFailure` / `logUnexpectedFailure`를 경유합니다. 라우트 파일 안에서 `console.log/info/warn/error`로 로그를 직접 찍거나, `NextResponse.json(...)`을 로그 없이 수동 조립하지 마세요.
2. **로그 시작점 고정**: 모든 라우트 핸들러 첫 줄은 `const logScope = startApiLog("/api/...", METHOD)` (from `modules/family/api/request-log.ts`). `commandHint` 기본값(`pnpm run verify:release`)을 지우지 마세요 — 장애 시 재현 명령이 로그에 바로 붙습니다.
3. **인증 라우트 단일 출처**: `Authorization: Bearer` 검증이 필요한 라우트는 반드시 `modules/family/api/route-auth.ts`의 `resolveFamilyAuthOrResponse(request)`를 호출해 `FamilyAuthContext | NextResponse`를 받습니다. `resolveFamilyAuthContext` + `getApiAuthFailure`를 라우트에서 직접 조합하지 마세요(중복 금지).
4. **shift/family 공용 확장 위치**: 위 헬퍼들은 `modules/family/api/` 아래에 있지만 shift 라우트도 공유합니다. 3번째 도메인 소비자가 생기면 공용 위치 재배치를 **사용자 승인 후** 검토합니다. 임의로 폴더를 만들거나 복제하지 마세요.
5. **라우트 파일 라인 상한**: `modules/family/api/*-route.ts` 200줄, `modules/shift/api/*-route.ts` 80줄. 넘어가면 로직을 repository/validator로 분리하고 라우트는 얇게 유지.
6. **검증 루프**: API를 추가/수정한 뒤에는 반드시 `pnpm run verify:release`로 `lint → typecheck → build → smoke`를 통과시킵니다. smoke는 읽기 전용이므로 mutation 엔드포인트는 별도로 수동 검증.

## 빌드/테스트 (Build & Test)
모든 명령어는 `calendar-web/` 폴더에서 **pnpm**으로 실행합니다:

```bash
pnpm install          # 의존성 설치
pnpm run dev          # 개발 서버
pnpm run build        # 프로덕션 빌드
pnpm run lint         # ESLint 검사
pnpm run typecheck    # 타입 생성 + 타입 검사 (순서 고정)
pnpm run smoke        # 자동 중간점검 (UI/API 상태코드 점검)
pnpm run verify:pwa   # PWA 캐시 버전/Service Worker 업데이트 안전장치 검증
pnpm run verify:release      # 배포 전 고정 체크 루프 (verify:pwa->test->lint->typecheck->build->smoke)
pnpm run verify:release:auth # 인증 API 포함 배포 전 고정 체크 루프
pnpm run verify:release:auth:cleanup # 인증 검증 + 테스트 계정/데이터 자동 정리
pnpm run token:test-user     # 검증용 테스트 사용자 토큰 발급
pnpm run cleanup:test-data        # 테스트 데이터 정리 dry-run
pnpm run cleanup:test-data:apply  # 테스트 데이터 실제 삭제(명시적 확인 포함)
pnpm run backup:data              # Supabase 핵심 테이블 JSON 백업
pnpm run restore:data             # 백업 복구 dry-run
pnpm run restore:data:apply       # 백업 복구 실제 반영(명시적 확인 포함)
pnpm run logs:api                 # API 로그 요약 조회
pnpm run logs:api:fail            # 실패 API 로그 요약 조회
pnpm run logs:api:lines           # API 로그 라인 상세 조회
```

테스트 러너: Vitest (`pnpm run test`)
Supabase 마이그레이션: 필요 시 supabase CLI 사용 (사용자 승인 후)

## 도메인 컨텍스트 (Domain Context)

프로젝트 목적: 가족 단위 근무 교대(Shift) 캘린더 관리 웹 앱
주요 비즈니스 용어:
Shift: A / B / C / OFF (24일 주기)
Override: 개인별 하루 예외 (휴가, 교육, 교대, 병가 등 7종류)
Family: 가족 단위 (가족 ID로 모든 데이터 격리)
Pattern: 가족별 근무 패턴 설정

데이터 흐름:
클라이언트 → Shift Engine (로컬 계산) 또는 Supabase
Shift Engine → UI (오늘의 Shift + 월간 그리드)
Override(`shift_overrides`) → 근무 최종 상태 저장(SoT) → 홈/캘린더/알림 계산에 공통 사용
Event(`family_events`) → 부가 일정 표시/기록 용도 (근무 계산 SoT 아님)

REST API (현재):
- `/api/shifts/today` (GET), `/api/shifts/month` (GET)
- `/api/events` (GET · POST · PATCH · DELETE) — Supabase repository 경유, `Authorization: Bearer <token>` 필수 (부가 일정)
- `/api/overrides` (GET · POST · PATCH · DELETE) — Supabase repository 경유, `Authorization: Bearer <token>` 필수 (근무/알림 SoT). `GET ?scope=mine`으로 본인 일정만 조회 가능. PATCH/DELETE는 owner만 허용.
- `/api/members` (GET · PATCH) — `Authorization: Bearer <token>` 필수. PATCH는 두 모드: ① 본인 `working` 토글 ② 가족마스터의 다른 멤버 `role` 변경(가족장 부여/회수). 역할 라벨은 `가족마스터/가족장/가족원` (DB role: `admin/editor` + `created_at` 기반 해석).
핸들러 실체는 `modules/{shift,family}/api/*-route.ts`. `app/api/**/route.ts`는 1줄 re-export만 유지.

홈 서버 데이터(`modules/home/home-page-data.ts`)는 Supabase repository read 경로로 통일됨. 서버 쿠키에서 access token이 확인되면 family scope 데이터(events/overrides)를 로드하고, 토큰이 없거나 인증 실패면 빈 데이터로 안전 fallback한다.

현재 단계: Phase 1–2 (Shift Engine + DB 스키마 완료, 가족 일정 CRUD 완성, 모듈화 및 폴더 문서화 완료, UI 프로토타입 단계)

## 코딩 컨벤션 (Coding Conventions)
네이밍 규칙

파일·컴포넌트: PascalCase
함수·변수: camelCase
타입·인터페이스: PascalCase
상수: UPPER_SNAKE_CASE

커밋 규칙
Conventional Commits 사용:

feat: 새로운 기능
fix: 버그 수정
refactor: 리팩토링
style:, docs:, chore: 등

패턴 규칙

Server Component 우선 사용
Shift Engine은 순수 함수로 유지 (부작용 없음)
모든 Supabase 쿼리는 RLS 정책 준수
PWA 관련 코드는 app/layout.tsx, app/sw-register.tsx, modules/pwa, public/sw.js 중심으로 관리
UI shell/public asset/Service Worker 변경 시 modules/pwa/cache-version.ts와 public/sw.js의 cache version을 함께 올리고 pnpm run verify:pwa를 통과시킬 것
주석은 영어로 작성 (필요 시 한국어 보조 설명)
