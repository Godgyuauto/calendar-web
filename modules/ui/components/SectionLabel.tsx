import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

// Uppercase small-caps section header used above grouped cards (iOS list style).
export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <p
      className={`px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8e8e93] ${className}`}
    >
      {children}
    </p>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  hairline?: boolean;
}

// Row used inside SettingsGroupCard. 44/52px tall per iOS HIG.
// `hairline` controls the bottom border (pass false for the last row).
export function SettingsRow({
  label,
  description,
  trailing,
  onClick,
  hairline = true,
}: SettingsRowProps) {
  const inner = (
    <div
      className={`flex min-h-[44px] items-center justify-between py-2 ${
        hairline ? "border-b border-[#f5f5f5]" : ""
      }`}
    >
      <div>
        <p className="text-sm text-[#1a1a1a]">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-[#8e8e93]">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 text-[#8e8e93]">{trailing}</div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}
