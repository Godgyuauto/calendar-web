# modules/push — 웹 푸시 공용 클라이언트 로직

## 책임

- 푸시 권한 확인, 브라우저 구독/해지, `/api/push/subscriptions` 저장/삭제 흐름의 단일 출처.

## Public API

- `use-push-subscription-controller.ts`
  - `usePushSubscriptionController({ initialSubscribed, enabled })`
  - 반환: `checked`, `disabled`, `busy`, `permission`, `description`, `onChange`
- `push-subscription-utils.ts`
  - 지원 환경 확인 / VAPID key decode / 현재 subscription 조회 / 에러 메시지 파싱

## 규칙

- 화면 모듈(`home`, `settings`)은 푸시 lifecycle 코드를 직접 구현하지 않고 이 모듈을 호출할 것.
- 실패 문구/권한 처리 정책은 이 모듈에서만 수정할 것.
