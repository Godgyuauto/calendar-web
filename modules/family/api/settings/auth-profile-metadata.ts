function pickString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDisplayName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const userMetadata = metadata as Record<string, unknown>;
  return (
    pickString(userMetadata.display_name) ??
    pickString(userMetadata.name) ??
    pickString(userMetadata.full_name) ??
    pickString(userMetadata.nickname) ??
    pickString(userMetadata.preferred_username)
  );
}
