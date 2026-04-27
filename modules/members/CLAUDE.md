# modules/members — 멤버 탭

가족 구성원 목록 + 이번 주 근무 비교 + 초대 CTA.

## 구조

- `MembersPage.tsx` — 서버 컴포넌트. `members-page-data.ts`의 read 모델을 렌더.
  세션이 없으면 `ensureAuthenticatedOrRedirect("/")`로 루트 로그인 화면으로 보낸다.
- `members-page-data.ts` — family scope read 조립:
  - `family_members` 목록
  - 이번 주(일~토) `shift_overrides` + 기본 패턴 계산

## 핵심 규칙: 근무자 여부

`working: false` 멤버는:

- 오른쪽 배지를 "미근무"(회색)로 표시
- 주간 비교 행에서 "근무 일정 없음" 텍스트 하나로 축약
- 근무 칩(A/B/C/OFF)은 숨김

handoff README에서 명시한 요구사항이므로 이 로직을 건드리지 말 것.

## 현재 제약

1. 비본인 멤버의 표시 이름은 별도 profile 테이블이 없어서 user id 기반
   fallback(`멤버 {앞 6자리}`)을 사용한다.
2. 일부 런타임 환경에서 `family_members.working` 마이그레이션이 아직 적용되지
   않았을 수 있어, read 경로는 컬럼 미존재 시 `working=true` fallback을 사용한다.

## 알려진 TODO

1. profile 저장소가 생기면 비본인 display name fallback 제거.
2. 초대 플로우 구현(현재 dashed 카드 버튼은 빈 핸들러).

## agent-safe edit guide

- UI는 `MemberRow` shape에 의존한다. data source를 바꿀 때도 shape를 유지할 것.
- Shift 색상은 `SHIFT_PALETTE` (`@/modules/ui/tokens`)에서만 가져올 것 — 하드코딩 금지.
- route read가 필요하면 `/api/members`를 경유하되, 서버 렌더 read는
  `members-page-data.ts`를 단일 출처로 유지.
