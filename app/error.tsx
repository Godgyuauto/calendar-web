"use client";

import { useEffect } from "react";
import Link from "next/link";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f2f2f7] px-6 py-12">
      <section className="w-full max-w-[420px] rounded-2xl border border-[#e5e5ea] bg-white px-5 py-6 text-center">
        <p className="text-[13px] font-semibold text-[#8e8e93]">오류</p>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1a1a1a]">
          문제가 발생했습니다
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-[#8e8e93]">
          잠시 후 다시 시도하거나 홈 화면으로 돌아가 주세요.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex h-[48px] flex-1 items-center justify-center rounded-[13px] bg-[#007AFF] text-[15px] font-semibold text-white active:opacity-90"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="flex h-[48px] flex-1 items-center justify-center rounded-[13px] border border-[#e5e5ea] bg-white text-[15px] font-semibold text-[#1a1a1a] active:bg-[#f2f2f7]"
          >
            홈으로
          </Link>
        </div>
      </section>
    </main>
  );
}
