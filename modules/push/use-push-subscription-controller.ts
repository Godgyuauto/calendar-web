"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isPushSupported,
  readCurrentSubscription,
  type PushPermissionState,
} from "@/modules/push/push-subscription-utils";
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/modules/push/push-subscription-actions";
import type {
  PushSubscriptionController,
  UsePushSubscriptionControllerParams,
} from "@/modules/push/push-subscription-types";
export type {
  PushSubscriptionController,
  UsePushSubscriptionControllerParams,
} from "@/modules/push/push-subscription-types";

export function usePushSubscriptionController({
  initialSubscribed,
  enabled,
}: UsePushSubscriptionControllerParams): PushSubscriptionController {
  const supported = useMemo(() => isPushSupported(), []);
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    supported ? Notification.permission : "unsupported",
  );
  const [checked, setChecked] = useState(initialSubscribed);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supported) {
      return;
    }
    const sync = async () => {
      setPermission(Notification.permission);
      const current = await readCurrentSubscription();
      if (current) {
        setChecked(true);
      }
    };
    void sync();
  }, [supported]);

  const enablePush = useCallback(async () => {
    if (!supported) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const resultMessage = await registerPushSubscription();
      setPermission(Notification.permission);

      setChecked(true);
      setMessage(resultMessage);
    } catch (error) {
      setPermission(Notification.permission);
      setMessage(error instanceof Error ? error.message : "푸시 활성화에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disablePush = useCallback(async () => {
    if (!supported) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await unregisterPushSubscription();
      setChecked(result.checked);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "푸시 비활성화에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const onChange = useCallback(
    (next: boolean) => {
      if (!enabled || busy) {
        return;
      }

      void (next ? enablePush() : disablePush());
    },
    [busy, disablePush, enablePush, enabled],
  );

  if (!enabled) {
    return {
      checked,
      busy,
      permission,
      disabled: true,
      description: "로그인 연결이 필요해 푸시 설정을 변경할 수 없습니다.",
      onChange,
    };
  }

  if (!supported) {
    return {
      checked: false,
      busy,
      permission: "unsupported",
      disabled: true,
      description: "이 브라우저는 웹 푸시를 지원하지 않습니다.",
      onChange,
    };
  }

  if (message) {
    return {
      checked,
      busy,
      permission,
      disabled: busy,
      description: message,
      onChange,
    };
  }

  if (permission === "denied" && !checked) {
    return {
      checked,
      busy,
      permission,
      disabled: busy,
      description: "브라우저에서 알림 권한이 차단되어 있습니다.",
      onChange,
    };
  }

  return {
    checked,
    busy,
    permission,
    disabled: busy,
    description: checked
      ? "일정/오버라이드 변경 시 푸시 알림을 받습니다."
      : "토글을 켜면 브라우저 권한을 요청하고 기기 구독을 등록합니다.",
    onChange,
  };
}
