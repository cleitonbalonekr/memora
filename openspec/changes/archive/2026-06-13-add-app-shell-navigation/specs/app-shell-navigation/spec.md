## ADDED Requirements

### Requirement: Persistent app shell on authenticated pages

The system SHALL render a single global app shell around all authenticated pages under `src/app/(app)/`, providing a top bar, a desktop sidebar, and a mobile bottom nav. Pages SHALL render their content into the shell-provided content area and SHALL NOT define their own full-screen background or page-level navigation chrome. Pages under `(auth)/` SHALL remain chrome-free.

#### Scenario: Authenticated page shows shared chrome

- **WHEN** a signed-in user views any page under `(app)/` (e.g. `/dashboard`, `/decks`)
- **THEN** the page renders inside the app shell with the top bar and navigation visible, and the page supplies only its own content

#### Scenario: Auth pages remain chrome-free

- **WHEN** a user views a page under `(auth)/` (e.g. `/log-in`, `/sign-up`)
- **THEN** the app shell chrome (sidebar, top bar, bottom nav) is NOT rendered

### Requirement: Responsive navigation layout

The navigation SHALL adapt to viewport width. At the `md` breakpoint and above, the system SHALL display a fixed left sidebar and SHALL NOT display the bottom nav. Below `md`, the system SHALL display a fixed bottom nav and SHALL NOT display the sidebar; the top bar SHALL show the "Memora" wordmark.

#### Scenario: Desktop viewport

- **WHEN** the viewport is `md` width or wider
- **THEN** the fixed left sidebar is visible, the main content is offset to clear it, and the mobile bottom nav is hidden

#### Scenario: Mobile viewport

- **WHEN** the viewport is narrower than `md`
- **THEN** the fixed bottom nav is visible, the sidebar is hidden, and the top bar shows the "Memora" wordmark

### Requirement: Single source of truth for navigation items

The system SHALL define navigation items in one shared nav-config consumed by both the sidebar and the bottom nav, so the two cannot drift. The desktop sidebar SHALL present Dashboard, Library, Analytics, and Settings plus a "Create New Deck" action. The mobile bottom nav SHALL present Dashboard, Library, Create, and Settings.

#### Scenario: Sidebar and bottom nav derive from the same config

- **WHEN** a navigation item's label, route, or icon is changed in the nav-config
- **THEN** both the sidebar and the bottom nav reflect the change without a second edit

#### Scenario: Per-breakpoint item sets

- **WHEN** the navigation renders
- **THEN** the desktop sidebar includes Analytics and a "Create New Deck" action, and the mobile bottom nav omits Analytics and includes a "Create" item

### Requirement: Active route indication

The navigation SHALL indicate the active destination based on the current path. The active item SHALL be visually highlighted and SHALL expose `aria-current` for assistive technology.

#### Scenario: Current route is highlighted

- **WHEN** the user is on a route that matches a navigation item
- **THEN** that item is visually highlighted and carries `aria-current="page"`, while other items are not

### Requirement: Signed-in landing routes to the dashboard

The system SHALL route a signed-in user to `/dashboard` as the default landing destination. The root redirect SHALL send authenticated users to `/dashboard` instead of `/decks`.

#### Scenario: Authenticated user opens the app root

- **WHEN** a signed-in user navigates to `/`
- **THEN** the system redirects to `/dashboard`

#### Scenario: Unauthenticated user opens the app root

- **WHEN** a signed-out user navigates to `/`
- **THEN** the system redirects to `/log-in`

### Requirement: Analytics destination placeholder

The system SHALL provide an `/analytics` page reachable from the navigation that displays a clear "Coming soon" message.

#### Scenario: Visiting analytics

- **WHEN** a signed-in user selects Analytics
- **THEN** the `/analytics` page renders inside the shell and shows a "Coming soon" message

### Requirement: Settings destination hosts logout

The system SHALL provide a `/settings` page reachable from the navigation. The Logout action SHALL live on the Settings page and SHALL no longer appear in the deck list header. Logging out SHALL end the session.

#### Scenario: Logout from settings

- **WHEN** a signed-in user opens `/settings` and activates Logout
- **THEN** the session is ended and the user is signed out

#### Scenario: Deck list no longer carries logout

- **WHEN** a signed-in user views the deck list (Library)
- **THEN** no Logout control is present in that page's header
