# modules/home — 홈 화면 조립 레이어

## 책임

- `app/page.tsx`의 실제 UI를 담당. 도메인 로직은 여기에 두지 말고 `@/modules/{shift,family,calendar}`를 호출해 조립만 한다.

## 구조

- `HomePage.tsx` (default export) — async server component. `getHomePageData()` 결과를 UI 블록에 넘김.
- `HomeDashboardPage.tsx` — async server component. 세션이 없으면 `/login`으로 리다이렉트하고, 세션이 있으면 홈 대시보드를 렌더.
- `home-page-data.ts` — 서버 측 데이터 수집 진입점. Supabase repository(`modules/family/api/family-*-supabase.ts`)를 읽고 shift/calendar를 조합.
- `access-token.ts` — 서버 쿠키에서 access token 추출(직접 토큰/JWT cookie/`sb-*-auth-token` 형태 지원).
- `components/` — UI 블록:
  - `HomeHero.tsx` — 상단 타이틀 + 패턴 정보
  - `HomeMiniMonthCalendar.tsx` — 홈 전용 미니 캘린더(날짜 + 일정 점 표시)
  - `HomeSidebar.tsx` — 오늘 근무 요약 + 루틴 정책 요약 + 다가오는 일정
  - `MonthCalendarSection.tsx` — 월간 7열 그리드
  - `RoutineTimelineSection.tsx` — 루틴 이벤트 하단 타임라인(메인 달력과 분리)
  - `index.ts` — 배럴 export
- `utils/date.ts` — `getSeoulYear`, `getSeoulMonth`, `toSeoulDateKey` (Asia/Seoul 키 생성 전용 유틸).

## 규칙

- 새로운 데이터는 `home-page-data.ts`에서 준비해서 props로 내려준다. 컴포넌트 내부에서 도메인 함수를 직접 호출하지 않는다.
- 날짜 키 변환은 반드시 `utils/date.ts`를 경유 (시간대 일관성).
- 클라이언트 상호작용이 필요해지면 해당 블록만 `"use client"`로 분리.
- 홈 화면의 family 데이터 read는 API와 동일하게 Supabase auth-context를 경유한다. 인메모리 `@/modules/family/domain/*` read 경로를 다시 추가하지 않는다.

## 현재 동작 (소스 통일 후)

- 루트(`/`) 진입 시 access token 쿠키가 없거나 만료면:
  - `HomeDashboardPage.tsx`에서 `/login`으로 즉시 리다이렉트
- access token 쿠키가 유효하면:
  - `resolveFamilyAuthContextFromToken()`으로 family scope를 확정
  - `family_events`/`shift_overrides`를 Supabase에서 직접 읽어 홈 UI를 구성
- access token이 있지만 인증/멤버십 검증이 실패하면:
  - 홈은 이벤트/오버라이드를 빈 상태로 렌더링
  - shift 기본 패턴 계산과 달력 렌더링은 계속 동작

이 설계는 홈 서버 렌더를 깨뜨리지 않으면서도 persistence source를 Supabase 단일 경로로 유지한다.
