"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  Card,
  PrimaryButton,
} from "@/modules/ui/components";

interface PatternOption {
  id: string;
  title: string;
  subtitle: string;
}

const PATTERNS: PatternOption[] = [
  { id: "A-OFF-B-OFF-C-OFF", title: "A-OFF-B-OFF-C-OFF", subtitle: "24일 주기 (기본)" },
  { id: "A-B", title: "A-B 교대", subtitle: "2일 주기" },
  { id: "day-night", title: "주/야간 교대", subtitle: "2교대" },
  { id: "custom", title: "직접 입력", subtitle: "개인 맞춤 패턴" },
];

// Step 1 of a 3-step onboarding. Steps 2/3 are not designed in the handoff —
// tapping "다음" redirects to home for now; replace when steps are specified.
export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(PATTERNS[0]!.id);

  return (
    <AuthShell>
      <header className="px-5 pt-8">
        <div className="flex gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-[#007AFF]" />
          <span className="h-1.5 flex-1 rounded-full bg-[#e5e5ea]" />
          <span className="h-1.5 flex-1 rounded-full bg-[#e5e5ea]" />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8e8e93]">
          1 / 3
        </p>
        <h1 className="mt-2 text-[22px] font-bold text-[#1a1a1a]">근무 패턴을 설정해주세요</h1>
        <p className="mt-1 text-[13px] text-[#8e8e93]">
          선택한 패턴으로 달력이 자동 생성됩니다.
        </p>
      </header>

      <main className="flex-1 px-4 pt-5">
        <div className="flex flex-col gap-2">
          {PATTERNS.map((pattern) => {
            const active = selected === pattern.id;
            return (
              <button
                key={pattern.id}
                type="button"
                onClick={() => setSelected(pattern.id)}
                className="text-left"
              >
                <Card
                  className={`flex items-center justify-between border ${
                    active
                      ? "border-[#007AFF] ring-1 ring-[#007AFF]"
                      : "border-transparent"
                  }`}
                >
                  <div>
                    <p
                      className={`text-[15px] font-semibold ${
                        active ? "text-[#007AFF]" : "text-[#1a1a1a]"
                      }`}
                    >
                      {pattern.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#8e8e93]">{pattern.subtitle}</p>
                  </div>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      active
                        ? "border-[#007AFF] bg-[#007AFF] text-white"
                        : "border-[#c7c7cc] bg-white"
                    }`}
                    aria-hidden
                  >
                    {active ? (
                      <svg
                        width={12}
                        height={12}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : null}
                  </span>
                </Card>
              </button>
            );
          })}
        </div>
      </main>

      <footer
        className="px-4 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <PrimaryButton onClick={() => router.push("/")}>다음</PrimaryButton>
      </footer>
    </AuthShell>
  );
}
