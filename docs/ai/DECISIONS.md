# Architectural Decisions Record: Mahjfit Client

This document records the architectural and design decisions established from existing codebase documentation, comments, commit history, and verified implementation evidence.

---

### DEC-001: Hybrid Phaser 4 Canvas + Angular HTML Overlays
- **Decision**: Render table graphics, tiles, wood textures, discard containers, and animations inside a Phaser 4 WebGL/Canvas canvas, while rendering interactive HUD controls, instruction panels, claim buttons, modals, and debug tools as Angular HTML/CSS overlays positioned absolutely above the canvas.
- **Date / Origin**: Inception / Core application architecture.
- **Evidence**:
  - `src/app/module/business/game/phaser/component.ts` (Instantiates `Phaser.Game` inside `#host`).
  - `src/app/module/business/game/phaser/template.html` (Embeds `#host` canvas followed by `@if` HTML overlay elements).
  - `src/app/module/business/game/phaser/layout/ui.ts` (Calculates absolute pixel bounding boxes passed to Angular signals).
- **Rationale**: Phaser provides fast, hardware-accelerated 2D tile manipulation, sprite batching, and tweening. Angular HTML overlays provide crisp vector typography, accessibility, standard browser input handling, and seamless integration with Angular Signals without requiring complex canvas text rendering or font rasterization.
- **Status**: **ACTIVE**

---

### DEC-002: Server-Authoritative State Synchronization via WebSockets
- **Decision**: The backend NestJS server owns all game state transitions. The client never locally mutates or commits gameplay facts (discards, turns, picks, claims). The client emits intents via WebSocket (`publishAction*`) and updates its reactive state only upon receiving verified server broadcast frames (`subscribePlay`, `subscribePersonal`).
- **Date / Origin**: 2026 Architectural review.
- **Evidence**:
  - `docs/game-architecture-analysis-report.md` (Decision table: "Game truth: The server is authoritative for turn, tiles, wall, claims, passes, scores, and legal actions. Phaser: Renderer + input-intent emitter only.")
  - `src/app/module/business/game/state/state.ts` (Methods `publishDiscardTile`, `publishPickTile`, `publishClaimAction` send actions to `api.sdk.graphql.ws` without locally mutating `_play` or `_personal`).
- **Rationale**: Eliminates cheating, client desynchronization, and split-brain states across multiplayer participants.
- **Status**: **ACTIVE**

---

### DEC-003: Component-Scoped Game Services via `GAME_PROVIDER`
- **Decision**: Scope `GameState`, `GameService`, `GameHeptic`, and `GameRoute` to `GameComponent` via `GAME_PROVIDER` rather than root singletons (`providedIn: 'root'`).
- **Date / Origin**: Initial game modularization.
- **Evidence**:
  - `src/app/module/business/game/provider.ts` (`GAME_PROVIDER = [GameRoute, GameState, GameHeptic, GameService]`).
  - `src/app/module/business/game/component.ts` (Line 26: `providers: [GAME_PROVIDER]`).
  - `src/app/module/business/game/state/state.ts` (`@Service({ autoProvided: false })`).
- **Rationale**: Ensures complete state isolation between game instances. When a user exits to `/home` or starts a new game, the entire state tree, timers, and WebSocket listeners are torn down and garbage-collected.
- **Status**: **ACTIVE**

---

### DEC-004: Strict Code Preservation Policy (`OLDCODE` / `NEWCODE`)
- **Decision**: When altering existing logic or styles, developers and AI agents must NOT delete existing code. Instead, previous code must be commented out and labeled with `OLDCODE`, while replacement code is tagged with `NEWCODE`.
- **Date / Origin**: Workspace rules (`.agents/AGENTS.md`).
- **Evidence**:
  - `.agents/AGENTS.md` (Line 2: "Do not remove the existing code just comment out the code and add comment 'OLDCODE', and with the new code add the comment 'NEWCODE'").
  - Ubiquitous instances throughout `service.ts`, `scene.ts`, `template.html`, and `ui.ts`.
- **Rationale**: Allows rapid comparison, instant rollback during pair-programming, and transparent audit trails in active working files.
- **Status**: **ACTIVE & MANDATORY**

---

