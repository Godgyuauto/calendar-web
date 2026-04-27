"use client";

interface SegmentControlProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  className?: string;
}

// iOS segmented control: gray pill track, white thumb for active.
// Keep options short (2–4) and labels under 6 chars for a good fit.
export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentControlProps<T>) {
  return (
    <div
      className={`flex gap-0.5 rounded-[9px] bg-[#e5e5ea] p-0.5 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-[7px] px-2 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-white text-[#1a1a1a] shadow-sm"
                : "text-[#8e8e93] hover:text-[#1a1a1a]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
