/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
