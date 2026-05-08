"use client";

import { useState } from "react";
import {
  BottomSheet,
  NavBar,
  PrimaryButton,
  SecondaryButton,
  TabShell,
} from "@/modules/ui/components";
import {
  FamilyInfoSection,
  NotificationSettingsSection,
  ProfileSection,
  SignOutButton,
  WorkSettingsSection,
} from "@/modules/settings/SettingsPageSections";
import { AnnualLeaveSettingsSection } from "@/modules/settings/AnnualLeaveSettingsSection";
import { usePushToggleController } from "@/modules/settings/push-toggle-controller";
import type { SettingsPageData } from "@/modules/settings/settings-page-data";
import { useWorkingToggleController } from "@/modules/settings/working-toggle-controller";

interface SettingsPageClientProps {
  data: SettingsPageData;
}

export default function SettingsPageClient({ data }: SettingsPageClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

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

  const createInviteCode = async () => {
    setInviteOpen(true);
    setInviteLoading(true);
    setInviteError(null);
    setInviteCode(null);
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as {
        inviteCode?: string;
        error?: string;
      };
      if (!response.ok || !body.inviteCode) {
        setInviteError(body.error ?? "초대 코드를 만들지 못했습니다.");
        return;
      }
      setInviteCode(body.inviteCode);
    } catch {
      setInviteError("네트워크 오류가 발생했습니다.");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (!inviteCode) {
      return;
    }
    await navigator.clipboard?.writeText(inviteCode);
  };

  return (
    <TabShell>
      <NavBar title="설정" />
      <div className="flex flex-col pb-10">
        <ProfileSection data={data} />
        <FamilyInfoSection data={data} onCreateInvite={() => void createInviteCode()} />
        <AnnualLeaveSettingsSection initialData={data.annualLeave} />
        <WorkSettingsSection data={data} workingToggle={workingToggle} />
        <NotificationSettingsSection
          pushToggle={pushToggle}
          onDarkModeToggle={ignoreToggleChange}
        />
        <SignOutButton onSignOut={() => void signOut()} />
      </div>
      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        ariaLabel="초대 코드"
      >
        <div className="px-6">
          <p className="text-[12px] font-semibold text-[#8e8e93]">가족 초대</p>
          <h2 className="mt-1 text-[22px] font-bold text-[#1a1a1a]">초대 코드</h2>
          <p className="mt-2 text-[13px] leading-5 text-[#8e8e93]">
            아내 계정에서 계정 만들기 후 이 코드를 입력하면 같은 가족 캘린더에 들어옵니다.
          </p>
          <textarea
            readOnly
            value={inviteCode ?? (inviteLoading ? "초대 코드 만드는 중..." : "")}
            placeholder="초대 코드"
            className="mt-4 h-28 w-full resize-none rounded-[12px] bg-[#f2f2f7] p-3 text-[13px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
          {inviteError ? (
            <p role="alert" className="mt-2 text-[12px] text-[#ff3b30]">
              {inviteError}
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <SecondaryButton type="button" onClick={() => setInviteOpen(false)}>
              닫기
            </SecondaryButton>
            <PrimaryButton
              type="button"
              disabled={!inviteCode}
              onClick={() => void copyInviteCode()}
            >
              복사
            </PrimaryButton>
          </div>
        </div>
      </BottomSheet>
    </TabShell>
  );
}
