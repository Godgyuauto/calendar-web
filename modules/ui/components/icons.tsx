// SF Symbols-style line icons. 24x24 viewBox, currentColor stroke, 1.8 weight.
// Keep these minimal — if we need more than ~15, move to a dedicated icon lib
// with user approval (absolute rule #5).

interface IconProps {
  size?: number;
  className?: string;
}

function Base({
  d,
  size = 20,
  className = "",
}: IconProps & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export const CalendarIcon = (p: IconProps) => (
  <Base {...p} d="M8 2v3M16 2v3M3.5 9.5h17M4 4h16a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
);
export const BellIcon = (p: IconProps) => (
  <Base {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
);
export const PersonIcon = (p: IconProps) => (
  <Base {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
);
export const ChatIcon = (p: IconProps) => (
  <Base {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
);
export const GearIcon = (p: IconProps) => (
  <Base
    {...p}
    d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.13.32.2.66.2 1"
  />
);
export const PlusIcon = (p: IconProps) => <Base {...p} d="M12 5v14M5 12h14" />;
export const ChevronLeftIcon = (p: IconProps) => <Base {...p} d="M15 18l-6-6 6-6" />;
export const ChevronRightIcon = (p: IconProps) => <Base {...p} d="M9 18l6-6-6-6" />;
export const CloseIcon = (p: IconProps) => <Base {...p} d="M18 6L6 18M6 6l12 12" />;
export const UserPlusIcon = (p: IconProps) => (
  <Base {...p} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M16 11h6" />
);
