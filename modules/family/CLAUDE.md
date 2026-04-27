# modules/family — 가족 이벤트 · 오버라이드 저장소

## Public API (`import { ... } from "@/modules/family"`)

함수:
- `listFamilyEvents({ familyId?, isRoutine? }?) → FamilyEvent[]`
- `createFamilyEvent(CreateFamilyEventInput) → FamilyEvent`
- `updateFamilyEvent(UpdateFamilyEventInput) → FamilyEvent`
- `removeFamilyEvent({ id, familyId? }) → boolean`
- `listShiftOverrides({ familyId?, year?, month? }?) → ShiftOverride[]`
- `createShiftOverride(CreateShiftOverrideInput) → ShiftOverride`
- `removeShiftOverride({ id, familyId? }) → boolean`

API 핸들러(얇은 Route entry가 재내보냄):
- `modules/family/api/events-route.ts` → `app/api/events/route.ts`
- `modules/family/api/overrides-route.ts` → `app/api/overrides/route.ts`
- API persistence path: `modules/family/api/family-*-supabase.ts` repositories (Supabase REST).

타입:
- `FamilyEvent`, `CreateFamilyEventInput`, `UpdateFamilyEventInput`, `CreateShiftOverrideInput`
- shift 관련 타입은 `@/modules/shift`에서 가져와 사용 (`ShiftOverride`, `ShiftCode`, `OverrideType`).

## 현재 저장 방식

- `globalThis.__familyStore` 인메모리 싱글톤. **개발용.** 프로세스 재시작 시 초기화.
- Supabase로 교체 시 Repository 패턴을 유지하고 함수 시그니처를 그대로 둘 것 (API 호출부는 변경 금지).
- 현재 상태: `/api/events|overrides`와 홈 UI 조립(`modules/home`) 모두 Supabase repository read 경로를 사용.

## 불변 데이터 규칙 (Source of Truth)

- `shift_overrides`가 근무 계산/홈/알림의 Source of Truth이다.
- `family_events`는 부가 일정(메모/기록/표시) 용도다.
- 근무 상태를 바꾸는 기능(예: 휴가/교육/교대/OFF)은 `/api/overrides` 경로를 사용한다.
- `events`만 저장하고 근무 계산 결과가 바뀌길 기대하면 안 된다.

## 내부 파일 구조(모듈화)

- `domain/types.ts`: family 타입 정의
- `domain/constants.ts`: 기본 family/user id 상수
- `domain/validators.ts`: date/time 검증
- `domain/store-state.ts`: 인메모리 상태 seed/생성
- `domain/events.ts`: 이벤트 CRUD
- `domain/overrides.ts`: 오버라이드 CRUD
- `domain/family-store.ts`: 외부 공개 barrel export

## 입력 검증

- `startTime`/`endTime`은 ISO datetime 파싱 성공 + `end > start`.
- `date`는 `YYYY-MM-DD`.
- 모든 트림/정규화는 `create*` 내부에서 처리.

## 보안 TODO

- 현재 API는 `Authorization: Bearer <access_token>`을 Supabase Auth(`/auth/v1/user`)로 검증하고, `family_members` 조회로 family scope를 확정한다.
- body의 `familyId`/`userId`/`createdBy`는 신뢰하지 않는다.
- TODO: auth cookie 표준(`@supabase/ssr` 도입 여부)을 확정해 token extraction 유틸 분기를 단순화.
