import "server-only";
import { redirect } from "next/navigation";
import { isAccessTokenExpired } from "@/modules/auth/access-token-claims";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";

export async function hasServerSession(): Promise<boolean> {
  const accessToken = await getServerAccessTokenFromCookies();
  if (!accessToken) {
    return false;
  }
  return !isAccessTokenExpired(accessToken);
}

export async function ensureAuthenticatedOrRedirect(pathname = "/"): Promise<void> {
  if (!(await hasServerSession())) {
    redirect(pathname);
  }
}
