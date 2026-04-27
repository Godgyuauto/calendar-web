"use client";

import { useEffect, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // Aria label for the dialog — describe what the sheet contains.
  ariaLabel: string;
}

// iOS bottom sheet: dim backdrop + rounded-top white panel that slides up.
// Non-modal trap kept simple: ESC + backdrop click close. No focus trap yet
// (MVP-level; revisit when sheet nesting grows beyond AddEvent).
export function BottomSheet({ open, onClose, children, ariaLabel }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative w-full max-w-lg rounded-t-[22px] border border-b-0 border-[#e5e5ea] bg-white pb-6 pt-2.5 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-[#d1d1d6]" />
        {children}
      </section>
    </div>
  );
}
