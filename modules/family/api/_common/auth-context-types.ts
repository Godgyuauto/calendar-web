export interface FamilyAuthContext {
  familyId: string;
  userId: string;
  accessToken: string;
}

export interface ApiAuthFailure {
  message: string;
  status: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface FamilyMemberRow {
  family_id: string;
}

export class ApiAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
