# modules/auth — 로그인 / 세션

이메일·비밀번호 로그인과 공개 계정 만들기를 지원. 계정 생성은
Supabase Auth에만 비밀번호를 전달하고, 서버에서 기존 이메일 여부를 먼저
확인한다. 가입 직후 가족에 속하지 않은 사용자는 온보딩에서 새 가족을
생성한다. 초대 코드 참여는 후속 루프에서 붙인다.

## 구조

- `LoginPage.tsx` — `"use client"`. 이메일/비번 폼 제출 시
  `POST /api/auth/login` 호출(credential only), 성공 시 `/`로 라우팅.
  `계정 만들기` 탭에서는 `POST /api/auth/signup` 호출, 세션이 즉시 발급되면
  `/onboarding`으로 라우팅.
- `LoginRoutePage.tsx` — async server component. 세션이 이미 있으면 `/`로
  리다이렉트하고, 없으면 `LoginPage`를 렌더.
- `api/login-route.ts` — 서버에서 Supabase
  `POST /auth/v1/token?grant_type=password`를 호출하고 `HttpOnly access_token`
  쿠키를 세팅. `refresh_token`이 있으면 함께 저장.
- `api/signup-route.ts` — 서버에서 service role로
  `GET /auth/v1/admin/users` 이메일 중복 확인 후 Supabase
  `POST /auth/v1/signup` 호출. 비밀번호는 앱 DB에 저장하지 않는다.
- `api/refresh-route.ts` — 서버에서 Supabase
  `POST /auth/v1/token?grant_type=refresh_token` 호출로 세션 갱신.
- `api/logout-route.ts` — 서버에서 `access_token`(및 레거시 토큰 쿠키)을 만료.
- `api/profile-route.ts` — 현재 가족 멤버의 Supabase Auth `display_name`을
  service role로 갱신하고 홈/멤버/설정 서버 캐시를 무효화.
- `api/auth-cookie.ts` — auth 쿠키 set/clear 옵션의 단일 출처.
- `SessionRefreshClient.tsx` — 클라이언트에서 주기/포커스 기반
  `POST /api/auth/refresh` 호출 + `focus/visibility/pageshow`에서 `router.refresh()`
  로 서버 컴포넌트 데이터(홈/캘린더 날짜·일정)를 재동기화.
- `server-session.ts` — 서버 라우트 가드 유틸.
  - `hasServerSession()`: 쿠키 access token 존재 + JWT exp 만료 여부 확인
  - `ensureAuthenticatedOrRedirect(path)`: 세션이 없으면 지정 경로로 리다이렉트

## 쿠키 합의

저장하는 쿠키 이름은 **반드시 `access_token`**. 서버는
`modules/home/access-token.ts`의 `ACCESS_TOKEN_COOKIE_NAMES` 목록과
`sb-*-auth-token` 패턴으로 토큰을 읽는다. 새 이름을 쓰지 말 것.

현재 기본 경로는 서버 `HttpOnly` 쿠키다. migration 호환을 위해 logout 시에는
기존 JS cookie variant도 함께 삭제한다.

## agent-safe edit guide

- Supabase endpoint/grant-type 경로를 바꾸지 말 것(`/auth/v1/token?grant_type=password`).
- 추가 인증 수단(social/OTP)은 **사용자 승인 후** 독립 파일로 붙일 것. 현재
  파일을 2배로 키우지 말 것(200줄 규칙).
- 로그인 성공 후 이동 경로(`/`)는 온보딩 완료 여부 판정 후 `/onboarding`
  갈림을 추가할 수 있음. 이때 동선 분기는 **사용자 승인 후** 추가.

## 알려진 TODO

- 온보딩 완료 플래그를 어디에 저장할지 결정(DB `family_members.onboarded_at`?)
- refresh-token `Max-Age`를 운영 정책에 맞춰 확정
  (`AUTH_REFRESH_TOKEN_MAX_AGE_SECONDS`)
