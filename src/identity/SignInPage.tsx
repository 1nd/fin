// CCA: 4
import { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useIdentity } from './IdentityContext';
import styles from './SignInPage.module.css';

export function SignInPage() {
  const { t } = useTranslation();
  const { signIn, signInError } = useIdentity();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Render the Google button once per mount, guarded by a ref rather than by
    // signIn's referential stability — memoization is a perf hint, not a
    // guarantee. The button itself drives every subsequent attempt (D1's
    // account chooser).
    if (startedRef.current) return;
    const container = buttonContainerRef.current;
    if (container) {
      startedRef.current = true;
      void signIn(container);
    }
  }, [signIn]);

  return (
    <section className={styles.signIn}>
      <div className={styles.card}>
        <h1>{t('signIn.title')}</h1>
        <p>{t('signIn.body')}</p>

        <div ref={buttonContainerRef} className={styles.button} />

        {signInError === 'config' && (
          <p role="alert" className={styles.error}>
            {t('signIn.configError')}
          </p>
        )}
        {signInError === 'signin' && (
          <p role="alert" className={styles.error}>
            {t('signIn.signInError')}
          </p>
        )}

        <p className={styles.privacyNote}>{t('signIn.privacyNote')}</p>
      </div>
    </section>
  );
}
