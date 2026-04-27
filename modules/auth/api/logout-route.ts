import { startApiLog } from "@/modules/family/api/request-log";
import { responseForNoContent } from "@/modules/family/api/route-log-response";
import { clearAccessTokenCookies } from "@/modules/auth/api/auth-cookie";

function clearSessionCookieAndRespond(method: "POST" | "DELETE") {
  const logScope = startApiLog("/api/auth/logout", method, "pnpm run verify:release:auth");
  const response = responseForNoContent(logScope, 204);
  clearAccessTokenCookies(response);
  return response;
}

export async function POST() {
  return clearSessionCookieAndRespond("POST");
}

export async function DELETE() {
  return clearSessionCookieAndRespond("DELETE");
}
