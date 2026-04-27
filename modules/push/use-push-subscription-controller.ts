"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  base64UrlToUint8Array,
  isPushSupported,
  parseErrorMessage,
  PUBLIC_VAPID_KEY,
  readCurrentSubscription,
  type PushPermissionState,
} from "@/modules/push/push-subscription-utils";
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
    if (!PUBLIC_VAPID_KEY) {
      setMessage("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY 설정이 필요합니다.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      let nextPermission = Notification.permission;
      if (nextPermission === "default") {
        nextPermission = await Notification.requestPermission();
      }

      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setMessage("알림 권한이 허용되지 않았습니다.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            base64UrlToUint8Array(PUBLIC_VAPID_KEY) as unknown as BufferSource,
        }));

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "푸시 구독 저장에 실패했습니다."));
      }
      setChecked(true);
      setMessage("푸시 알림이 활성화되었습니다.");
    } catch (error) {
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
      const subscription = await readCurrentSubscription();
      if (!subscription) {
        setChecked(false);
        setMessage("이미 비활성화 상태입니다.");
        return;
      }
      const response = await fetch(
        `/api/push/subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "푸시 구독 해지에 실패했습니다."));
      }
      await subscription.unsubscribe();
      setChecked(false);
      setMessage("푸시 알림이 비활성화되었습니다.");
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
