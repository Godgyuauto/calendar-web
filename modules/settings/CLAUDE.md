# modules/settings — 설정 탭

프로필, 가족 정보, 근무 설정, 알림, 로그아웃.

## 구조

- `SettingsPage.tsx` — 서버 컴포넌트. `settings-page-data.ts` read 결과를
  `SettingsPageClient.tsx`로 전달.
  세션이 없으면 `ensureAuthenticatedOrRedirect("/")`로 루트 로그인 화면으로 보낸다.
- `settings-page-data.ts` — family scope read 조립:
  - 현재 사용자 프로필(auth user)
  - 가족 이름(`families`)
  - 활성 교대 패턴(`shift_patterns`)
  - 본인 푸시 구독 존재 여부(`push_subscriptions`)
- `push-toggle-controller.ts` — `modules/push` 공용 훅 호환 래퍼.
  - settings import 경로를 유지하면서 공용 push lifecycle을 재사용
- `working-toggle-controller.ts` — 근무자 여부 토글 제어 로직.
  - `/api/members` PATCH로 본인 `family_members.working` 저장
- `SettingsPageClient.tsx` — client state/action 연결 + 섹션 조립.
- `SettingsPageSections.tsx` — 프로필/가족/근무/알림/로그아웃 섹션 UI.

## 현재 동작 범위

- **프로필/가족/기본값**: 실제 서버 read 표시.
- **근무자 여부 토글**: 활성화(실제 동작).
  - 토글 변경 시 `/api/members` PATCH로 본인 `working` 값을 저장.
  - 미근무(`working=false`)로 설정하면 멤버 화면 비교표에서 일정 계산이 제외됨.
  - runtime DB에 `family_members.working` 마이그레이션이 아직 적용되지 않았다면
    PATCH는 `migration is not applied yet` 오류를 반환한다.
- **푸시 알림 토글**: 활성화(실제 동작).
  - 토글 ON: 권한 요청 → SW 구독 확보 → 구독 POST 저장.
  - 토글 OFF: 구독 DELETE 요청 성공 확인 → 로컬 unsubscribe.
  - 로그인 토큰이 없거나 브라우저가 push를 지원하지 않으면 비활성화 + 사유 표시.
- **다크 모드 토글**: 비활성화.
  - 이유: 전역 theme preference 저장소 + CSS variable 토큰 전환이 아직 없음.
- **로그아웃**: `POST /api/auth/logout` 호출 → 서버가 HttpOnly `access_token`
  쿠키를 만료 → `/login`으로 이동.
  - 이유: `access_token`은 HttpOnly라서 `document.cookie`로 삭제 불가.
    서버 라우트(`modules/auth/api/logout-route.ts`)만 단일 출처.

## agent-safe edit guide

- 저장 가능한 설정이 생기면 토글을 API write로 연결하되, 저장 불가 토글은
  "enabled-looking fake state"를 만들지 말고 비활성 + 설명 텍스트를 유지할 것.
- 로그아웃 "트리거"는 여기(Settings)가 단일 진입점이고, 실제 쿠키 삭제는
  `POST /api/auth/logout`가 단일 출처. 다른 곳에서 `document.cookie`로
  access_token을 지우는 코드를 만들지 말 것(HttpOnly라 동작하지 않음).

## 알려진 TODO

- 다크 모드 실제 구현(tokens CSS 변수화 + preference 저장).
- 프로필 편집 화면, 교대 패턴 변경 화면.
