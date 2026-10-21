# Project Overview: Mahjfit Client (app.mahjfit.com)

## 1. Project Purpose and Domain

**Mahjfit** (`bfw-angular-pwa`) is a modern, real-time multiplayer and single-player Mahjong web application and progressive web app (PWA), deployed also to native mobile devices (iOS and Android via Capacitor). The platform implements American Mahjong (following National Mah Jongg League / NMJL rules), featuring:
- Standard 152-tile Mahjong sets (Suits: Bams, Cracks, Dots; Winds: North, South, East, West; Dragons: Red, Green, White/Soap; Flowers; Jokers).
- Real-time multiplayer synchronization via WebSockets and GraphQL subscriptions.
- Fast bot player AI integration with configurable think times and play styles.
- Complete game phases: Charleston passing rounds (Right, Across, Left, optional second round, courtesy pass), regular turns (Pick from wall, Discard), Call/Claim opportunities (Pung, Kong, Quint, Sextet), Joker exchange from exposures, Dead Hand challenges, and Mah Jongg win declarations.
- High-fidelity interactive board rendered in Phaser 4 (WebGL/Canvas) overlaid with reactive Angular 22 controls and HUD elements.
- Comprehensive accessibility, responsive multi-device layouts (Mobile Portrait/Landscape, Tablet Portrait/Landscape, Desktop), native haptics, and localized voice audio playback for tile discards and phase instructions.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose / Responsibilities |
| :--- | :--- | :--- | :--- |
| **Framework** | Angular | `^22.1.1` | Standalone component tree, DI, routing, application lifecycle, reactive state management |
| **Language** | TypeScript | `~6.0.3` | Application logic, strong typing, strict null checks, target `ES2022`, module `preserve` |
| **Game Rendering** | Phaser | `^4.2.0` | 2D/WebGL table surface, tile sprites, drag-and-drop, tween animations, discard grids, audio sprites |
| **Styling** | Tailwind CSS / SCSS | `^4.2.1` | Modern utility classes with mandatory `tw:` prefix; custom SCSS modules and responsive safe-area insets |
| **Component UI** | Angular Material / CDK | `^22.1.1` | Material buttons, progress bars, icons (`material-symbols-rounded`), CDK overlay primitives |
| **Mobile Runtime** | Capacitor | `^8.3.4` | Native iOS and Android runtime wrappers, native haptics, screen orientation, SQLite, push notifications |
| **Realtime & API SDK** | `@bfw/api-sdk` | `file:bfw-api-sdk-1.0.0.tgz` | Internal NestJS backend SDK: GraphQL queries/mutations, WebSockets (`socket.io-client ^4.8.3`), auth tokens |
| **State Management** | Custom SignalState | Workspace Lib | Angular Signals (`signal`, `computed`, `effect`) backed by `@libs/signal-state` (cookie/local/session sync) |
| **Internationalization** | `@jsverse/transloco` | `^8.3.0` | Multi-language translation, localized strings, dynamic module-scoped catalogs |
| **Local Storage / DB** | Drizzle ORM / SQLite | `^0.45.2` / `^0.18.0` | SQLite in browser (WASM/OPFS via SQLocal and sql.js) and native mobile SQLite via Capacitor |
| **Unit Testing** | Vitest | `^4.0.8` (local: `v4.1.11`) | Fast Vite-based unit test runner with JSDOM environment (package manifest specifies `^4.0.8`, local lockfile resolves to `v4.1.11`) |
| **PWA / Service Worker**| Workbox | `^7.4.1` | Service worker generation and offline asset caching |
| **Package Manager** | npm | `10.9.3` | Node package manager (`packageManager` field in `package.json`) |

---

## 3. Repository Directory Structure

