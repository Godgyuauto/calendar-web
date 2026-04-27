import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

// iOS-style filled text field on gray-100 background.
// Borderless, 10px radius, 42px tall to match HIG input metrics.
export function TextField({ label, className = "", ...rest }: TextFieldProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8e8e93]">
          {label}
        </span>
      ) : null}
      <input
        {...rest}
        className={`h-[42px] w-full rounded-[10px] bg-[#f2f2f7] px-3.5 text-sm text-[#1a1a1a] placeholder:text-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${className}`}
      />
    </label>
  );
}
