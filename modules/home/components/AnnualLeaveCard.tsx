"use client";

import { useState } from "react";
import type { AnnualLeaveHomeData } from "@/modules/home/home-annual-leave";
import { BottomSheet } from "@/modules/ui/components";

function formatHistoryDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function AnnualLeaveCard({ data }: { data: AnnualLeaveHomeData | null }) {
  const [open, setOpen] = useState(false);
  if (!data) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-5 block rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-3 text-left"
      >
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
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} ariaLabel="연차 사용 이력">
        <div className="px-6">
          <p className="text-[12px] font-semibold text-[#8e8e93]">{data.year}년 연차</p>
          <h2 className="mt-1 text-[22px] font-bold text-[#1a1a1a]">사용 이력</h2>
          <div className="mt-4 overflow-hidden rounded-[14px] border border-[#e5e5ea] bg-white">
            {data.history.length > 0 ? (
              data.history.map((item, index) => (
                <div
                  key={`${item.date}:${index}`}
                  className="border-b border-[#f2f2f7] px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-bold text-[#1a1a1a]">
                      {formatHistoryDate(item.date)}
                    </p>
                    <p className="shrink-0 text-[12px] font-semibold text-[#007AFF]">
                      {item.amountLabel}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-center text-[13px] font-semibold text-[#8e8e93]">
                사용 이력이 없습니다.
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
