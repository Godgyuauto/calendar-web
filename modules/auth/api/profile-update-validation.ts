import { asNonEmptyString } from "@/modules/auth/api/supabase-auth";

export interface ProfileUpdateFormData {
  displayName: string;
}

interface ProfileUpdateValidationFailure {
  ok: false;
  message: string;
}

interface ProfileUpdateValidationSuccess {
  ok: true;
  data: ProfileUpdateFormData;
}

export type ProfileUpdateValidationResult =
  | ProfileUpdateValidationSuccess
  | ProfileUpdateValidationFailure;

export function validateProfileUpdateForm(body: {
  displayName?: unknown;
}): ProfileUpdateValidationResult {
  const displayName = asNonEmptyString(body.displayName);
  if (!displayName) {
    return { ok: false, message: "이름을 입력해주세요." };
  }

  if (displayName.length > 30) {
    return { ok: false, message: "이름은 30자 이하로 입력해주세요." };
  }

  return { ok: true, data: { displayName } };
}
