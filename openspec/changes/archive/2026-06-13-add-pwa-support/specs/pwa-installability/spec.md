## ADDED Requirements

### Requirement: Installable web app manifest

The system SHALL serve a web app manifest that declares the app `name`, `short_name`, `description`, `start_url`, `scope`, `display` mode of `standalone`, `theme_color`, `background_color`, and an icon set, so that supporting browsers offer to install the app to the home screen or app launcher.

#### Scenario: Browser offers installation

- **WHEN** a user visits the app in a browser that supports PWA installation
- **THEN** the manifest is served and linked, and the browser exposes an install / "Add to Home Screen" action

#### Scenario: Manifest declares standalone display

- **WHEN** the manifest is fetched
- **THEN** its `display` is `standalone`, `start_url` is `/`, `scope` is `/`, and `theme_color` and `background_color` are set from the app palette

### Requirement: App icons for home screen and launcher

The system SHALL provide app icons covering standard install targets: a 192×192 and a 512×512 icon, a 512×512 maskable icon (for Android adaptive icons), and a 180×180 `apple-touch-icon` for iOS. All icons SHALL derive from a single source mark committed to the repository.

#### Scenario: Installed app shows a branded icon

- **WHEN** a user installs the app to their home screen or launcher
- **THEN** the app appears with the branded icon rather than a generic or screenshot icon

#### Scenario: Maskable icon adapts on Android

- **WHEN** an Android device renders the installed icon within its adaptive-icon mask
- **THEN** the maskable 512×512 icon is used and its mark stays within the safe zone without clipping

### Requirement: Standalone launch experience

The system SHALL configure the installed app to launch in a standalone window without browser navigation chrome (URL bar, tabs), presenting an app-like fullscreen experience.

#### Scenario: Launching the installed app

- **WHEN** a user opens the installed app from the home screen
- **THEN** it launches in a standalone window with no browser address bar or tab strip, starting at `start_url`

### Requirement: Branded splash screen on Android and iOS

The system SHALL present a branded splash screen while the app launches on both platforms. On Android the splash SHALL be composed from the manifest (`name`, icon, `background_color`). On iOS, which ignores the manifest for launch images, the system SHALL provide `apple-touch-startup-image` link tags with device-matched media queries so iPhone and iPad show a branded splash; devices without a matching image SHALL fall back to the `background_color` canvas.

#### Scenario: Android launch splash

- **WHEN** a user launches the installed app on Android
- **THEN** a splash screen showing the app icon and name on the `background_color` is displayed during startup

#### Scenario: iOS launch splash

- **WHEN** a user launches the installed app on a supported iОS device
- **THEN** the matching `apple-touch-startup-image` is shown as the launch splash

#### Scenario: iOS device without a matching image

- **WHEN** a user launches the installed app on an iOS device with no matching startup image
- **THEN** the launch falls back gracefully to the `background_color` screen rather than failing

### Requirement: iOS installable web app metadata

The system SHALL declare iOS web-app metadata so the app installs and launches correctly from Safari: web-app-capable, an app title for the home-screen label, and a status-bar style consistent with the app's light surface.

#### Scenario: iOS home-screen install

- **WHEN** a user adds the app to their home screen from Safari
- **THEN** it installs with the configured title and icon and launches standalone with the configured status-bar style
