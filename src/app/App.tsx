// CCA: 4
import { AppShell } from '../shell/AppShell';
import { LandingPage } from '../shell/LandingPage';
import { useShellNavigation } from '../shell/useShellNavigation';
import { PreferencesProvider } from '../settings/PreferencesContext';
import { SettingsPage } from '../settings/SettingsPage';

function App() {
  const { activeView, navigate } = useShellNavigation();

  return (
    <PreferencesProvider>
      <AppShell activeView={activeView} onNavigate={navigate}>
        {activeView === 'home' ? <LandingPage /> : <SettingsPage />}
      </AppShell>
    </PreferencesProvider>
  );
}

export default App;
