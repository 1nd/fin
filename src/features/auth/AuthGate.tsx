// CCA: 4
import { Redirect } from 'expo-router';
import type React from 'react';
import { useAuth } from './auth-context';

/** Redirects to Sign-in when there is no session (auth spec: gate authenticated routes). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.status === 'signed-out') return <Redirect href="/sign-in" />;
  if (auth.status === 'restoring') return null;
  return <>{children}</>;
}

/** Redirects away from Sign-in when a session already exists. */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.status === 'signed-in') return <Redirect href="/" />;
  return <>{children}</>;
}
