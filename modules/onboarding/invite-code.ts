import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const INVITE_CODE_VERSION = 1;
const INVITE_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface InviteCodePayload {
  v: typeof INVITE_CODE_VERSION;
  familyId: string;
  exp: number;
  nonce: string;
}

export type InviteCodeVerification =
  | { ok: true; familyId: string }
  | { ok: false; message: string };

function encodeBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadPart: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

function normalizeInviteCode(code: unknown): string | null {
  if (typeof code !== "string") {
    return null;
  }
  const normalized = code.replace(/\s+/g, "").trim();
  return normalized.length > 0 ? normalized : null;
}

function parsePayload(payloadPart: string): InviteCodePayload | null {
  try {
    const parsed = JSON.parse(decodeBase64Url(payloadPart)) as Partial<InviteCodePayload>;
    if (
      parsed.v !== INVITE_CODE_VERSION ||
      typeof parsed.familyId !== "string" ||
      !UUID_RE.test(parsed.familyId) ||
      typeof parsed.exp !== "number" ||
      !Number.isFinite(parsed.exp) ||
      typeof parsed.nonce !== "string" ||
      parsed.nonce.length === 0
    ) {
      return null;
    }
    return parsed as InviteCodePayload;
  } catch {
    return null;
  }
}

export function createFamilyInviteCode(
  familyId: string,
  secret: string,
  nowMs = Date.now(),
): string {
  if (!UUID_RE.test(familyId)) {
    throw new Error("Family id is invalid.");
  }
  if (secret.trim().length === 0) {
    throw new Error("Invite code secret is missing.");
  }

  const payload: InviteCodePayload = {
    v: INVITE_CODE_VERSION,
    familyId,
    exp: Math.floor((nowMs + INVITE_CODE_TTL_MS) / 1000),
    nonce: randomBytes(9).toString("base64url"),
  };
  const payloadPart = encodeBase64Url(JSON.stringify(payload));
  return `FAM1.${payloadPart}.${signPayload(payloadPart, secret)}`;
}

export function verifyFamilyInviteCode(
  code: unknown,
  secret: string,
  nowMs = Date.now(),
): InviteCodeVerification {
  const normalized = normalizeInviteCode(code);
  if (!normalized || secret.trim().length === 0) {
    return { ok: false, message: "초대 코드가 유효하지 않습니다." };
  }

  const [prefix, payloadPart, signature] = normalized.split(".");
  if (prefix !== "FAM1" || !payloadPart || !signature) {
    return { ok: false, message: "초대 코드가 유효하지 않습니다." };
  }

  const expected = signPayload(payloadPart, secret);
  const actualSignature = Buffer.from(signature);
  const expectedSignature = Buffer.from(expected);
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return { ok: false, message: "초대 코드가 유효하지 않습니다." };
  }

  const payload = parsePayload(payloadPart);
  if (!payload) {
    return { ok: false, message: "초대 코드가 유효하지 않습니다." };
  }
  if (payload.exp < Math.floor(nowMs / 1000)) {
    return { ok: false, message: "초대 코드가 만료되었습니다." };
  }

  return { ok: true, familyId: payload.familyId };
}
