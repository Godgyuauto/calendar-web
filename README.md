# 우리 가족 공유 교대근무 캘린더 (초기 개발 시작점)

PRD(`../PRD.md`) 기준으로 Phase 1~5 착수 상태입니다.

## 현재 구현 범위

- Next.js 16 App Router + TypeScript + Tailwind 기반 초기 앱 구성
- 한국어 기본 메타데이터/PWA Manifest/Service Worker 등록
- 교대근무 엔진 유틸리티
  - 기준일(`seed_date`) + 패턴 배열 기반 무한 계산
  - `기본 패턴 + 오버라이드` 병합 결과 계산
- `/api/shifts/today` 샘플 API 라우트 추가
- `/api/shifts/month`, `/api/events`, `/api/overrides` API 라우트 추가
  - `events`: GET/POST/PATCH/DELETE
  - `overrides`: GET/POST/DELETE
  - family 식별자는 body를 신뢰하지 않고, `Authorization: Bearer` 검증 + `family_members` 조회로 서버에서 확정
  - `events/overrides` 데이터는 Supabase REST 저장소(`family_events`, `shift_overrides`)를 사용
- 웹 푸시 알림(Phase 5 시작)
  - `/api/push/subscriptions` 구독/해지 API
  - `public/sw.js`의 `push`/`notificationclick` 처리
  - 일정/오버라이드 변경 시 가족 구성원에게 브로드캐스트 푸시 시도
- Supabase 초기 스키마 + RLS 정책 초안 SQL 추가

## 빠른 실행

```bash
pnpm install
pnpm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 확인.

## 자동 중간점검 (Smoke)

```bash
pnpm run smoke
```

- 기본 대상: `http://localhost:3000`
- 대상 변경: `SMOKE_BASE_URL=https://your-host pnpm run smoke`
- 인증 API 포함 점검: `SMOKE_ACCESS_TOKEN=<jwt> pnpm run smoke`

## 배포 전 고정 체크 루프

```bash
pnpm run verify:release
pnpm run verify:release:auth
pnpm run verify:release:auth:cleanup
```

- 고정 순서: `verify:pwa -> test -> lint -> typecheck -> build -> smoke`
- 스크립트가 로컬 서버를 자동 시작/종료하므로 점검 순서가 사람마다 달라지지 않음
- `verify:release:auth`는 인증 API(`/api/events`, `/api/overrides`)까지 200 응답 검증
- `verify:release:auth:cleanup`는 검증 후 테스트 계정/데이터 정리까지 자동 수행
- `verify:pwa`는 Service Worker 캐시 버전 불일치와 업데이트 안전장치 제거를 차단

## 로그 기준

- API 로그 기준 문서: `scripts/LOG_STANDARD.md`
- 문서 안의 명령어 주석(“이 명령어는 이거입니다”)은 운영 기준으로 간주하고 유지
- 모든 라우트(family + shift)는 `modules/family/api/route-log-response.ts` 헬퍼만 사용. 핸들러에서 `console.*`로 직접 로그를 찍지 말 것
- 인증이 필요한 라우트는 `resolveFamilyAuthOrResponse(request)`로 통일된 auth-reject 응답을 사용 (`modules/family/api/route-auth.ts`)

## 테스트 데이터 정리 자동화

```bash
pnpm run cleanup:test-data         # dry-run (기본)
pnpm run cleanup:test-data:apply   # 실제 삭제
bash ./scripts/cleanup-test-prefix-auto.sh # test_ 계정 대상 dry-run
```

- 기본 타겟: `codex.verify.*@example.com`
- 안전장치: 실제 삭제는 `CLEANUP_APPLY=1` + `CLEANUP_CONFIRM=DELETE_TEST_DATA`가 모두 있어야 수행
- exact 타겟 지정: `CLEANUP_EMAIL_EXACT=codex.verify.release@example.com pnpm run cleanup:test-data`
- 운영 자동화 경로: `cleanup-test-prefix-auto.sh`는 `test_` prefix + 허용 suffix 검사 후에만 cleanup을 실행
- 스케줄러(cron/CI) 등록은 저장소 밖 운영 작업(수동)입니다.

