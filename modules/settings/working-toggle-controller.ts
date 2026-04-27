"use client";

import { useCallback, useState } from "react";

interface UseWorkingToggleControllerParams {
  initialWorking: boolean;
  enabled: boolean;
}

interface WorkingToggleController {
  checked: boolean;
  disabled: boolean;
  description: string;
  onChange: (next: boolean) => void;
}

async function parseErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const payload = (await response.json().catch(() => ({}))) as { error?: unknown };
  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }

  return fallbackMessage;
}

export function useWorkingToggleController({
  initialWorking,
  enabled,
}: UseWorkingToggleControllerParams): WorkingToggleController {
  const [checked, setChecked] = useState(initialWorking);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const onChange = useCallback(
    (next: boolean) => {
      if (!enabled || busy) {
        return;
      }

      setBusy(true);
      setMessage("");
      setChecked(next);

      void (async () => {
        try {
          const response = await fetch("/api/members", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ working: next }),
          });

          if (!response.ok) {
            throw new Error(await parseErrorMessage(response, "근무자 상태 저장에 실패했습니다."));
          }

          setMessage(next ? "근무자로 설정되었습니다." : "미근무로 설정되었습니다.");
        } catch (error) {
          setChecked(!next);
          setMessage(
            error instanceof Error ? error.message : "근무자 상태 저장 중 오류가 발생했습니다.",
          );
        } finally {
          setBusy(false);
        }
      })();
    },
    [busy, enabled],
  );

  if (!enabled) {
    return {
      checked,
      disabled: true,
      description: "로그인 연결이 필요해 근무자 설정을 변경할 수 없습니다.",
      onChange,
    };
  }

  if (message) {
    return {
      checked,
      disabled: busy,
      description: message,
      onChange,
    };
  }

  return {
    checked,
    disabled: busy,
    description: checked ? "근무 일정 계산에 포함됩니다." : "미근무로 처리되어 일정 계산에서 제외됩니다.",
    onChange,
  };
}
