import type { ReactNode } from "react";
import { TabBar } from "./TabBar";

interface TabShellProps {
  children: ReactNode;
  // Hides the bottom tab bar — used by modal-like full-screen flows if needed.
  hideTabBar?: boolean;
}

// Shared shell for every tab-bar page. Caps width at phone size on desktop
// and pins the 4-tab navigation to the bottom with safe-area inset.
export function TabShell({ children, hideTabBar = false }: TabShellProps) {
  return (
    <div className="app-shell">
      <div className="flex flex-1 flex-col pb-[72px]">{children}</div>
      {!hideTabBar ? <TabBar /> : null}
    </div>
  );
}
