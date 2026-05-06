import OnboardingPage from "@/modules/onboarding/OnboardingPage";
import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";

interface OnboardingRoutePageProps {
  searchParams?: Promise<{ mode?: string }>;
}

export default async function OnboardingRoutePage({ searchParams }: OnboardingRoutePageProps) {
  await ensureAuthenticatedOrRedirect("/");
  const params = await searchParams;
  return <OnboardingPage initialMode={params?.mode === "join" ? "join" : "create"} />;
}
