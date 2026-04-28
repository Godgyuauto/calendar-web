# app/ — Next.js 엔트리 레이어

이 폴더의 파일은 **얇게 유지**. 로직을 여기에 새로 쓰지 않는다.

## 구조

- `layout.tsx` — PWA 메타데이터, `<html lang="ko-KR">`, SW 등록,
  세션 자동 갱신 클라이언트(`SessionRefreshClient`) 배치.
- `page.tsx` — `modules/home/HomeDashboardPage` (iOS 스타일 홈) 재export.
- `login/page.tsx` — `modules/auth/LoginRoutePage` 재export(세션 있으면 `/` 리다이렉트).
- `onboarding/page.tsx` — `modules/onboarding/OnboardingRoutePage` 재export(세션 없으면 `/` 리다이렉트).
- `calendar/page.tsx` — `modules/calendar-ui/CalendarMonthPage` 재export.
- `members/page.tsx` — `modules/members/MembersPage` 재export.
- `messages/page.tsx` — inline placeholder (디자인 미정, 세션 없으면 `/` 리다이렉트).
- `settings/page.tsx` — `modules/settings/SettingsPage` 재export.
- `manifest.ts` — PWA manifest. Manifest 값 수정만.
- `sw-register.tsx` — `/sw.js` 등록 클라이언트 컴포넌트. 업데이트 활성화 로직은 `modules/pwa/service-worker-update.ts` 사용.
- `globals.css` — 전역 스타일.
- `api/**/route.ts` — **thin re-export만.** 실제 핸들러는 `modules/<domain>/api/*-route.ts`에 있다.

## 탭 레이아웃 원칙

탭 바가 필요한 화면은 각 module의 Page 컴포넌트가 `<TabShell>`(modules/ui)
안에서 렌더링한다. 로그인/온보딩은 `<AuthShell>` 사용. `app/`에 layout
계층을 추가해서 route group(`(tabs)`, `(auth)`)을 만들지 **않는다** — 현재
프로젝트 규칙(얇은 entry + 모듈별 Page)을 유지하기 위해서다.

## 규칙

- `app/page.tsx` 또는 `app/api/**/route.ts`에 로직을 추가하지 말 것. 수정할 때는 대응되는 `modules/*` 파일을 고친다.
- Next.js 16이므로 App Router API는 `node_modules/next/dist/docs/`를 확인하고 사용 (루트 AGENTS.md 참고).
- Server Component가 기본. 클라이언트 훅/이벤트 필요할 때만 `"use client"`.
