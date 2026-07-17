// CCA: 4
import type { ChangeEvent } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePreferences } from './PreferencesContext';
import type { DateFormatPattern, Language, NumberFormatStyle, Theme } from './preferences';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { t } = useTranslation();
  const { preferences, persistenceError, setPreference } = usePreferences();

  return (
    <section className={styles.settings}>
      <h1>{t('settings.title')}</h1>

      {persistenceError && (
        <p role="alert" className={styles.saveError}>
          {t('settings.saveError')}
        </p>
      )}

      <label className={styles.field}>
        <span>{t('settings.languageLabel')}</span>
        <select
          value={preferences.language}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setPreference('language', event.target.value as Language)
          }
        >
          <option value="en">{t('settings.languageOptionEn')}</option>
          <option value="id">{t('settings.languageOptionId')}</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>{t('settings.numberFormatLabel')}</span>
        <select
          value={preferences.numberFormat}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setPreference('numberFormat', event.target.value as NumberFormatStyle)
          }
        >
          <option value="period-decimal">{t('settings.numberFormatOptionPeriodDecimal')}</option>
          <option value="comma-decimal">{t('settings.numberFormatOptionCommaDecimal')}</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>{t('settings.dateFormatLabel')}</span>
        <select
          value={preferences.dateFormat}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setPreference('dateFormat', event.target.value as DateFormatPattern)
          }
        >
          <option value="YYYY-MM-DD">{t('settings.dateFormatOptionIso')}</option>
          <option value="DD-MM-YYYY">{t('settings.dateFormatOptionDmy')}</option>
          <option value="MM-DD-YYYY">{t('settings.dateFormatOptionMdy')}</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>{t('settings.themeLabel')}</span>
        <select
          value={preferences.theme}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setPreference('theme', event.target.value as Theme)
          }
        >
          <option value="dark">{t('settings.themeOptionDark')}</option>
        </select>
      </label>
    </section>
  );
}
