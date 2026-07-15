// CCA: 4
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './resources/en.json';
import id from './resources/id.json';

// Catalogs are bundled inline (`openspec/changes/app-foundation/design.md` D3), so `init()` completes synchronously and
// `void` is safe: `t()` works from the first render. If catalogs ever load async,
// `init` must be awaited (or Suspense enabled) before render. Guard (task 4.4): the
// UI smoke test must assert real translated strings — raw-key output must fail it;
// consider `parseMissingKeyHandler` to fail loudly on missing keys in tests.
void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
