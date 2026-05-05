import { asNonEmptyString } from "@/modules/auth/api/supabase-auth";

export interface SignupFormData {
  email: string;
  password: string;
  displayName: string;
}

interface SignupValidationFailure {
  ok: false;
  message: string;
}

interface SignupValidationSuccess {
  ok: true;
  data: SignupFormData;
}

export type SignupValidationResult = SignupValidationSuccess | SignupValidationFailure;

export function normalizeEmail(value: unknown): string | null {
  const email = asNonEmptyString(value);
  return email ? email.toLowerCase() : null;
}

export function validateSignupForm(body: {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
}): SignupValidationResult {
  const email = normalizeEmail(body.email);
  const password = asNonEmptyString(body.password);
  const displayName = asNonEmptyString(body.displayName);

  if (!email || !password || !displayName) {
    return { ok: false, message: "이메일, 비밀번호, 이름을 입력해주세요." };
  }

  if (password.length < 6) {
    return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  }

  return { ok: true, data: { email, password, displayName } };
}

export function isDuplicateAccountMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already")
  );
}
