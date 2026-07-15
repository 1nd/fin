// CCA: 4
import { useTranslation } from '../i18n/useTranslation';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <section className={styles.landing}>
      <h1>{t('landing.title')}</h1>
      <p>{t('landing.body')}</p>
    </section>
  );
}
