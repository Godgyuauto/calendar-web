"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  CalendarIcon,
  PrimaryButton,
  TextField,
} from "@/modules/ui/components";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("우리 가족");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled = loading || familyName.trim().length === 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createFamily(familyName);
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
            먼저 내 가족 공간을 만들고, 다음 단계에서 가족을 초대합니다.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-3">
          <TextField
            type="text"
            placeholder="가족 이름"
            autoComplete="organization"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
          />
          {error ? (
            <p role="alert" className="text-[12px] text-[#ff3b30]">
              {error}
            </p>
          ) : null}
          <PrimaryButton type="submit" disabled={disabled} className="mt-2">
            {loading ? "만드는 중..." : "새 가족 만들기"}
          </PrimaryButton>
        </form>

        <aside className="mt-8 rounded-[12px] bg-[#f2f2f7] px-4 py-3 text-[12px] text-[#8e8e93]">
          초대 코드로 참여하기는 다음 단계에서 추가합니다.
        </aside>
      </main>
    </AuthShell>
  );
}
