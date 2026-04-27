# Notify Queue QA Runbook (Beginner Friendly)

이 문서는 비전문가도 다음 검증 루프를 반복할 수 있게 만든 운영 절차서입니다.

1. 구조화 일정 생성
2. `remind_at` 도래 전제 확인
3. 큐 상태(`pending -> sent/failed`) 확인
4. 실패 시 재시도/에러 확인

## 0) 먼저 알아둘 점

- 현재 프로젝트의 런타임 OpenAPI에 notify queue 테이블이 없을 수 있습니다.
- 그래서 검증 스크립트는 먼저 "전제조건(스키마)"을 점검하고, 없으면 `BLOCKED`로 안전하게 중단합니다.
- 이 동작은 오검증(없는 큐를 있다고 가정) 방지를 위한 의도된 안전장치입니다.

## 1) 사전 준비

프로젝트 루트:

```bash
cd /Users/mingyulee/Downloads/Calendar_dev/calendar-web
```

필수 환경변수:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (e2e dry에서 토큰 발급 시 필요)

## 2) 1차 점검: 큐 스키마 전제 확인

```bash
pnpm run verify:notify:queue
```

- 이 명령어는 "지금 이 런타임에 queue/remind 검증이 가능한지"를 먼저 확인합니다.
- 정상일 때:
  - queue table 이름
  - status/created 컬럼
  - 최근 상태 집계(`pending`, `sent`, `failed`)
- 막힘(`BLOCKED`)일 때:
  - 큐 스키마가 노출되지 않았다는 뜻입니다.
  - 이 경우 먼저 Integration/Schema 담당이 queue 테이블(또는 동등 경로)을 노출해야 합니다.

## 3) 2차 점검: 구조화 일정 생성 + dry e2e

```bash
pnpm run verify:notify:e2e:dry
```

- 이 명령어는 아래를 한 번에 실행합니다.
1. 검증용 테스트 토큰 발급
2. `/api/events`로 구조화 일정 1건 생성
3. 가능하면 `family_events.data.remind_at`에 dry marker 저장
4. `verify:notify:queue`로 큐 상태 확인
5. 기본값으로 테스트 이벤트 삭제

실패 원인 빠른 분리:

- `/api/events` 생성 실패: 인증/입력 포맷/API 경로 문제
- `BLOCKED` (queue missing): 스키마/노출 미완료
- 큐 조회 실패(4xx/5xx): 권한키/REST 접근 정책 점검 필요

## 4) 장애 시 어디부터 볼지 (우선순위)

1. `pnpm run verify:notify:queue`
- 이 명령어는 "스키마 자체가 준비됐는지"를 가장 먼저 확인합니다.

2. `pnpm run verify:notify:e2e:dry`
- 이 명령어는 실제 API 호출과 큐 확인을 연결해 end-to-end 단절 구간을 찾습니다.

3. `pnpm run logs:api:fail`
- 이 명령어는 API 라우트 실패 로그를 요약해서 인증/검증 실패를 빠르게 찾습니다.

4. 필요 시 라인 상세:

```bash
LOG_QUERY_MODE=lines LOG_QUERY_ROUTE=/api/events pnpm run logs:api:lines
```

- 이 명령어는 `/api/events` 실패 원인을 상세 라인으로 확인하기 위한 것입니다.

## 5) 실패/재시도 확인 포인트

- `verify:notify:queue` 출력에서 확인:
  - `summary total=... pending=... sent=... failed=...`
  - `retry_column=...` / `error_column=...`
- `failed > 0`이면:
  - 최근 5건 샘플의 `error`와 `retry` 값 먼저 확인
  - 재시도 컬럼(`retry_count`/`attempt_count` 등)이 증가하는지 동일 루프 재실행으로 확인

## 6) 자주 쓰는 옵션

```bash
NOTIFY_E2E_KEEP_EVENT=1 pnpm run verify:notify:e2e:dry
```

- 이 명령어는 디버깅을 위해 테스트 이벤트를 남겨두고 싶을 때 사용합니다.

```bash
NOTIFY_E2E_QUEUE_ALLOW_MISSING=1 pnpm run verify:notify:e2e:dry
```

- 이 명령어는 queue 미구현 단계에서도 e2e dry 나머지 흐름을 계속 보고 싶을 때 사용합니다.

## 7) 자동화 범위 vs 수동 범위

자동화됨:

- 테스트 토큰 발급
- 구조화 일정 생성
- `remind_at` 마커 저장 시도
- 큐 스키마/상태 스냅샷
- 테스트 이벤트 정리(기본)

수동 필요:

- 실제 queue 스키마/잡 디스패처 배포 및 노출
- 실운영 스케줄러(크론/워커) 등록 확인
- 알림 수신 디바이스 실기기 확인(iOS/Android 브라우저 권한 포함)