## 백업/복구 자동화

```bash
pnpm run backup:data
pnpm run restore:data
pnpm run restore:data:apply
```

- `backup:data`: Supabase 핵심 테이블을 `backups/supabase_<timestamp>/`로 JSON 백업
- `restore:data`: 복구 예정 내역 dry-run
- `restore:data:apply`: 확인값 포함 시 merge-upsert 복구 실행
- 정책 상세: `supabase/README.md`의 "Backup / Restore Policy (Fact-based)" 참고

## 로그 조회 단축 명령

```bash
pnpm run logs:api
pnpm run logs:api:fail
pnpm run logs:api:lines
```

- 기본 로그 파일: `/tmp/calendar-release-check-server.log`
- 예시: `LOG_QUERY_ROUTE=/api/events pnpm run logs:api`

## Push 알림 설정

- `.env.local`에 아래 값을 설정해야 푸시 전송이 동작합니다.
  - `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`
  - `WEB_PUSH_VAPID_PUBLIC_KEY`
  - `WEB_PUSH_VAPID_PRIVATE_KEY`
  - `WEB_PUSH_VAPID_SUBJECT` (예: `mailto:you@example.com`)
- DB에는 `supabase/migrations/20260422093000_add_push_subscriptions.sql` 적용이 필요합니다.

## PWA 업데이트 안전장치

- `public/sw.js`는 정적 Service Worker 파일이라 TypeScript 모듈을 직접 import할 수 없습니다.
- 캐시 버전 기준값은 `modules/pwa/cache-version.ts`에 두고, `public/sw.js`의 `CACHE_VERSION`과 같은지 `pnpm run verify:pwa`가 검사합니다.
- UI shell, route, public asset, Service Worker 동작을 바꾸면 `family-shift-vN` 값을 함께 올립니다.
- `/sw.js`는 `next.config.ts`에서 `Cache-Control: no-store`로 내려 오래된 Service Worker 스크립트가 남지 않게 합니다.
- `app/sw-register.tsx`는 새 Service Worker 발견 시 `skipWaiting`을 요청하고 `controllerchange`에서 한 번 reload합니다.

## 주요 파일

- `app/page.tsx`: Home 페이지 엔트리(얇은 조립 파일)
- `app/api/*/route.ts`: API 엔트리(모듈 re-export)
- `modules/shift/domain/{types,constants,date-key,shift-resolver}.ts`: 교대 패턴 계산/오버라이드 병합 엔진(모듈 분리)
- `modules/shift/domain/shift-engine.ts`: shift domain public barrel export
- `modules/calendar/domain/calendar-grid.ts`: 월간 42칸 캘린더 그리드 생성 유틸
- `modules/family/domain/{types,constants,validators,store-state,events,overrides}.ts`: 임시 인메모리 CRUD 저장소(모듈 분리, 향후 Supabase 대체 예정)
- `modules/family/domain/family-store.ts`: family domain public barrel export
- `modules/home/*`: Home UI 컴포넌트/데이터 조합 모듈
- `modules/pwa/*`: PWA 캐시 버전 기준값과 Service Worker 업데이트 활성화 헬퍼
- `modules/shift/api/*`, `modules/family/api/*`: API 핸들러 모듈
- `**/README.md`, `**/MODULE_README.md`: 폴더별 역할/변경 경계/수정 이유 문서
- `backups/lib_compat_removal_20260428/`: removed `lib/` compat shim backup (`*.bak`, restore reference only)
- `public/sw.js`: 오프라인 기본 캐시 Service Worker
- `supabase/migrations/20260418215000_initial_schema.sql`: 스키마 + RLS 초안

## TODO 메모(코드 주석에도 반영)

- 오버라이드 `overrideShift=null` 정책 확정
- 루틴 레이어 분리 UX 적용 완료(하단 타임라인 방식)
- PWA 아이콘 192/512 실제 리소스 제작
- API Key 만료/스코프 정책과 해시 저장 강제 로직 확정
