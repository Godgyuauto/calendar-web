# modules/calendar — 월간 캘린더 그리드

## Public API (`import { ... } from "@/modules/calendar"`)

- `buildMonthCalendarGrid({ year, month, shifts }) → CalendarCell[]`
  - 월의 시작 요일 오프셋을 계산해 총 42칸(7×6) 배열을 반환.
  - 전월 말일과 익월 초일을 포함해 요일 정렬이 맞도록 채움.
  - 각 셀에 해당 날짜의 `DayShiftSummary`(있으면)를 붙여 반환.
- 타입: `CalendarCell` — `{ dateKey, day, inCurrentMonth, shift? }` (실제 필드는 파일 참조).

## 규칙

- 이 모듈은 순수 함수만. DOM/React 코드 금지.
- shift 데이터는 `@/modules/shift`의 `DayShiftSummary[]`를 입력으로 받아 병합. 내부에서 shift 계산을 다시 하지 말 것.
- 월 경계는 `Date.UTC(year, month, 0)` 방식 사용(마지막 날 계산). DST와 무관.
