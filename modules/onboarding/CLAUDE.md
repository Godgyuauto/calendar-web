# modules/onboarding — 최초 설정 플로우

계정 생성 직후 사용자가 가족 캘린더에 연결되는 최초 설정 플로우.
현재는 **새 가족 만들기**와 **초대 코드로 참여하기**만 제공한다.

## 구조

- `OnboardingPage.tsx` — `"use client"`. 새 가족 생성 또는 초대 코드 참여 후 `/`로 이동.
- `OnboardingRoutePage.tsx` — async server component. 세션이 없으면 `/`로
  리다이렉트하고, 세션이 있으면 `OnboardingPage`를 렌더.
- `api/create-family-route.ts` — 가족/관리자 멤버십/기본 근무 패턴 생성.
- `api/invite-create-route.ts` — 가족 관리자만 7일짜리 서명 초대 코드 생성.
- `api/invite-join-route.ts` — 초대 코드 검증 후 현재 사용자를 가족원으로 추가.
- `invite-code.ts` — DB 테이블 없이 HMAC 서명 코드 생성/검증. 코드는 service role
  key 회전 시 기존 코드가 무효화된다.

## 알려진 TODO

- 가족 관리자가 멤버를 승인/제거하는 관리 UI는 별도 단계.
- 초대 코드 DB 저장/폐기/1회 사용 정책은 필요해질 때 migration으로 추가.

## agent-safe edit guide

- 초대 코드는 클라이언트에서 만들지 말 것. `/api/invites` 서버 라우트만 사용한다.
- 초대 코드 참여는 이미 가족에 연결된 사용자에게 409를 반환해야 한다.
