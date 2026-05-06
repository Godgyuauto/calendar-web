export interface MemberVisibilityProfile {
  email: string | null;
  displayName: string | null;
}

export function isSystemMemberProfile(profile: MemberVisibilityProfile | undefined): boolean {
  const candidates = [profile?.email, profile?.displayName]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase());

  return candidates.some((value) => {
    const localPart = value.split("@")[0] ?? value;
    return (
      localPart.startsWith("codex.verify") ||
      localPart.startsWith("claude.push") ||
      localPart.startsWith("push.sender.") ||
      localPart.startsWith("push.receiver.")
    );
  });
}
