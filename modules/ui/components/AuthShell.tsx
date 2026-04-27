import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

// Shell for login/onboarding — no tab bar, phone-width cap, centered column.
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="app-shell">
      <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    </div>
  );
}
