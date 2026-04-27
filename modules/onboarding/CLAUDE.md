# modules/onboarding — 최초 설정 플로우

handoff의 3단계 온보딩 중 **1단계(근무 패턴 선택)** 만 구현. 2/3단계 디자인은
아직 없음(handoff에 미정의).

## 구조

- `OnboardingPage.tsx` — `"use client"`. 4개 패턴 옵션 중 택1, "다음" 누르면 `/`.
- `OnboardingRoutePage.tsx` — async server component. 세션이 없으면 `/`로
  리다이렉트하고, 세션이 있으면 `OnboardingPage`를 렌더.

## 알려진 TODO

- 2단계 / 3단계 디자인 확정 후 구현. 라우팅은 `/onboarding?step=2` 쿼리 파라미터
  또는 `app/onboarding/[step]/page.tsx`로 확장 예정(결정 전).
- 선택된 패턴을 Supabase `shift_patterns`에 저장. 현재는 상태 저장만.
- "직접 입력" 옵션은 별도 화면 필요(직접 cycle 편집 UI). 미정.

## agent-safe edit guide

- 옵션 id는 DB/Shift Engine의 `patternId`와 매핑될 예정이므로 임의로 변경하지
  말 것. 추가할 때는 `PATTERNS` 배열 끝에 append.
- "다음" 버튼 로직이 서버 호출로 바뀌면 `"use client"`는 유지하되 fetch는
  이 파일 내에서만 처리(기존 API 라우트 활용, 신규 API 추가는 승인 후).
