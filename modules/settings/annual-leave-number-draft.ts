export function sanitizeIntegerDraft(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseIntegerDraft(value: string): number | null {
  return value === "" ? null : Number(value);
}

export function numberToDraft(value: number): string {
  return String(value);
}
