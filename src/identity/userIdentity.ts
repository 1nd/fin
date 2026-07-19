// CCA: 1
export interface UserIdentity {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly pictureUrl?: string;
}

// The Google account's `sub` claim is stable and opaque per account (`google-signin` D3) and
// is used directly as Fin's userId; email is display-only and never a key.
export function userIdFromGoogleSubject(sub: string): string {
  return sub;
}
