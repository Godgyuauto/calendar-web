"use client";

import { usePushSubscriptionController } from "@/modules/push/use-push-subscription-controller";

export function PushNotificationCard() {
  const push = usePushSubscriptionController({
    initialSubscribed: false,
    enabled: true,
  });

  const permissionLabel = push.permission === "unsupported" ? "지원 안 됨" : push.permission;

  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-md shadow-slate-300/30">
      <p className="text-sm text-slate-500">푸시 알림</p>
      <p className="mt-2 text-sm text-slate-700">
        일정/오버라이드 변경 시 기기 알림을 받을 수 있습니다.
      </p>
      <p className="mt-2 text-xs text-slate-500">상태: {permissionLabel}</p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            push.onChange(true);
          }}
          disabled={push.disabled || push.checked}
        >
          알림 켜기
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            push.onChange(false);
          }}
          disabled={push.disabled || !push.checked}
        >
          알림 끄기
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-600">{push.description}</p>
    </article>
  );
}
