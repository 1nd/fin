// CCA: 4
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useIdentity } from '../identity/IdentityContext';
import { useTranslation } from '../i18n/useTranslation';
import { routePaths } from './routes';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const { identity, signOut } = useIdentity();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>{t('shell.brand')}</span>
        <nav className={styles.nav} aria-label={t('shell.navLabel')}>
          <NavLink
            to={routePaths.home}
            end
            className={({ isActive }) => (isActive ? styles.navItemActive : styles.navItem)}
          >
            {t('shell.nav.home')}
          </NavLink>
          <NavLink
            to={routePaths.settings}
            className={({ isActive }) => (isActive ? styles.navItemActive : styles.navItem)}
          >
            {t('shell.nav.settings')}
          </NavLink>
        </nav>
        <div className={styles.account}>
          <span className={styles.accountLabel}>{identity?.displayName || identity?.email}</span>
          <button type="button" className={styles.signOutButton} onClick={signOut}>
            {t('shell.account.signOut')}
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
