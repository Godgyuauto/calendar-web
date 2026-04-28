# MODULE_README (modules/push)

## File map

- `use-push-subscription-controller.ts`: push 토글 상태/description/onChange를 조립하는 공용 훅.
- `push-subscription-actions.ts`: 권한 요청, 브라우저 구독/해지, `/api/push/subscriptions` 저장/삭제.
- `push-subscription-utils.ts`: 공용 유틸(지원 여부, VAPID 변환, 구독 조회, 에러 파싱).
- `push-subscription-types.ts`: 공용 훅 입력/출력 타입.

## Why

- Home/Settings의 중복 구현을 제거해 유지보수 시 한 곳만 수정하도록 만들기 위해 분리.
