import type { AnnualLeaveHomeData } from "@/modules/home/home-annual-leave";

export function AnnualLeaveCard({ data }: { data: AnnualLeaveHomeData | null }) {
  if (!data) {
    return null;
  }

  return (
    <section className="mx-5 rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-[#8e8e93]">{data.year}년 연차</p>
          <p className="mt-0.5 text-[20px] font-bold text-[#1a1a1a]">
            {data.remainingLabel}
          </p>
        </div>
        <div className="rounded-full bg-[#f2f2f7] px-3 py-1 text-[12px] font-semibold text-[#8e8e93]">
          총 {data.totalDays}개
        </div>
      </div>
    </section>
  );
}
