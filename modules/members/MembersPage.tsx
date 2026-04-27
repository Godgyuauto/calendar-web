import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";
import {
  Card,
  NavBar,
  SectionLabel,
  TabShell,
  UserPlusIcon,
} from "@/modules/ui/components";
import { SHIFT_PALETTE, type ShiftPaletteKey } from "@/modules/ui/tokens";
import { getMembersPageData, type MemberRow } from "@/modules/members/members-page-data";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function ShiftBadge({ shift }: { shift: ShiftPaletteKey }) {
  const p = SHIFT_PALETTE[shift];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: p.bg, color: p.fg }}
    >
      {shift}
    </span>
  );
}

function MemberCard({ member }: { member: MemberRow }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.name.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[#1a1a1a]">{member.name}</p>
        <p className="mt-0.5 text-[12px] text-[#8e8e93]">
          {member.working && member.todayShift
            ? `${member.roleLabel} · 오늘: ${member.todayShift} 근무`
            : "근무 일정 없음"}
        </p>
      </div>
      {member.working && member.todayShift ? (
        <ShiftBadge shift={member.todayShift} />
      ) : (
        <span className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] text-[#8e8e93]">
          미근무
        </span>
      )}
    </div>
  );
}

// Members tab entry: member roster + weekly compare grid + invite CTA.
// Non-working members surface as "미근무" and are listed with a hint row in
// the compare grid ("근무 일정 없음") per handoff requirement.
export default async function MembersPage() {
  await ensureAuthenticatedOrRedirect("/");

  const data = await getMembersPageData();

  const emptyMessage = data.isConnected
    ? "등록된 가족 멤버가 없습니다."
    : "로그인 후 멤버 정보를 불러올 수 있습니다.";

  return (
    <TabShell>
      <NavBar title="멤버" right={<UserPlusIcon size={20} />} />
      <div className="flex flex-col pb-6">
        <SectionLabel>우리집 캘린더</SectionLabel>
        <div className="mx-4 overflow-hidden rounded-[14px] bg-white">
          {data.members.length === 0 ? (
            <div className="px-4 py-5 text-[13px] text-[#8e8e93]">{emptyMessage}</div>
          ) : (
            data.members.map((member, i) => (
              <div
                key={member.id}
                className={i < data.members.length - 1 ? "border-b border-[#f5f5f5]" : ""}
              >
                <MemberCard member={member} />
              </div>
            ))
          )}
        </div>

        <SectionLabel>이번 주 일정 비교</SectionLabel>
        <Card className="mx-4 !p-3">
          {data.members.length === 0 ? (
            <p className="text-[12px] text-[#8e8e93]">{emptyMessage}</p>
          ) : (
            <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-1 text-[11px]">
              <div />
              {WEEKDAY_KO.map((d) => (
                <div key={d} className="text-center font-semibold text-[#8e8e93]">
                  {d}
                </div>
              ))}
              {data.members.map((member) => (
                <div key={member.id} className="contents">
                  <div className="truncate py-2 text-[12px] font-medium text-[#1a1a1a]">
                    {member.name}
                  </div>
                  {member.working && member.weekShifts
                    ? member.weekShifts.map((shift, i) => {
                        const p = SHIFT_PALETTE[shift];
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-center py-1.5"
                          >
                            <span
                              className="rounded-full px-1.5 text-[10px] font-semibold"
                              style={{ backgroundColor: p.bg, color: p.fg }}
                            >
                              {shift}
                            </span>
                          </div>
                        );
                      })
                    : (
                      <div className="col-span-7 flex items-center pl-1 text-[11px] text-[#8e8e93]">
                        근무 일정 없음
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <SectionLabel>초대</SectionLabel>
        <button
          type="button"
          className="mx-4 flex items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[#c7c7cc] bg-transparent py-4 text-[13px] font-semibold text-[#007AFF]"
        >
          <UserPlusIcon size={18} />
          가족 초대하기
        </button>
      </div>
    </TabShell>
  );
}
