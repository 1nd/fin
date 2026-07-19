// CCA: 4
import { Route, Routes } from 'react-router';
import { AppShell } from '../shell/AppShell';
import { LandingPage } from '../shell/LandingPage';
import { NotFoundPage } from '../shell/NotFoundPage';
import { routePaths, routePatterns } from '../shell/routes';
import { IdentityContextProvider, useIdentity } from '../identity/IdentityContext';
import type { IdentityUseCase } from '../identity/identityUseCase';
import { SignInPage } from '../identity/SignInPage';
import { PreferencesProvider } from '../settings/PreferencesContext';
import { SettingsPage } from '../settings/SettingsPage';

// The gate (`google-signin` D5): a conditional render, never a redirect, so the requested
// URL is preserved untouched and React Router renders it once identity
// flips to present. Exported for the gate's own tests (mock identity use case).
export function Gate() {
  const { identity } = useIdentity();

  // PreferencesProvider wraps both branches (`google-signin` D5): it's the only thing that
  // ever calls `i18next.changeLanguage`/sets the theme, including its `userId: null`
  // browser-cascade path that localizes the signed-out sign-in screen.
  return (
    <PreferencesProvider>
      {identity ? (
        <AppShell>
          <Routes>
            <Route path={routePaths.home} element={<LandingPage />} />
            <Route path={routePaths.settings} element={<SettingsPage />} />
            <Route path={routePatterns.catchAll} element={<NotFoundPage />} />
          </Routes>
        </AppShell>
      ) : (
        <SignInPage />
      )}
    </PreferencesProvider>
  );
}

interface AppProps {
  // Test-only seam, mirrors IdentityContextProvider's own (`google-signin` D2): lets
  // routing tests inject a mock identity use case directly instead of seeding the real
  // LocalStorageSessionStore's key, which would couple them to the session serialization
  // format.
  useCase?: IdentityUseCase;
}

function App({ useCase }: AppProps) {
  return (
    <IdentityContextProvider useCase={useCase}>
      <Gate />
    </IdentityContextProvider>
  );
}

export default App;
