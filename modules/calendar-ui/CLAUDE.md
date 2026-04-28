# modules/calendar-ui — 월간 캘린더 화면

`modules/calendar`(순수 그리드 빌더)와는 별개의 **UI 레이어**. 도메인 계산은
여기에 두지 않고 `@/modules/calendar` / `@/modules/shift`를 호출해 조립한다.

## 구조

- `CalendarMonthPage.tsx` — async server component. `year/month` 쿼리를 파싱해
  `getHomePageData(date)`로 해당 월 데이터를 얻고 `MonthGrid`에 전달.
  세션이 없으면 `ensureAuthenticatedOrRedirect("/")`로 루트 로그인 화면으로 보낸다.
- `MonthGrid.tsx` — server-rendered 6×7 그리드. 날짜/근무 칩을 그리고,
  override가 있는 날짜에는 구조화 요약 칩(제목/유형/근무조) 또는 작은 점(없으면)으로
  일정 존재를 렌더.
  day-tap을 `/calendar?year=...&month=...&add=YYYY-MM-DD` 링크로 전달.
- `CalendarPageClient.tsx` — `"use client"`. 세그먼트(월/주/일), 월 navigation
  chevrons, FAB, AddEventSheet 상태 소유. `add` 쿼리를 시트 기본 날짜와 동기화하고,
  day-tap이면 시트 기본 탭을 `등록된 일정`으로, FAB면 `일정 추가하기`로 연다.
- `AddEventSheet.tsx` — `"use client"`. BottomSheet 상태/저장/삭제 orchestration.
- `AddEventSheetHeader.tsx`, `AddEventSheetTabs.tsx` — 시트 상단 UI와 탭 전환 UI.
- `AddEventSheetEditor.tsx` — 탭(`일정 추가하기`)의 입력 editor.
  일정 유형 chip grid + 근무조 변경 row + 구조화 입력(start_at/end_at/remind_at/title/memo) + 저장.
  시간 입력 UI는 `HH:mm`로 받고, 저장 시 `YYYY-MM-DDTHH:mm`로 직렬화해 API payload로 보낸다.
  시트 진입 시 `GET /api/overrides?scope=mine`로 해당 날짜 기존 일정을 먼저 노출하고,
  등록은 `POST /api/overrides`, 수정은 `PATCH /api/overrides`, 삭제는 `DELETE /api/overrides?id=...`로 처리한다.
- `AddEventSheetSections.tsx` — 섹션 barrel export.
- `ExistingOverrideSection.tsx` — 등록된 일정 요약 + 수정/삭제 액션 UI.
- `StructuredFieldsSection.tsx` — 일정 추가/수정 입력 필드 UI.
- `add-event-sheet-utils.ts` — 시트 날짜 라벨/시간 범위 검증 유틸.
- `structured-override.ts` — compat barrel. 실제 구현은 `structured-override-{types,options,time,form,display}.ts`.
  구조화 필드를 `note` JSON(`schema=calendar_override_v1`)으로 직렬화/역직렬화한다.
- `structured-override-note.ts` — note datetime 정규화 유틸 + `modules/family/domain/structured-override-note.ts` 단일 파서 wrapper.
- `use-existing-override.ts` — `"use client"` hook. 시트가 열린 날짜의
  월별 override를 조회하고 선택 날짜의 **최신(createdAt)** 1건을 추출해
  `AddEventSheet`에 전달.

## 데이터 경로

월 그리드는 홈과 동일한 `modules/home/home-page-data.ts`를 재사용한다. 홈과
캘린더가 다른 데이터 셰이프를 요구하기 시작하면 `modules/calendar-ui`에
자체 data loader를 두자. 지금은 중복을 피하려고 공유.

`MonthGrid`와 `AddEventSheet`는 동일한 structured note 매핑 유틸을 공유한다.
그래서 월/홈 점 클릭 후 시트에서 보이는 상세가 같은 기준(event_type, shift_change,
all_day/start_at/end_at/remind_at, title, memo)으로 해석된다.

## 알려진 TODO

- **주/일 뷰**: placeholder. 주 뷰는 MiniWeekStrip 확장, 일 뷰는 시간축 타임라인 필요.
- **이벤트 chip 오버레이 고도화**: 현재는 override label 1건까지만 셀에 표시.
  family_events를 날짜별 그룹해 다건 칩(제목/유형)까지 노출하도록 확장 필요.

## agent-safe edit guide

- `MonthGrid`는 순수 프레젠테이션 — state/effect를 넣지 말고, 인터랙션이
  필요하면 `CalendarPageClient`로 올릴 것.
- 저장 엔드포인트(`/api/overrides`)는 그대로 유지. Shape 변경 필요하면
  `modules/family/api/overrides/`와 함께 수정하고 `pnpm run verify:release` 통과시킬 것.
