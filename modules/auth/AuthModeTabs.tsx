"use client";

export type AuthMode = "login" | "signup";

export function AuthModeTabs({
  mode,
  onChange,
}: {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-[12px] bg-[#f2f2f7] p-1">
      {(["login", "signup"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-[9px] py-2 text-[13px] font-semibold ${
            mode === item ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#8e8e93]"
          }`}
        >
          {item === "login" ? "로그인" : "계정 만들기"}
        </button>
      ))}
    </div>
  );
}
