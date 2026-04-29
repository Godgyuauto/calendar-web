# Next.js messages route cache backup — 2026-04-30

## 목적

`app/messages/page.tsx`를 삭제한 뒤 `pnpm run verify:release:auth`의
typecheck 단계에서 `.next` 내부의 오래된 `/messages` route type cache가
삭제된 소스 파일을 계속 참조했다.

이 백업은 해당 stale generated cache를 지우기 전에 원본을 보존하기 위한 것이다.
애플리케이션 소스나 사용자 데이터 백업이 아니라, Next.js가 빌드/타입 생성 중 만든
재생성 가능한 산출물 백업이다.

## 백업 대상

- `types_app_messages/`
  - 원본: `.next/types/app/messages/`
  - 역할: App Router route type generation 결과물.
  - 백업 파일은 lint/typecheck 대상이 되지 않도록 `.bak` 확장자를 붙였다.
- `server_app_messages/`
  - 원본: `.next/server/app/messages/`
  - 역할: 삭제 전 `/messages` route의 서버 빌드 산출물.
  - 백업 파일은 lint/typecheck 대상이 되지 않도록 `.bak` 확장자를 붙였다.
- `static_chunks_app_messages/`
  - 원본: `.next/static/chunks/app/messages/`
  - 역할: 삭제 전 `/messages` route의 클라이언트 chunk 산출물.
  - 백업 파일은 lint/typecheck 대상이 되지 않도록 `.bak` 확장자를 붙였다.
- `dev_types/validator.ts`
  - 원본: `.next/dev/types/validator.ts`
  - 역할: 개발 타입 검증용 generated validator. 삭제된 `/messages` route import를
    포함해 typecheck 오류를 발생시켰다.
  - 백업 파일은 lint/typecheck 대상이 되지 않도록 `.bak` 확장자를 붙였다.

## 삭제 이유

`.next`는 Git 추적 대상이 아니며 Next.js가 다시 생성하는 캐시/빌드 산출물이다.
소스에서 `/messages` route를 제거했기 때문에, 기존 `.next`의 `/messages`
generated files는 현재 코드와 불일치한다. 이 stale cache를 제거해야 `next typegen`
및 `tsc --noEmit`이 현재 소스 기준으로 다시 검증된다.

## 복구 방법

필요하면 아래처럼 백업을 원래 위치로 복사할 수 있다. 다만 `/messages` route 소스가
없는 현재 코드에서는 복구 후 typecheck가 다시 실패할 수 있다.

```bash
mkdir -p .next/types/app/messages .next/server/app/messages .next/static/chunks/app/messages .next/dev/types
cp backups/next_messages_cache_20260430/types_app_messages/page.ts.bak .next/types/app/messages/page.ts
cp backups/next_messages_cache_20260430/server_app_messages/page.js.bak .next/server/app/messages/page.js
cp backups/next_messages_cache_20260430/server_app_messages/page.js.nft.json .next/server/app/messages/page.js.nft.json
cp backups/next_messages_cache_20260430/server_app_messages/page_client-reference-manifest.js .next/server/app/messages/page_client-reference-manifest.js
cp backups/next_messages_cache_20260430/static_chunks_app_messages/page-a69a31912169cd67.js.bak .next/static/chunks/app/messages/page-a69a31912169cd67.js
cp backups/next_messages_cache_20260430/dev_types/validator.ts.bak .next/dev/types/validator.ts
```
