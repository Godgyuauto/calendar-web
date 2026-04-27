"use client";

import {
  usePushSubscriptionController,
  type PushSubscriptionController,
  type UsePushSubscriptionControllerParams,
} from "@/modules/push/use-push-subscription-controller";

// Compatibility wrapper: settings module keeps its old import path while
// the actual push lifecycle implementation lives in modules/push.
export function usePushToggleController(
  params: UsePushSubscriptionControllerParams,
): PushSubscriptionController {
  return usePushSubscriptionController(params);
}
