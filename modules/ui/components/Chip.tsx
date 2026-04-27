"use client";

import type { ReactNode } from "react";

interface ChipProps {
  active: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  // Variant "pill" is the default type-select chip (rounded pill w/ border).
  // Variant "segment" is a full-height equal-width chip (A/B/C/OFF row).
  variant?: "pill" | "segment";
  as?: "button" | "div";
}

// Selectable chip used for event-type grid and shift-override row.
// Active = solid blue fill, inactive = white with hairline border.
export function Chip({
  active,
  onClick,
  children,
  className = "",
  variant = "pill",
  as = "button",
}: ChipProps) {
  const base =
    variant === "pill"
      ? "px-3 py-1.5 rounded-[10px] text-[13px] inline-flex items-center gap-1 border"
      : "h-8 flex-1 rounded-[8px] flex items-center justify-center text-[13px] border";
  const theme = active
    ? "bg-[#007AFF] text-white border-[#007AFF] font-semibold"
    : variant === "pill"
      ? "bg-white text-[#1a1a1a] border-[#e5e5ea]"
      : "bg-[#f2f2f7] text-[#1a1a1a] border-[#e5e5ea]";

  if (as === "div") {
    return <div className={`${base} ${theme} ${className}`}>{children}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${theme} ${className}`}>
      {children}
    </button>
  );
}
