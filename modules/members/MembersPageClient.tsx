"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BottomSheet,
  NavBar,
  PrimaryButton,
  SecondaryButton,
  TabShell,
  TextField,
  UserPlusIcon,
} from "@/modules/ui/components";
import {
  JoinFamilySection,
  MembersRosterSection,
  ProfileCard,
  WeekCompareSection,
} from "@/modules/members/MembersPageSections";
import type { MembersPageData } from "@/modules/members/members-page-data";

export default function MembersPageClient({ data }: { data: MembersPageData }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(data.profileName);
  const [profileDraft, setProfileDraft] = useState(data.profileName);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const emptyMessage = data.isConnected
    ? "등록된 가족 멤버가 없습니다."
    : "초대 코드로 가족 캘린더에 참여해주세요.";

  const openProfile = () => {
    setProfileDraft(profileName);
    setProfileError(null);
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: profileDraft }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setProfileError(body.error ?? "이름을 저장하지 못했습니다.");
        return;
      }
      await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      setProfileName(profileDraft.trim());
      setProfileOpen(false);
      router.refresh();
    } catch {
      setProfileError("네트워크 오류가 발생했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <TabShell>
      <NavBar title="멤버" right={<UserPlusIcon size={20} />} />
      <div className="flex flex-col pb-6">
        <ProfileCard
          profileName={profileName}
          profileEmail={data.profileEmail}
          onEdit={openProfile}
        />
        <MembersRosterSection data={data} emptyMessage={emptyMessage} />
        <WeekCompareSection data={data} emptyMessage={emptyMessage} />
        <JoinFamilySection onJoin={() => router.push("/onboarding?mode=join")} />
      </div>

      <BottomSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        ariaLabel="프로필 이름 변경"
      >
        <div className="px-6">
          <p className="text-[12px] font-semibold text-[#8e8e93]">내 프로필</p>
          <h2 className="mt-1 text-[22px] font-bold text-[#1a1a1a]">이름 변경</h2>
          <div className="mt-4">
            <TextField
              type="text"
              label="이름"
              value={profileDraft}
              onChange={(event) => setProfileDraft(event.target.value)}
            />
          </div>
          {profileError ? (
            <p role="alert" className="mt-2 text-[12px] text-[#ff3b30]">
              {profileError}
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <SecondaryButton type="button" onClick={() => setProfileOpen(false)}>
              취소
            </SecondaryButton>
            <PrimaryButton type="button" loading={profileSaving} onClick={() => void saveProfile()}>
              저장
            </PrimaryButton>
          </div>
        </div>
      </BottomSheet>
    </TabShell>
  );
}
