"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  CalendarIcon,
  PrimaryButton,
  SegmentControl,
  TextField,
} from "@/modules/ui/components";

type OnboardingMode = "create" | "join";

interface CreateFamilyFailure {
  error: string;
}

interface CreateFamilySuccess {
  ok: true;
}

async function createFamily(familyName: string): Promise<CreateFamilySuccess | CreateFamilyFailure> {
  try {
    const response = await fetch("/api/onboarding/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ familyName }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return { error: body.error ?? "가족 캘린더를 만들지 못했습니다." };
    }
    return { ok: true };
  } catch {
    return { error: "네트워크 오류가 발생했습니다." };
  }
}

async function joinFamily(inviteCode: string): Promise<CreateFamilySuccess | CreateFamilyFailure> {
  try {
    const response = await fetch("/api/onboarding/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ inviteCode }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return { error: body.error ?? "가족 캘린더에 참여하지 못했습니다." };
    }
    return { ok: true };
  } catch {
    return { error: "네트워크 오류가 발생했습니다." };
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<OnboardingMode>("create");
  const [familyName, setFamilyName] = useState("우리 가족");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled =
    loading || (mode === "create" ? familyName.trim().length === 0 : inviteCode.trim().length === 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === "create" ? await createFamily(familyName) : await joinFamily(inviteCode);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <AuthShell>
      <main className="flex flex-1 flex-col justify-center px-6 pb-10 pt-14">
        <div className="flex flex-col items-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-[#007AFF] text-white shadow-[0_10px_24px_rgba(0,122,255,0.28)]">
            <CalendarIcon size={36} />
          </div>
          <h1 className="mt-6 text-[26px] font-bold text-[#1a1a1a]">가족 캘린더 시작</h1>
          <p className="mt-1.5 text-center text-[13px] text-[#8e8e93]">
            새 가족을 만들거나 받은 초대 코드로 참여합니다.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-3">
          <SegmentControl
            options={[
              { value: "create", label: "새 가족" },
              { value: "join", label: "초대 코드" },
            ]}
            value={mode}
            onChange={(next) => {
              setMode(next);
              setError(null);
            }}
          />
          {mode === "create" ? (
            <TextField
              type="text"
              placeholder="가족 이름"
              autoComplete="organization"
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
            />
          ) : (
            <TextField
              type="text"
              placeholder="초대 코드 붙여넣기"
              autoComplete="one-time-code"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
            />
          )}
          {error ? (
            <p role="alert" className="text-[12px] text-[#ff3b30]">
              {error}
            </p>
          ) : null}
          <PrimaryButton type="submit" disabled={disabled} className="mt-2">
            {loading ? "처리 중..." : mode === "create" ? "새 가족 만들기" : "초대 코드로 참여"}
          </PrimaryButton>
        </form>

        <aside className="mt-8 rounded-[12px] bg-[#f2f2f7] px-4 py-3 text-[12px] text-[#8e8e93]">
          가족 관리자가 만든 초대 코드는 7일 동안 사용할 수 있습니다.
        </aside>
      </main>
    </AuthShell>
  );
}
