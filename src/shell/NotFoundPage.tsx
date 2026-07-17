// CCA: 4
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { routePaths } from './routes';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className={styles.notFound}>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <Link to={routePaths.home}>{t('notFound.homeLink')}</Link>
    </section>
  );
}
