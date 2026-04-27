import type { PushPermissionState } from "@/modules/push/push-subscription-utils";

export interface UsePushSubscriptionControllerParams {
  initialSubscribed: boolean;
  enabled: boolean;
}

export interface PushSubscriptionController {
  checked: boolean;
  disabled: boolean;
  busy: boolean;
  permission: PushPermissionState;
  description: string;
  onChange: (next: boolean) => void;
}