### DEC-005: Four-Area Modular Architecture & Route Segregation
- **Decision**: Isolate top-level application concerns into four distinct Area Registries (`AuthAreaRegistry`, `OpenAreaRegistry`, `PrivateAreaRegistry`, `ProtectedAreaRegistry`). Own the catch-all `**` wildcard route strictly at the root level of `AreaRoute` pointing to `HttpStatusNotFoundRoute`.
- **Date / Origin**: 2026-08-16 fix documented in `src/app/area/route.ts`.
- **Evidence**:
  - `src/app/area/route.ts` (Lines 50-56: "OWNED HERE, so no module can ever place a route after it. A module contributing '**' mid array is what made /503 unreachable on 2026-08-16").
- **Rationale**: Guarantees deterministic route evaluation and prevents individual feature modules from preempting critical fallback routes.
- **Status**: **ACTIVE**

---

### DEC-006: Tailwind CSS v4 with Global `tw:` Prefix
- **Decision**: Adopt Tailwind CSS v4 using the `@import "tailwindcss" prefix(tw);` directive, requiring all Tailwind utility classes to bear the `tw:` prefix.
- **Date / Origin**: Frontend styling migration.
- **Evidence**:
  - `src/tailwind.css` (Line 12: `@import "tailwindcss" prefix(tw);`).
  - `.agents/style-typography.md` (Mandatory design system rules).
- **Rationale**: Prevents name collisions between Tailwind utility classes and Angular Material classes, legacy CSS components, or Phaser style tokens.
- **Status**: **ACTIVE & MANDATORY**

---

### DEC-007: Pre-Packed Texture Atlases (1x and 2x) for Sharp Rendering
- **Decision**: Pack all 152 Mahjong tile textures into sprite atlases (`tiles_1x` and `tiles_2x`) and select the appropriate resolution dynamically based on device display width and pixel ratio.
- **Date / Origin**: Asset pipeline optimization.
- **Evidence**:
  - `src/app/module/business/game/const.ts` (`TILE_ATLAS_1X_KEY`, `TILE_ATLAS_2X_KEY`).
  - `src/app/module/business/game/service.ts` (`selectTileAtlas`).
  - `public/assets/game/tiles/1x/` and `public/assets/game/tiles/2xnew/`.
- **Rationale**: Reduces hundreds of individual HTTP texture requests to two cached atlas files. Provides crisp tile iconography on Retina mobile and tablet screens while conserving GPU memory on low-power mobile devices.
- **Status**: **ACTIVE**

---

### DEC-008: Audio Sprites for Low-Latency Sound Playback
- **Decision**: Bundle tile announcement speech and UI sound effects into audio sprites (`tiles.json` / `effects.json`) with WebM and MP3 formats, managed by `PhaserSound`.
- **Date / Origin**: Audio performance optimization.
- **Evidence**:
  - `src/app/module/business/game/phaser/sound.ts` (`audioSprite('tiles')`, `audioSprite('effects')`).
  - `public/assets/sounds/tiles.json`, `effects.json`.
- **Rationale**: Prevents mobile audio latency, eliminates audio playback limits on iOS WebViews, and ensures immediate feedback when tiles are discarded or picked.
- **Status**: **ACTIVE**

---

### DEC-009: Vitest as Application Unit Test Framework
- **Decision**: Use Vitest (`vitest: ^4.0.8`) with JSDOM as the primary unit test runner instead of Karma / Jasmine.
- **Date / Origin**: Modernization of Angular build and test pipeline.
- **Evidence**:
  - `package.json` (`"test": "npm run sync.i18n && ng test"` with `vitest` in `devDependencies`).
  - `src/app/module/business/game/phaser/claim-queue.spec.ts` (Imports `describe, it, expect, vi` from `vitest`).
- **Rationale**: Dramatically faster execution, instantaneous watch mode, modern ESM support, and compatibility with modern Node environments.
- **Status**: **ACTIVE**

---

### DEC-010: Debug Sidebar Panel & Raw Payload Diagnostic Tool
- **Decision**: Implement a collapsible developer debug sidebar directly in the game shell when `environment.DEBUG === true`, exposing live signals, server revisions, raw payloads, and a single-click email reporter.
- **Date / Origin**: Commit `f4f24ec: Added new development tab in the debug panel to trace the proper state`.
- **Evidence**:
  - Git commit `f4f24ec`.
  - `src/app/module/business/game/component.ts` (`isDebugEnvironment`, `toggleDebug`, `sendDebugEmail`).
  - `src/app/module/business/game/template.html` (`<aside class="debug-panel">`).
  - `src/app/module/business/game/state/state.ts` (`captureDevelopmentPayload`, `development_with_actual_tiles`).
- **Rationale**: Provides immediate diagnosis of state desynchronization during QA and bot simulation without requiring attached IDE debuggers or invasive console logging.
- **Status**: **ACTIVE**
