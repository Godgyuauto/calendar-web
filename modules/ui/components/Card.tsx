import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "article" | "section" | "div";
}

// Apple-style white card with subtle separator border and generous radius.
// Use for grouped content on the gray background surface.
export function Card({ children, className = "", as: Tag = "article" }: CardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-[#e5e5ea] bg-white px-4 py-3.5 ${className}`}
    >
      {children}
    </Tag>
  );
}

interface SettingsGroupCardProps {
  children: ReactNode;
  className?: string;
}

// Inset card used on Settings: children are rows separated by hairlines.
// Children should render flex rows; hairlines come from child borders.
export function SettingsGroupCard({ children, className = "" }: SettingsGroupCardProps) {
  return (
    <article
      className={`rounded-2xl border border-[#e5e5ea] bg-white px-4 ${className}`}
    >
      {children}
    </article>
  );
}
