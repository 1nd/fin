// CCA: 4
// A missing/blank client id: the sign-in screen shows a configuration
// notice rather than crashing (D7).
export class ConfigurationError extends Error {}

// The user cancelled, the popup failed, or the token failed verification
// (D9): the sign-in screen shows a retry-able notice.
export class SignInError extends Error {}
