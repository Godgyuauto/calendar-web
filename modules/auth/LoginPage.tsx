"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  PrimaryButton,
  TextField,
  CalendarIcon,
} from "@/modules/ui/components";

interface LoginFailure {
  error: string;
}

interface LoginSuccess {
  ok: true;
}

// Auth handoff entry.
// Browser posts credentials to our server route so token handling stays server-side.
async function signInWithPassword(
  email: string,
  password: string,
): Promise<LoginSuccess | LoginFailure> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return {
        error: body.error ?? "로그인에 실패했습니다.",
      };
    }
    return { ok: true };
  } catch {
    return { error: "네트워크 오류가 발생했습니다." };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled = loading || email.length === 0 || password.length === 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signInWithPassword(email, password);
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
          <h1 className="mt-6 text-[26px] font-bold text-[#1a1a1a]">가족 교대 캘린더</h1>
          <p className="mt-1.5 text-[13px] text-[#8e8e93]">
            가족의 일상을 잇는 교대 근무 캘린더
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-3">
          <TextField
            type="email"
            placeholder="이메일 주소"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p role="alert" className="text-[12px] text-[#ff3b30]">
              {error}
            </p>
          ) : null}
          <PrimaryButton type="submit" disabled={disabled} className="mt-2">
            {loading ? "로그인 중..." : "로그인"}
          </PrimaryButton>
        </form>

        <aside className="mt-8 rounded-[12px] bg-[#f2f2f7] px-4 py-3 text-[12px] text-[#8e8e93]">
          계정은 관리자가 생성합니다. 이메일로 발급받은 계정 정보를 입력해주세요.
        </aside>
      </main>
    </AuthShell>
  );
}
