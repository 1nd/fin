// CCA: 4
// Guarantees the singleton is configured before any consumer calls t(),
// even in trees rendered without the app bootstrap (e.g. component tests).
import './i18n';

export { useTranslation } from 'react-i18next';
