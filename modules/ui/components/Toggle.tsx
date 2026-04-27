"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

// iOS toggle: 44x26 pill, green when on, gray when off. White 22px thumb.
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full p-0.5 transition ${
        checked ? "bg-[#34c759] justify-end" : "bg-[#e5e5ea] justify-start"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span className="block h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
    </button>
  );
}
