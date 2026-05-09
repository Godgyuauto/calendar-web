import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f2f2f7] px-6 py-12">
      <section className="w-full max-w-[420px] rounded-2xl border border-[#e5e5ea] bg-white px-5 py-6 text-center">
        <p className="text-[13px] font-semibold text-[#8e8e93]">404</p>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1a1a1a]">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-[#8e8e93]">
          주소가 바뀌었거나 더 이상 사용할 수 없는 화면입니다.
        </p>
        <Link
          href="/"
          className="mt-6 flex h-[48px] w-full items-center justify-center rounded-[13px] bg-[#007AFF] text-[15px] font-semibold text-white active:opacity-90"
        >
          홈으로 이동
        </Link>
      </section>
    </main>
  );
}
