// CCA: 4
// A missing/blank client id: the sign-in screen shows a configuration
// notice rather than crashing (`google-signin` D7).
export class ConfigurationError extends Error {}

// The sign-in script/popup failed to load, or the returned token failed verification
// (`google-signin` D9): the sign-in screen shows a retry-able notice. A bare dismissal of
// the account chooser is not one of these — GIS gives no signal for it at all, so it
// never reaches this class.
export class SignInError extends Error {}
