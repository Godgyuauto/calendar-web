"use client";

import {
  base64UrlToUint8Array,
  parseErrorMessage,
  PUBLIC_VAPID_KEY,
  readCurrentSubscription,
} from "@/modules/push/push-subscription-utils";

export async function registerPushSubscription(): Promise<string> {
  if (!PUBLIC_VAPID_KEY) {
    throw new Error("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY 설정이 필요합니다.");
  }

  let nextPermission = Notification.permission;
  if (nextPermission === "default") {
    nextPermission = await Notification.requestPermission();
  }

  if (nextPermission !== "granted") {
    throw new Error("알림 권한이 허용되지 않았습니다.");
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

  return "푸시 알림이 활성화되었습니다.";
}

export async function unregisterPushSubscription(): Promise<{
  checked: boolean;
  message: string;
}> {
  const subscription = await readCurrentSubscription();
  if (!subscription) {
    return { checked: false, message: "이미 비활성화 상태입니다." };
  }

  const response = await fetch(
    `/api/push/subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "푸시 구독 해지에 실패했습니다."));
  }

  await subscription.unsubscribe();
  return { checked: false, message: "푸시 알림이 비활성화되었습니다." };
}
