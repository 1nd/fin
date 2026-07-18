// CCA: 4
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useIdentity } from './IdentityContext';
import styles from './SignInPage.module.css';

export function SignInPage() {
  const { t } = useTranslation();
  const { signIn, signInError } = useIdentity();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  // False until `signIn` actually renders the affordance into the container. A script-load
  // or config failure leaves this false — the button never existed, so unlike a rejected
  // token (which leaves a real, clickable button behind, per the multi-fire fix) there is
  // no affordance for the user to retry with.
  const [buttonRendered, setButtonRendered] = useState(false);

  const attemptSignIn = useCallback(() => {
    const container = buttonContainerRef.current;
    if (!container) return;
    startedRef.current = true;
    void signIn(container).then(setButtonRendered);
  }, [signIn]);

  useEffect(() => {
    // Render the Google button once per mount, guarded by a ref rather than by
    // signIn's referential stability — memoization is a perf hint, not a
    // guarantee. Once rendered, the button itself drives every subsequent attempt
    // (account chooser of `google-signin` D1); each attempt's outcome reaches this
    // screen through IdentityContext's onIdentity subscription, not through
    // this effect or signIn's returned Promise.
    if (startedRef.current) return;
    attemptSignIn();
  }, [attemptSignIn]);

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

        {signInError === 'signin' && !buttonRendered && (
          <button type="button" className={styles.retry} onClick={attemptSignIn}>
            {t('signIn.retry')}
          </button>
        )}

        <p className={styles.privacyNote}>{t('signIn.privacyNote')}</p>
      </div>
    </section>
  );
}
