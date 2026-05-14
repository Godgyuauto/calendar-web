import {
  Card,
  ChevronRightIcon,
  SectionLabel,
  SettingsGroupCard,
  SettingsRow,
  Toggle,
} from "@/modules/ui/components";
import type { SettingsPageData } from "@/modules/settings/settings-page-data";

interface ToggleController {
  checked: boolean;
  disabled: boolean;
  description: string;
  onChange: (next: boolean) => void;
}

function getProfileInitial(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "나";
  }

  return trimmed.slice(0, 1);
}

export function ProfileSection({ data }: { data: SettingsPageData }) {
  return (
    <>
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
    </>
  );
}

export function FamilyInfoSection({
  data,
  onCreateInvite,
}: {
  data: SettingsPageData;
  onCreateInvite: () => void;
}) {
  if (!data.canCreateInvite) {
    return null;
  }

  return (
    <>
      <SectionLabel>가족 초대</SectionLabel>
      <SettingsGroupCard>
        <SettingsRow
          label="초대 코드 만들기"
          description="아내 계정이 이 코드로 같은 가족 캘린더에 참여합니다"
          trailing={<ChevronRightIcon />}
          onClick={onCreateInvite}
          hairline={false}
        />
      </SettingsGroupCard>
    </>
  );
}

export function WorkSettingsSection({
  data,
  workingToggle,
}: {
  data: SettingsPageData;
  workingToggle: ToggleController;
}) {
  return (
    <>
      <SectionLabel>근무 설정</SectionLabel>
      <SettingsGroupCard>
        <SettingsRow
          label="근무자 여부"
          description={workingToggle.description}
          trailing={<Toggle {...workingToggle} />}
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
    </>
  );
}

export function NotificationSettingsSection({
  pushToggle,
  onDarkModeToggle,
}: {
  pushToggle: ToggleController;
  onDarkModeToggle: () => void;
}) {
  return (
    <>
      <SectionLabel>알림 및 기타</SectionLabel>
      <SettingsGroupCard>
        <SettingsRow
          label="푸시 알림"
          description={pushToggle.description}
          trailing={<Toggle {...pushToggle} />}
        />
        <SettingsRow
          label="다크 모드"
          description="테마 토큰 전환 전까지 UI 토글만 제공할 수 없어 비활성화됩니다"
          trailing={<Toggle checked={false} onChange={onDarkModeToggle} disabled={true} />}
          hairline={false}
        />
      </SettingsGroupCard>
    </>
  );
}

export function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="mt-6 px-4">
      <button
        type="button"
        onClick={onSignOut}
        className="w-full rounded-[14px] bg-white py-3.5 text-[15px] font-semibold text-[#ff3b30]"
      >
        로그아웃
      </button>
    </div>
  );
}
