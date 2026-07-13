// CCA: 2
// Types for domain/entity "Auth".
export interface AuthUser {
  userId: string;
  email: string | null;
  name: string | null;
  /** Google account locale (BCP-47), consumed as a fallback source by locale preference resolution. */
  locale: string | null;
}

export type AuthState =
  | { status: 'restoring' }
  | { status: 'signed-out'; error: string | null }
  | { status: 'signed-in'; user: AuthUser };
