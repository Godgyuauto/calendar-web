# MODULE_README (modules/push)

## File map

- `use-push-subscription-controller.ts`: push 토글의 실제 동작(권한/구독/API 저장)을 담당하는 공용 훅.
- `push-subscription-utils.ts`: 공용 유틸(지원 여부, VAPID 변환, 구독 조회, 에러 파싱).
- `push-subscription-types.ts`: 공용 훅 입력/출력 타입.

## Why

- Home/Settings의 중복 구현을 제거해 유지보수 시 한 곳만 수정하도록 만들기 위해 분리.
