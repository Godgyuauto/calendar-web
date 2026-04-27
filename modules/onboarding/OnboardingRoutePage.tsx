import OnboardingPage from "@/modules/onboarding/OnboardingPage";
import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";

export default async function OnboardingRoutePage() {
  await ensureAuthenticatedOrRedirect("/");
  return <OnboardingPage />;
}