```text
/Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com
├── .agents/                      # Agent instruction rules and design system guides
│   ├── AGENTS.md                 # Project-specific AI agent operational rules
│   └── style-typography.md       # Mandatory Mahjfit color palette, typography & UI styling rules
├── android/                      # Native Android project (Capacitor)
├── docs/                         # Project documentation, analysis reports, and phase specifications
│   ├── ai/                       # AI Development Knowledge Base (this directory)
│   └── game-architecture-analysis-report.md # Architectural audit report
├── env/                          # Environment configuration files
│   ├── debug.env.ts              # Local debug environment (DEBUG=true, local endpoints, test tokens)
│   ├── default.env.ts            # Default base environment definitions
│   ├── development.env.ts        # Development environment override
│   ├── env.ts                    # Active environment interface export
│   └── production.env.ts         # Production environment override
├── ios/                          # Native iOS Xcode project (Capacitor)
├── libs/                         # Shared workspace libraries
│   └── src/
│       ├── bfw-api/              # BfwApiService wrapping @bfw/api-sdk
│       ├── breakpoint/           # Responsive viewport breakpoint services
│       ├── conf/                 # ConfService reading application config
│       ├── context-profile/      # User authentication and session profile state
│       ├── foundation/           # Area, module, route, and navigation builder primitives
│       ├── log/                  # LogService structured logging
│       ├── signal-state/         # Custom SignalStateService library (cookie, storage, SQLite persistence)
│       ├── sqlite/               # SQLocal / WASM SQLite drivers
│       └── url/                  # UrlService route path helpers
├── proxy/                        # Angular dev-server proxy configs (debug, development, production)
├── public/                       # Static public assets served by dev-server and packaged in build
│   └── assets/
│       ├── game/tiles/           # Tile sprite texture atlases (1x, 2x, 3x JSON and PNG)
│       ├── icons/                # HUD action icons (Sort, Hint, Deadhand, Help, Settings)
│       └── sounds/               # Sound audio sprites (tiles.json, effects.json) and individual audio files
├── src/                          # Application source code
│   ├── main.ts                   # Angular application entry point (bootstrapApplication)
│   ├── index.html                # Main HTML page shell
│   ├── styles.scss               # Global styles and Material theme integration
│   ├── tailwind.css              # Tailwind CSS v4 entry point with 'tw:' prefix
│   ├── app/                      # Angular root module
│   │   ├── app.component.ts      # Root AppComponent
│   │   ├── app.config.ts         # Application configuration and global providers
│   │   ├── app.routes.ts         # Top-level route delegator to AreaRoute
│   │   ├── app.service.ts        # Startup initialization, handshake, and error handling
│   │   ├── app.state.ts          # Global application state (startup, sessions, offline)
│   │   ├── area/                 # Architectural Area routing boundaries
│   │   │   ├── auth/             # Authentication area (login, MFA, password reset)
│   │   │   ├── open/             # Public/Open area (Home, Game shell, 404, 503)
│   │   │   ├── private/          # Backoffice master admin shell
│   │   │   ├── protected/        # Signed-in user dashboard and settings shell
│   │   │   ├── guard.ts          # Area-level guards (CanMatchAuthenticated, CanMatchUnauthenticated)
│   │   │   └── route.ts          # AreaRoute collector aggregating all area registries
│   │   ├── base/                 # Reusable cross-cutting UI components and services
│   │   │   ├── global-progress-bar/
│   │   │   ├── internationalization/
│   │   │   ├── notify/ / notify-banner/ / snack-bar/
│   │   │   ├── splash-screen/
│   │   │   └── theme/
│   │   └── module/               # Feature modules
│   │       ├── business/
│   │       │   ├── game/         # Mahjong game shell, state, service, Phaser integration
│   │       │   └── home/         # Homepage landing component
│   │       └── shared/           # Onboarding, preboarding, dashboard, geo
│   └── theme/                    # SCSS theme variables, safe-area mixins, breakpoints
├── todo/                         # Task tracking and client feedback (points.txt)
├── tsconfig.json                 # TypeScript compiler configuration and path aliases
└── package.json                  # Dependencies and build scripts
```

