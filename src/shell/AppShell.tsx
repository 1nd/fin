// CCA: 4
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { routePaths } from './routes';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();

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
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
