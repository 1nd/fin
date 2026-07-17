// CCA: 4
// Linkable targets: every value is a valid `to` for a Link.
export const routePaths = {
  home: '/',
  settings: '/settings',
} as const;

// Match-only patterns for Route definitions; never valid as a link target.
export const routePatterns = {
  catchAll: '*',
} as const;
