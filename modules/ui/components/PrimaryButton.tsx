"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
}

// iOS HIG primary CTA: filled blue, full-width, 13px radius, 50px tall.
// Use at the bottom of screens and inside sheets for the main action.
export function PrimaryButton({
  children,
  loading,
  className = "",
  disabled,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`flex h-[50px] w-full items-center justify-center rounded-[13px] bg-[#007AFF] text-base font-semibold text-white transition active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? "처리 중…" : children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  disabled,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`flex h-[50px] w-full items-center justify-center rounded-[13px] border border-[#e5e5ea] bg-white text-base font-medium text-[#1a1a1a] transition active:bg-[#f2f2f7] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
