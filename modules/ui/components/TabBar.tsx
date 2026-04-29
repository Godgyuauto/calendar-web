"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, GearIcon, PersonIcon } from "@/modules/ui/components/icons";

interface Tab {
  href: string;
  label: string;
  icon: React.ReactNode;
  // The href is active when pathname strictly matches or starts with it (for nested routes).
  // Home "/" is an exact match only.
  exact?: boolean;
}

const TABS: Tab[] = [
  // Root route is the dashboard home. `/calendar` remains in the same top-level
  // navigation group and is treated as active for this tab.
  { href: "/", label: "캘린더", icon: <CalendarIcon />, exact: true },
  { href: "/members", label: "멤버", icon: <PersonIcon /> },
  { href: "/settings", label: "설정", icon: <GearIcon /> },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.exact) {
    return pathname === tab.href || pathname === "/calendar";
  }
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

// Fixed bottom tab bar with blur background (iOS style).
// Uses safe-area-inset-bottom padding to clear home indicator on PWA.
export function TabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-[#e5e5ea] bg-white/92 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-center justify-around pb-2 pt-2">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition ${
                  active ? "text-[#007AFF]" : "text-[#aaa]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="h-[22px] w-[22px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
