import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";
import SettingsPageClient from "@/modules/settings/SettingsPageClient";
import { getSettingsPageData } from "@/modules/settings/settings-page-data";

export default async function SettingsPage() {
  await ensureAuthenticatedOrRedirect("/");

  const data = await getSettingsPageData();
  return <SettingsPageClient data={data} />;
}
