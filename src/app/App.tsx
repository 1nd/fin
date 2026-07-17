// CCA: 4
import { Route, Routes } from 'react-router';
import { AppShell } from '../shell/AppShell';
import { LandingPage } from '../shell/LandingPage';
import { NotFoundPage } from '../shell/NotFoundPage';
import { routePaths, routePatterns } from '../shell/routes';
import { PreferencesProvider } from '../settings/PreferencesContext';
import { SettingsPage } from '../settings/SettingsPage';

function App() {
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

export default App;
