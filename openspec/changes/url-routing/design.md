## Context

Navigation today is in-memory: `useShellNavigation` holds a `ShellView` union in React state, `App.tsx` switches on it, and `AppShell` nav entries are buttons calling `onNavigate`. The URL never changes; back exits the app; refresh loses the view. The app is a Vite + React 19 SPA with two views (Home, Settings), all UI in CCA layer 4.

Constraints from `plan.md` ("URLs & navigation"):

- History-API clean paths, not hash URLs — but every link goes through the router so hash mode stays a config-level fallback, never a rewrite.
- No host, path prefix, or server capability assumed in app code. That the Phase 1 build output is a static SPA is a fact, not a commitment: it keeps static hosts available (which must then provide SPA fallback for history-API URLs) while never precluding a server-backed Fin — nothing in this change may bake the SPA shape in.
- Selective addressability: this change makes URLs possible, not mandatory everywhere.
- The action-URL safety policy is recorded in this design.

## Goals / Non-Goals

**Goals:**

- `/` and `/settings` addressable; back/forward navigate within the app; refresh restores the view.
- Pick the router library and confine it to CCA layer 4 behind a small surface (route table + links), keeping views presentational.
- Handle unknown paths inside the shell (localized not-found).
- Record the action-URL safety policy for all future changes.

**Non-Goals:**

- Add new views only if needed (for example, the `not-found` view).
- No query-string or entity-parameter routing (no entities exist yet); later changes add their own routes.
- Hosting/deployment work is not expected in this change; if it turns out to be necessary, open a discussion — do not skip it assuming later changes will pick it up. SPA fallback is documented as what a static host must provide *while the build output happens to be a static SPA* — a note to whoever hosts it, not a requirement of the design; a server-backed Fin would serve these routes itself and the note simply lapses.
- Route-level code splitting is OK if necessary.

## Decisions

### D1 — Router: React Router v7, declarative (library) mode

Evaluation frame: the router is picked for Fin, not for the two routes that exist today. Routes will multiply — some already planned (e.g. reporting in (G); entity views may earn parameterized URLs under selective addressability), some not yet conceived. So the current route count is not a consideration factor. What is: satisfying the plan constraints (history-API, config-level hash fallback, layer-4 confinement), remaining adequate as routes multiply, and — for whatever we can't foresee — passing the corner test below, so the pick stays cheap to revisit.

Alternatives considered:

- **Hand-rolled History API wrapper** — correct link interception (modifier keys, middle-click, external links), `popstate` handling, base-path resolution, and focus/scroll behavior are exactly the footguns libraries exist to absorb, and the burden grows with every route Fin adds. Rejected: permanent maintenance cost lands on us for zero product value.
- **TanStack Router** — its strengths (type-safe route params, schema-validated search params) grow with route count and would pay off most in parameter-heavy URLs such as reporting filters — so it cannot be dismissed as "overkill for Phase 1." Rejected on two grounds instead: (a) React Router is expected to remain fully adequate at Fin's eventual route count — far larger apps run on it; (b) TanStack's idioms (code-gen'd typed route trees, loader-centric data flow) cost conceptual surface from day one and entangle data fetching with the navigation layer — CCA's separation of concerns is served by keeping the router pure navigation glue, wherever data flow itself ends up living. If Fin's URLs later become parameter-heavy enough that TanStack is clearly better, migrating is acceptable — the corner test keeps that migration cheap and localized.
- **wouter** — tiny and history-API based; viable. Rejected in favor of React Router mainly for its `MemoryRouter` test story, `HashRouter` as the plan-required config-level fallback, and being the ecosystem default (least surprising for future readers).

React Router v7 in **declarative mode** (`BrowserRouter` + `Routes`/`Route` + `Link`/`NavLink`) — not framework/data mode: no loaders, no code-gen, no build integration. It is a plain runtime dependency living entirely in CCA layer 4.

**Corner test (a plan-level engineering practice; see `plan.md`):** an addition or modification to Fin must never require rewriting foundation/infra that has nothing to do with it — that is the trap this design guards against. A migration or rewrite is acceptable when it is cheap and touches only the parts that exist for the rewritten concern. Here confinement (D2/D3) ensures it: the router's entire surface is the route table, one provider at the composition root, `Link`s in the shell, and route-param reads in views — all layer 4. Swapping navigation tech (TanStack, hash mode, native navigation on another platform) is a mechanical change across exactly those points and touches nothing in layers 1–3.

### D2 — Central route table as the single path source

One module (layer 4) declares `{ path, view }` for `/` (Home) and `/settings` (Settings) and exposes path constants/helpers. Components never hardcode path strings; `AppShell` links and `Routes` both read the table. This is what keeps "every link goes through the router" checkable and makes the hash-mode fallback a one-file change.

### D3 — Router provider at the composition root; `useShellNavigation` retired

`main.tsx` wraps the app in `<BrowserRouter basename={import.meta.env.BASE_URL}>`. `App.tsx` renders `Routes` from the route table. `AppShell` nav entries become `NavLink`s (active state from the URL via `aria-current`, styled with existing tokens — buttons-as-links replaced by real links, which also restores native open-in-new-tab semantics). `useShellNavigation` is deleted; the URL is the single source of navigation truth. Tests render the app under `MemoryRouter` with `initialEntries`.

### D4 — Base path from build config, not code

`basename` comes from Vite's `BASE_URL` (default `/`). If a host ever imposes a prefix, it's a Vite `base` config change; no app code mentions a prefix. This honors "no host assumption" without inventing configuration we don't need yet.

### D5 — Unknown paths: localized not-found view, no redirect

A catch-all route renders a not-found view inside the shell (localized en/id, link back to Home). Redirecting to `/` was rejected: it destroys the evidence of what was requested (bad for shared/bookmarked URLs that outlive a view) and makes refresh behavior look nondeterministic.

### D6 — Action-URL safety policy

Decided here, but this `design.md` gets archived with the change — so the policy's durable homes are elsewhere: the full policy (including the process rule, point 3) is recorded in `plan.md` ("URLs & navigation"), and the enforceable requirement lives in this change's `url-routing` spec delta, which syncs into the main spec on archive. What follows is the decision record.

An *action URL* is a URL whose visit performs a side effect (e.g. `/signout`). Browsers may speculatively prefetch/prerender typed URLs, executing the app and firing the effect without user intent. Policy:

1. **Default: don't ship action URLs.** Side effects belong on explicit in-page interactions (button → confirm), which are never prerendered.
2. If a change has a real reason to ship one, the URL must render an **inert confirmation view**; the side effect fires only on an explicit user gesture on that view. A gesture requirement inherently defeats prerender; `document.prerendering` may be checked as defense-in-depth but is not sufficient alone.
3. Spec scenarios for any action URL must include a "visited by prerender/prefetch → no side effect" scenario.

## Risks / Trade-offs

- [React Router has a history of disruptive major versions (v5→v6 rewrote the route API; v6→v7 renamed packages); a future major may break the APIs we adopt] → surface confined to route table, one provider, and `Link`s, so a forced migration stays cheap and localized (corner test); declarative mode is the subset that historically survives their majors best.
- [While the build output is a static SPA, a host without SPA fallback breaks deep links] → documented as a hosting note (README); hash mode remains the config-level fallback because all links go through the router; a server-backed Fin removes the concern entirely.
- [jsdom cannot exercise real URL bar, refresh, or prerender] → unit tests cover route table and `MemoryRouter` navigation/back; refresh-restore and back-button are in the change's manual verification step per AGENTS.md.
- [New runtime dependency] → accepted; it is the plan-mandated pick for this change and stays in layer 4.
