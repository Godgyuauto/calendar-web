# Legacy Tables Drop — 2026-04-28 Backup

이 폴더는 `daily_contexts`, `family_info`, `routines` 3개 테이블을 drop하기 직전의 데이터를 백업합니다.

## 사전 audit 결과 (Part6)

- `daily_contexts`: row 0 — drop 시 데이터 손실 없음
- `family_info`: row 1 — 본 폴더 `family_info.json` 백업
- `routines`: row 3 — 본 폴더 `routines.json` 백업
- FK 의존성: 0건 (양방향)
- 코드 사용처: 0건 (런타임). `family_info`는 이미 적용된 historical migration `20260420145000_align_family_schema_option1.sql`에서 legacy backfill 용도로만 참조.

## 데이터 성격

- `family_info`: 가족 구성원 메타(이름/생일/근무 패턴/자녀 정보) — 현재는 `families`/`family_members`/`shift_patterns`로 정규화됨
- `routines`: 사용자/날짜별 루틴(JSON) — 현재 앱에서 미사용

## 복구 방법 (필요 시)

1. drop migration 롤백 또는 새 테이블로 복구.
2. 본 JSON을 `INSERT INTO public.<table> ...`로 재삽입.
