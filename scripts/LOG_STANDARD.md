# LOG_STANDARD

## 목적

문제 발생 시 원인을 추적하기 위한 최소 공통 로그 기준.

## API 로그 포맷

- `kind`: `api-route`
- `outcome`: `success | failure`
- `route`, `method`, `requestId`
- `status`, `durationMs`
- `errorCode`, `message` (실패 시)
- `commandHint` (재현/검증에 바로 쓰는 명령어)
- `at` (ISO timestamp)

## 명령어 주석 (반드시 유지)

```bash
pnpm run smoke                # 이 명령어는 API/UI 기본 상태를 빠르게 확인합니다.
pnpm run verify:release       # 이 명령어는 배포 전 고정 루프(lint->typecheck->build->smoke) 전체 검증입니다.
pnpm run verify:release:auth  # 이 명령어는 인증 API까지 포함해 배포 전 전체 검증을 실행합니다.
pnpm run verify:release:auth:cleanup  # 이 명령어는 인증 검증 후 테스트 계정/데이터까지 자동 정리합니다.
pnpm run token:test-user      # 이 명령어는 검증용 테스트 사용자 토큰을 발급합니다.
pnpm run cleanup:test-data    # 이 명령어는 테스트 데이터 정리 대상을 dry-run으로 확인합니다(삭제 안 함).
pnpm run cleanup:test-data:apply  # 이 명령어는 확인값이 있을 때만 테스트 데이터를 실제 삭제합니다.
pnpm run backup:data          # 이 명령어는 Supabase 핵심 테이블 JSON 백업을 생성합니다.
pnpm run restore:data         # 이 명령어는 백업 복구를 dry-run으로 검토합니다.
pnpm run restore:data:apply   # 이 명령어는 확인값이 있을 때만 백업 데이터를 merge-upsert 복구합니다.
pnpm run logs:api             # 이 명령어는 API 로그를 요약해서 보여줍니다.
pnpm run logs:api:fail        # 이 명령어는 실패 API 로그만 빠르게 요약합니다.
pnpm run logs:api:lines       # 이 명령어는 최근 API 로그 라인을 상세 조회합니다.
pnpm run verify:notify:queue  # 이 명령어는 notify queue 스키마/상태(pending/sent/failed)를 먼저 점검합니다.
pnpm run verify:notify:e2e:dry  # 이 명령어는 구조화 일정 생성부터 queue 확인까지 dry-run E2E로 검증합니다.
```

## 운영 원칙

- 실패 응답(4xx/5xx)은 반드시 `errorCode`와 `message`를 남긴다.
- 모든 API 로그에 `commandHint`를 유지한다.
- 개인정보/비밀키 원문은 로그에 남기지 않는다.
