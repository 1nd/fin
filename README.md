# Fin

Personal net worth and budgeting tracker (React Native + Expo, web target for Phase 1).

## Development

```
npm install
npm run web
```

## Google Sign-In setup

Sign-in uses Google's OAuth 2.0 flow directly (via `expo-auth-session`), so local development needs
a real OAuth client ID:

1. In the [Google Cloud Console](https://console.cloud.google.com/), open **APIs & Services > Credentials**.
2. Create an **OAuth client ID** of type **Web application**.
3. Add `http://localhost:8081` as an **Authorized JavaScript origin** (the default `npm run web` port).
4. Add `http://localhost:8081` as an **Authorized redirect URI** as well — the sign-in request sends
   `redirect_uri=http://localhost:8081`, and Google rejects it with `Error 400: redirect_uri_mismatch`
   unless it appears in this list too.
5. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` to the client ID.

`EXPO_PUBLIC_`-prefixed variables are bundled into client-side code, matching the rest of Phase 1's
client-only architecture — see the `auth` capability spec for why sign-in is an access convenience
here, not a security boundary.
