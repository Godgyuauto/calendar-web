"use client";

import {
  NavBar,
  TabShell,
} from "@/modules/ui/components";
import {
  FamilyInfoSection,
  NotificationSettingsSection,
  ProfileSection,
  SignOutButton,
  WorkSettingsSection,
} from "@/modules/settings/SettingsPageSections";
import { usePushToggleController } from "@/modules/settings/push-toggle-controller";
import type { SettingsPageData } from "@/modules/settings/settings-page-data";
import { useWorkingToggleController } from "@/modules/settings/working-toggle-controller";

interface SettingsPageClientProps {
  data: SettingsPageData;
}

export default function SettingsPageClient({ data }: SettingsPageClientProps) {
  // Why: /api/auth/login now sets an HttpOnly access_token cookie, which
  // document.cookie cannot clear. We must ask the server to expire it through
  // /api/auth/logout. Fall through to /login even if the call fails so the
  // user is not stuck on a page that still shows their family data.
  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Network-level failures should not block the redirect; server cookie
      // deletion can be retried on the next authenticated request anyway.
    }
    window.location.assign("/login");
  };

  // Persistence blocker for dark mode (documented in modules/settings/CLAUDE.md):
  // global theme token migration to CSS variables is still pending.
  const ignoreToggleChange = () => undefined;
  const workingToggle = useWorkingToggleController({
    initialWorking: data.selfWorking,
    enabled: data.isConnected,
  });
  const pushToggle = usePushToggleController({
    initialSubscribed: data.hasPushSubscription,
    enabled: data.isConnected,
  });

  return (
    <TabShell>
      <NavBar title="설정" />
      <div className="flex flex-col pb-10">
        <ProfileSection data={data} />
        <FamilyInfoSection data={data} />
        <WorkSettingsSection data={data} workingToggle={workingToggle} />
        <NotificationSettingsSection
          pushToggle={pushToggle}
          onDarkModeToggle={ignoreToggleChange}
        />
        <SignOutButton onSignOut={() => void signOut()} />
      </div>
    </TabShell>
  );
}
