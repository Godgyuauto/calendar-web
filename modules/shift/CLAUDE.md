# modules/shift — 교대근무 엔진

## Public API (`import { ... } from "@/modules/shift"`)

함수:
- `getShiftForDate(date, pattern?, { timeZone? }?) → ShiftCode` — Layer 1: 순수 modulo 계산.
- `resolveDayShift(date, { overrides?, pattern?, timeZone? }?) → DayShiftSummary` — Layer 2: 오버라이드 병합.
- `getMonthShiftSummary({ year, month, overrides?, pattern?, timeZone? }) → DayShiftSummary[]`
- `getTodayShiftSummary({ overrides?, pattern?, timeZone? }?) → DayShiftSummary`

상수:
- `DEFAULT_SHIFT_PATTERN_V1` (seedDate=2026-04-21, 24일 cycle: A×6→OFF×2→B×6→OFF×2→C×6→OFF×2)
- `SHIFT_LABELS_KO`, `SHIFT_COLORS` (Record<ShiftCode, string>)

타입:
- `ShiftCode = "A" | "B" | "C" | "OFF"`
- `OverrideType = vacation | training | swap | extra | sick | business | custom`
- `ShiftOverride`, `DayShiftSummary`, `ShiftPatternConfig`

## 내부 파일 구조(모듈화)

- `domain/types.ts`: shift 타입 정의
- `domain/constants.ts`: 패턴/라벨/색상 상수
- `domain/date-key.ts`: 날짜 key parse/format/normalize
- `domain/shift-resolver.ts`: base+override 계산 로직
- `domain/shift-engine.ts`: 외부 공개 barrel export

## 불변 규칙

- **이 모듈은 순수 함수만.** DB/네트워크/브라우저 API 호출 금지. (인메모리 저장은 `modules/family`, UI 조립은 `modules/home` 담당.)
- 날짜는 `Date.UTC` 파싱 + `Intl.DateTimeFormat("en-CA", { timeZone })`로 키 생성. DST 안전성 유지.
- 음수 modulo 방어: `((x % n) + n) % n`.
- 기본 timeZone은 `Asia/Seoul`. 다른 시간대를 받으려면 함수 옵션으로만.

## 알려진 TODO

- `resolveDayShift`: `overrideShift === null`일 때 `baseShift`로 fallback 중. 정책 결정 후 바꿀 것(코드 내 TODO 주석 참고).
- 같은 날 오버라이드가 여럿일 때 현재는 createdAt 최신 1개만 선택. DB 유니크 제약과 UI 규칙을 먼저 고정할 것.
