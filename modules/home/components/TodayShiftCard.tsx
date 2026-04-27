import { SHIFT_LABELS_KO, type ShiftCode } from "@/modules/shift";

interface TodayShiftCardProps {
  shift: ShiftCode;
}

// Blue-gradient "오늘 근무" card.
// Shows a compact shift summary with optional start/end badges.
export function TodayShiftCard({ shift }: TodayShiftCardProps) {
  const shiftLabel = SHIFT_LABELS_KO[shift];
  const shortLabel = shift === "OFF" ? "휴무" : `${shift} 근무`;
  const [startTime, endTime] =
    shift === "A"
      ? ["07:00", "15:00"]
      : shift === "B"
        ? ["15:00", "23:00"]
        : shift === "C"
          ? ["23:00", "07:00"]
          : [null, null];

  return (
    <section
      aria-label="오늘 근무"
      className="mx-5 rounded-[18px] bg-gradient-to-br from-[#007AFF] to-[#4facfe] p-5 text-white shadow-[0_10px_24px_rgba(0,122,255,0.25)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
        오늘 근무
      </p>
      <p className="mt-1 text-[30px] font-bold leading-none">
        {shortLabel}
      </p>
      <p className="mt-2 text-[13px] text-white/85">{shiftLabel}</p>
      {startTime && endTime ? (
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-white/18 px-4 py-1.5 text-[12px] font-semibold">
            시작 {startTime}
          </span>
          <span className="rounded-full bg-white/18 px-4 py-1.5 text-[12px] font-semibold">
            종료 {endTime}
          </span>
        </div>
      ) : null}
      {shift === "OFF" ? (
        <p className="mt-4 text-[13px] text-white/85">푹 쉬어가세요 ☁️</p>
      ) : null}
    </section>
  );
}
