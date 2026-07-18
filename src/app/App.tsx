// CCA: 4
import { Route, Routes } from 'react-router';
import { AppShell } from '../shell/AppShell';
import { LandingPage } from '../shell/LandingPage';
import { NotFoundPage } from '../shell/NotFoundPage';
import { routePaths, routePatterns } from '../shell/routes';
import { IdentityContextProvider, useIdentity } from '../identity/IdentityContext';
import { SignInPage } from '../identity/SignInPage';
import { PreferencesProvider } from '../settings/PreferencesContext';
import { SettingsPage } from '../settings/SettingsPage';

// The gate (`google-signin` D5): a conditional render, never a redirect, so the requested
// URL is preserved untouched and React Router renders it once identity
// flips to present. Exported for the gate's own tests (mock identity use case).
export function Gate() {
  const { identity } = useIdentity();

  if (!identity) {
    return <SignInPage />;
  }

  return (
    <PreferencesProvider>
      <AppShell>
        <Routes>
          <Route path={routePaths.home} element={<LandingPage />} />
          <Route path={routePaths.settings} element={<SettingsPage />} />
          <Route path={routePatterns.catchAll} element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </PreferencesProvider>
  );
}

function App() {
  return (
    <IdentityContextProvider>
      <Gate />
    </IdentityContextProvider>
  );
}

export default App;
