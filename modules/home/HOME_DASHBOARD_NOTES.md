# Home Dashboard (iOS-style)

`HomeDashboardPage.tsx`는 handoff 와이어프레임 기준의 새 홈. 기존
`HomePage.tsx`(분석 대시보드)는 보존되어 있으며, 지금 `/` 라우트는
`HomeDashboardPage`를 렌더한다.

## 컴포넌트

- `HomeGreeting` — "안녕하세요, {이름}님" + 날짜
- `TodayShiftCard` — 파란 그라디언트 + shift code (시작/종료 시간 표시는 제거)
- `MiniWeekStrip` — 이번 주 7일 가로 strip (오늘 하이라이트 + 이벤트 dot)
- `UpcomingEventsList` — 다가오는 일정 카드 리스트

모두 `modules/home/components/`에 위치. 배럴 `components/index.ts`는 기존
파일만 export — 새 홈 컴포넌트는 HomeDashboardPage에서 직접 import한다(배럴이
레거시 홈과 새 홈 모두 써서 충돌을 피함).

## 데이터 경로

기존 `getHomePageData()` 재사용. shape는 바꾸지 않았다. 새 UI는
`data.todaySummary`, `data.monthRows`(주 strip 계산에 사용), `data.upcomingEvents`만
읽는다.

## TODO

- MiniWeekStrip의 event dot은 upcomingEvents만 참조 → 전체
  `family_events`의 해당 주 범위로 확장
