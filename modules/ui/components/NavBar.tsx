import type { ReactNode } from "react";

interface NavBarProps {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
}

// Sticky top nav bar at 44px height, matching iOS standard.
// Title is centered; left/right slots host up to one icon each.
export function NavBar({ title, left, right }: NavBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-11 items-center justify-between border-b border-[#e5e5ea] bg-white/92 px-4 backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center text-[#1a1a1a]">
        {left}
      </div>
      <h1 className="text-base font-bold tracking-tight text-[#1a1a1a]">{title}</h1>
      <div className="flex h-10 w-10 items-center justify-center text-[#1a1a1a]">
        {right}
      </div>
    </header>
  );
}
