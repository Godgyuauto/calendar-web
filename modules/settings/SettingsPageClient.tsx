"use client";

import {
  Card,
  ChevronRightIcon,
  NavBar,
  SectionLabel,
  SettingsGroupCard,
  SettingsRow,
  TabShell,
  Toggle,
} from "@/modules/ui/components";
import { usePushToggleController } from "@/modules/settings/push-toggle-controller";
import type { SettingsPageData } from "@/modules/settings/settings-page-data";
import { useWorkingToggleController } from "@/modules/settings/working-toggle-controller";

interface SettingsPageClientProps {
  data: SettingsPageData;
}

function getProfileInitial(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "나";
  }

  return trimmed.slice(0, 1);
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
        <SectionLabel>프로필</SectionLabel>
        <button type="button" className="mx-4 block text-left">
          <Card className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#007AFF] text-[16px] font-semibold text-white">
              {getProfileInitial(data.profileName)}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-[#1a1a1a]">{data.profileName}</p>
              <p className="mt-0.5 text-[12px] text-[#8e8e93]">{data.profileEmail}</p>
            </div>
            <ChevronRightIcon className="text-[#c7c7cc]" />
          </Card>
        </button>
        {!data.isConnected ? (
          <p className="px-4 pt-1 text-[11px] text-[#8e8e93]">
            로그인 토큰이 없어 서버 데이터를 읽지 못했습니다.
          </p>
        ) : null}

        <SectionLabel>가족 정보</SectionLabel>
        <SettingsGroupCard>
          <SettingsRow
            label="가족 캘린더 이름"
            trailing={
              <>
                <span className="text-[13px]">{data.familyName}</span>
                <ChevronRightIcon />
              </>
            }
            onClick={() => {}}
          />
          <SettingsRow
            label="멤버 관리"
            trailing={
              <>
                <span className="text-[13px]">{data.profileName}</span>
                <ChevronRightIcon />
              </>
            }
            onClick={() => {}}
            hairline={false}
          />
        </SettingsGroupCard>

        <SectionLabel>근무 설정</SectionLabel>
        <SettingsGroupCard>
          <SettingsRow
            label="근무자 여부"
            description={workingToggle.description}
            trailing={
              <Toggle
                checked={workingToggle.checked}
                onChange={workingToggle.onChange}
                disabled={workingToggle.disabled}
              />
            }
          />
          <SettingsRow
            label="교대 패턴"
            description={`기준일: ${data.shiftPatternSeedDate}`}
            trailing={
              <>
                <span className="text-[13px]">{data.shiftPatternLabel}</span>
                <ChevronRightIcon />
              </>
            }
            onClick={() => {}}
            hairline={false}
          />
        </SettingsGroupCard>

        <SectionLabel>알림 및 기타</SectionLabel>
        <SettingsGroupCard>
          <SettingsRow
            label="푸시 알림"
            description={pushToggle.description}
            trailing={
              <Toggle checked={pushToggle.checked} onChange={pushToggle.onChange} disabled={pushToggle.disabled} />
            }
          />
          <SettingsRow
            label="다크 모드"
            description="테마 토큰 전환 전까지 UI 토글만 제공할 수 없어 비활성화됩니다"
            trailing={<Toggle checked={false} onChange={ignoreToggleChange} disabled={true} />}
            hairline={false}
          />
        </SettingsGroupCard>

        <div className="mt-6 px-4">
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="w-full rounded-[14px] bg-white py-3.5 text-[15px] font-semibold text-[#ff3b30]"
          >
            로그아웃
          </button>
        </div>
      </div>
    </TabShell>
  );
}
