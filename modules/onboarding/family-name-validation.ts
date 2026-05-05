export interface FamilyNameValidationSuccess {
  ok: true;
  familyName: string;
}

export interface FamilyNameValidationFailure {
  ok: false;
  message: string;
}

export type FamilyNameValidationResult =
  | FamilyNameValidationSuccess
  | FamilyNameValidationFailure;

export function validateFamilyName(value: unknown): FamilyNameValidationResult {
  if (typeof value !== "string") {
    return { ok: false, message: "가족 이름을 입력해주세요." };
  }

  const familyName = value.trim();
  if (familyName.length === 0) {
    return { ok: false, message: "가족 이름을 입력해주세요." };
  }

  if (familyName.length > 40) {
    return { ok: false, message: "가족 이름은 40자 이내로 입력해주세요." };
  }

  return { ok: true, familyName };
}
