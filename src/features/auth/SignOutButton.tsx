// CCA: 4
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared-ui/Button';
import { useAuth } from './auth-context';

/** Ends the local session without deleting any locally stored data (auth spec: "Sign out"). */
export function SignOutButton() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return <Button label={t('auth.signOut.button')} variant="secondary" onPress={() => signOut()} />;
}
