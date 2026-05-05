"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  PrimaryButton,
  TextField,
  CalendarIcon,
} from "@/modules/ui/components";
import { AuthModeTabs, type AuthMode } from "@/modules/auth/AuthModeTabs";
import { signInWithPassword, signUpWithPassword } from "@/modules/auth/login-client-actions";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled =
    loading ||
    email.length === 0 ||
    password.length === 0 ||
    (mode === "signup" && displayName.length === 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const result = mode === "login"
      ? await signInWithPassword(email, password)
      : await signUpWithPassword(email, password, displayName);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if ("signedIn" in result && !result.signedIn) {
      setNotice("계정이 만들어졌습니다. 이메일 확인 후 로그인해주세요.");
      return;
    }
    router.replace(mode === "signup" ? "/onboarding" : "/");
    router.refresh();
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
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

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
          <AuthModeTabs mode={mode} onChange={changeMode} />
          {mode === "signup" ? (
            <TextField
              type="text"
              placeholder="이름"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          ) : null}
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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p role="alert" className="text-[12px] text-[#ff3b30]">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-[12px] text-[#007AFF]">
              {notice}
            </p>
          ) : null}
          <PrimaryButton type="submit" disabled={disabled} className="mt-2">
            {loading
              ? mode === "login"
                ? "로그인 중..."
                : "계정 만드는 중..."
              : mode === "login"
                ? "로그인"
                : "계정 만들기"}
          </PrimaryButton>
        </form>

        <aside className="mt-8 rounded-[12px] bg-[#f2f2f7] px-4 py-3 text-[12px] text-[#8e8e93]">
          계정을 만든 뒤 새 가족을 만들거나 초대 코드로 가족 캘린더에 참여합니다.
        </aside>
      </main>
    </AuthShell>
  );
}
