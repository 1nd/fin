// CCA: 4
// Minimal ambient typing for the Google Identity Services (GIS) client
// script (https://accounts.google.com/gsi/client); no official @types package.
export interface GoogleIdCredentialResponse {
  credential: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  auto_select?: boolean;
  callback: (response: GoogleIdCredentialResponse) => void;
  error_callback?: (error: { type: string; message?: string }) => void;
}

export interface GoogleAccountsId {
  initialize(config: GoogleIdConfiguration): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

export interface GoogleGlobal {
  accounts: { id: GoogleAccountsId };
}

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}
