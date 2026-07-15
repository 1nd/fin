// CCA: 4
import type { ReactNode } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { ShellView } from './useShellNavigation';
import styles from './AppShell.module.css';

interface AppShellProps {
  activeView: ShellView;
  onNavigate: (view: ShellView) => void;
  children: ReactNode;
}

export function AppShell({ activeView, onNavigate, children }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>{t('shell.brand')}</span>
        <nav className={styles.nav} aria-label={t('shell.navLabel')}>
          <button
            type="button"
            className={activeView === 'home' ? styles.navItemActive : styles.navItem}
            aria-current={activeView === 'home' ? 'page' : undefined}
            onClick={() => onNavigate('home')}
          >
            {t('shell.nav.home')}
          </button>
          <button
            type="button"
            className={activeView === 'settings' ? styles.navItemActive : styles.navItem}
            aria-current={activeView === 'settings' ? 'page' : undefined}
            onClick={() => onNavigate('settings')}
          >
            {t('shell.nav.settings')}
          </button>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
