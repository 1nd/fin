# url-routing

## Purpose

TBD — captures URL-addressable app views, in-app navigation driving the browser URL, browser history traversal within the app, a localized not-found view for unknown paths, and the guard that prevents action URLs from firing side effects on mere visit.

## Requirements

### Requirement: Views addressable by URL

The system SHALL make app views addressable at stable history-API paths (clean paths, no hash fragment): Home at `/` and Settings at `/settings`. Visiting an addressable URL directly, or refreshing the browser on it, SHALL render that view.

#### Scenario: Direct visit to Settings

- **WHEN** the browser navigates directly to `/settings`
- **THEN** the app renders the Settings view inside the shell

#### Scenario: Refresh restores the current view

- **WHEN** the user is on Settings and reloads the browser
- **THEN** the Settings view is rendered again after the reload

#### Scenario: Clean path, no hash

- **WHEN** the user is viewing Settings
- **THEN** the browser URL path is `/settings` with no `#`-fragment routing

### Requirement: In-app navigation drives the URL

All internal navigation SHALL go through the router: activating a navigation entry SHALL update the browser URL to the target view's path without a full page reload, and internal links SHALL behave as real links (e.g. open-in-new-tab works).

#### Scenario: Navigating updates the URL

- **WHEN** the user activates the Settings entry in the shell navigation from Home
- **THEN** the Settings view renders and the browser URL becomes `/settings` without a full page reload

#### Scenario: Active entry reflects the URL

- **WHEN** the current URL is `/settings`
- **THEN** the Settings navigation entry is marked as the current page and Home is not

### Requirement: Browser history navigates within the app

Browser back and forward SHALL traverse the app's own navigation history: after navigating between views in-app, back SHALL return to the previously viewed view rather than leaving the app.

#### Scenario: Back returns to the previous view

- **WHEN** the user navigates Home → Settings and presses the browser back button
- **THEN** the Home view is rendered and the URL is `/`

#### Scenario: Forward re-enters the view

- **WHEN** after going back from Settings to Home the user presses the browser forward button
- **THEN** the Settings view is rendered and the URL is `/settings`

### Requirement: Unknown paths render a localized not-found view

The system SHALL render a not-found view inside the shell for any path that matches no route, keeping the requested URL intact (no redirect) and offering navigation back to Home. All not-found text SHALL come from the message catalogs (English and Indonesian).

#### Scenario: Visiting an unknown path

- **WHEN** the browser navigates to a path that matches no route (e.g. `/nope`)
- **THEN** a localized not-found view renders inside the shell, the URL stays as requested, and a link back to Home is offered

### Requirement: Action URLs must guard their side effect

Any URL whose visit performs a side effect SHALL NOT execute that side effect merely by being rendered (browsers may speculatively prefetch or prerender URLs). Such a URL SHALL render an inert view and fire the side effect only on an explicit user gesture. This change ships no action URLs; the requirement binds every future change that does.

#### Scenario: Speculative visit fires no side effect

- **WHEN** an action URL is loaded without an explicit user gesture (e.g. browser prerender or prefetch)
- **THEN** the side effect does not execute and the view renders inert, awaiting confirmation
