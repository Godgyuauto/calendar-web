# supabase/ — 스키마 · RLS · 마이그레이션

## 구조

- `migrations/20260418215000_initial_schema.sql` — 초기 스키마 + RLS. 모든 테이블은 `family_id` 스코프.

## 테이블 개요

- `families` — 최상위 테넌트
- `family_members` — `auth.users` ↔ `family_id`, role `'admin' | 'editor'`, `working boolean`
- `shift_patterns` — 버전화된 패턴 (admin 쓰기)
- `family_events` — 가족 이벤트 (가족 read/write)
- `shift_overrides` — 사용자별/일자별 오버라이드 (owner write, family read)
- `agent_api_keys` — 해시 저장 API 키 (admin only)

## 불변 규칙

- **모든 RLS 정책은 `public.is_family_member(target_family_id)` 헬퍼로 게이팅.** 신규 테이블 추가 시 동일 패턴 유지.
- `family_id`가 없는 데이터 테이블 금지. 전역 참조 테이블(예: 공용 `shift_patterns`)은 예외지만 별도 정책 필요.
- 마이그레이션은 추가만. 기존 파일 수정 금지 — 새 타임스탬프로 신규 파일 생성.

## 알려진 TODO

- 가족 생성/초대 플로우 및 `auth.users` 가입 시 자동 `family_members` 연결 트리거 설계 필요.
- `agent_api_keys` 발급 시 서버 측 해시 저장 강제(Edge Function 또는 트리거) 확정 필요.
