// CCA: 4
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../theme/tokens.css';
import './index.css';
import '../i18n/i18n';
import { requestPersistentStorage } from '../storage/persist';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void requestPersistentStorage();
