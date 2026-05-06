import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";
import MembersPageClient from "@/modules/members/MembersPageClient";
import { getMembersPageData } from "@/modules/members/members-page-data";

export default async function MembersPage() {
  await ensureAuthenticatedOrRedirect("/");

  const data = await getMembersPageData();
  return <MembersPageClient data={data} />;
}
