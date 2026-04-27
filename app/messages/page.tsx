import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";
import { ChatIcon, NavBar, TabShell } from "@/modules/ui/components";

// Messages tab — not designed in the handoff. Placeholder until the
// messaging feature is scoped.
export default async function MessagesPage() {
  await ensureAuthenticatedOrRedirect("/");

  return (
    <TabShell>
      <NavBar title="메시지" />
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f7] text-[#8e8e93]">
          <ChatIcon size={28} />
        </div>
        <h2 className="text-[17px] font-semibold text-[#1a1a1a]">메시지 준비 중</h2>
        <p className="text-[13px] text-[#8e8e93]">
          가족과 일정 관련 메시지를 주고받을 수 있는 기능이 곧 제공될 예정입니다.
        </p>
      </main>
    </TabShell>
  );
}