---

## 4. Path Aliases (`tsconfig.json`)

The project configures standard path aliases that MUST be used for clean imports:
- `@app/*` -> `./src/app/*`
- `@area/*` -> `./src/app/area/*`
- `@base/*` -> `./src/app/base/*`
- `@module/*` -> `./src/app/module/*`
- `@lang/*` -> `./src/lang/*`
- `@theme/*` -> `./src/theme/*`
- `@libs/*` -> `./libs/src/*`
- `src/*` -> `./src/*`

---

## 5. Major Features Overview

1. **Mahjong Game Engine & Phaser 4 Table (`src/app/module/business/game/`)**
   - High-performance canvas table rendering 4 player seats (Bottom = Human user, Right/Top/Left = Bots or opponents).
   - Tile texture rendering: 1x (`tiles_1x`) and 2x (`tiles_2x`) assets exist, but `GameService.selectTileAtlas` is currently hardcoded to return the 2x atlas unconditionally.
   - Smooth tween animations for tile dealing, Charleston passing, discard flight, claim adoption, and Joker replacement.
   - Discard pile with custom viewport clipping and drag/wheel scrolling.
   - Comprehensive tile voice announcer and sound effects via audio sprites (`tiles.json`, `effects.json`), plus standalone audio (`assets/sounds/joker_exchange.mp3`) for Joker swaps.
2. **Hybrid Angular Overlay UI (`src/app/module/business/game/phaser/`)**
   - HTML/CSS UI overlays rendered directly on top of the Phaser canvas using responsive pixel calculations.
   - Instruction panel overlay providing real-time gameplay prompts (e.g., "Discard a Tile", "Player 1 Called", "Complete exposure then discard").
   - Action buttons (PASS, CALL, PICK TILE, SORT, MAHJONG).
   - Game over modals, winning celebration overlays with meld point breakdown, away notices, and join requests.
3. **Four-Area Modular Routing (`src/app/area/`)**
   - Isolated areas (`auth`, `open`, `private`, `protected`) with dedicated layouts and security guards.
   - Guaranteed catch-all route order preventing 404/503 misrouting.
4. **Reactive State & Realtime Synchronization (`GameState`)**
   - Angular Signals-based state (`_game`, `_play`, `_personal`, `_development`).
   - WebSocket subscriptions (`subscribePlay`, `subscribePersonal`) receiving authoritative game updates from `@bfw/api-sdk`.
5. **Debug & Development Sidebar**
   - Active when `environment.DEBUG === true`.
   - Side panel showing real-time game properties, turn stages, rack tiles, raw payloads, and a single-click "Send debug email" utility.

---

## 6. Essential Development Commands

The repository provides distinct scripts in `package.json` for running the local frontend:

| Command | Underlying Process | Usage Context |
| :--- | :--- | :--- |
| `npm run start.web` | `npm run sync.i18n && ng serve` | Default Angular CLI dev server with default configuration. |
| `npm run dev.web` | `npm run sync.i18n && ng serve --configuration development` | Angular CLI dev server explicitly targeted to the `development` environment configuration. |
| `npm run dev` | `npm run sync.i18n && node server.js` | Express / Node SSR runtime server (runs built bundle; not an interactive hot-reloading dev server). |
| `npm run debug.web` | `npm run sync.i18n && ng serve --watch --configuration debug --hmr --open` | Full debug configuration with Hot Module Replacement and auto-open browser. |

```bash
# Start development Angular CLI dev server
npm run dev.web

# Start default Angular CLI dev server
npm run start.web

# Sync internationalization translation files
npm run sync.i18n

# Run unit tests via Vitest
npm test

# Run tests in specific configuration
npm run debug.test

# Build application for production (includes i18n sync, ng build, workbox SW)
npm run build.prod

# Run mobile sync (Capacitor)
npm run syncrun.ios
npm run syncrun.android
```
