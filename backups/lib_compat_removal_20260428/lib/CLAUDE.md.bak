# lib/ — 호환 re-export 레이어

이 폴더는 **이전 경로를 깨지 않기 위한 호환 레이어 전용**이다. 새 로직을 여기에 쓰지 않는다.

## 현재 파일

- `shift-engine.ts` — `export * from "@/modules/shift";`
- `calendar-grid.ts` — `export * from "@/modules/calendar";`
- `family-store.ts` — `export * from "@/modules/family";`

## 규칙

- 신규 코드는 `@/modules/*`를 직접 import. 예: `import { ... } from "@/modules/shift"`.
- 여기에 새 심볼/유틸을 추가하지 말 것. 추가가 필요하면 해당 도메인 `modules/<name>/`에 구현하고 배럴을 통해 노출.
- 이 폴더의 파일은 1줄(re-export)만 유지. 더 많은 코드가 생겼다면 잘못된 위치.
- 호환 레이어 제거는 외부 의존이 없음을 grep으로 확인한 뒤에만.
