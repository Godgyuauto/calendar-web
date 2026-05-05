import { describe, expect, it } from "vitest";
import {
  createFamilyInviteCode,
  verifyFamilyInviteCode,
} from "@/modules/onboarding/invite-code";

const FAMILY_ID = "11111111-1111-4111-8111-111111111111";
const SECRET = "service-role-like-secret";
const NOW = Date.UTC(2026, 4, 6, 0, 0, 0);

describe("invite code", () => {
  it("creates a signed invite code that resolves to a family id", () => {
    const code = createFamilyInviteCode(FAMILY_ID, SECRET, NOW);

    expect(verifyFamilyInviteCode(code, SECRET, NOW)).toEqual({
      ok: true,
      familyId: FAMILY_ID,
    });
  });

  it("allows pasted codes with whitespace", () => {
    const code = createFamilyInviteCode(FAMILY_ID, SECRET, NOW);

    expect(verifyFamilyInviteCode(` ${code.slice(0, 8)}\n${code.slice(8)} `, SECRET, NOW)).toEqual({
      ok: true,
      familyId: FAMILY_ID,
    });
  });

  it("rejects tampered codes", () => {
    const code = createFamilyInviteCode(FAMILY_ID, SECRET, NOW);
    const tampered = `${code.slice(0, -1)}x`;

    expect(verifyFamilyInviteCode(tampered, SECRET, NOW)).toEqual({
      ok: false,
      message: "초대 코드가 유효하지 않습니다.",
    });
  });

  it("rejects expired codes", () => {
    const code = createFamilyInviteCode(FAMILY_ID, SECRET, NOW);
    const eightDaysLater = NOW + 8 * 24 * 60 * 60 * 1000;

    expect(verifyFamilyInviteCode(code, SECRET, eightDaysLater)).toEqual({
      ok: false,
      message: "초대 코드가 만료되었습니다.",
    });
  });
});
