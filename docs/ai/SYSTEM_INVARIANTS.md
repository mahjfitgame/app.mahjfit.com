# System Invariants: Mahjfit Client

This document defines the verified and inferred system invariants for the Mahjfit web and mobile application. Every future code modification, bug fix, or refactor MUST uphold these invariants to prevent regressions.

---

## 1. Architecture & Security Invariants

### INV-001: Server-Authoritative Gameplay State
- **Rule**: All authoritative gameplay decisions (turn assignment, legal actions, tile draws, discards, valid claims, joker exchanges, scoring, and dead hand rulings) are governed exclusively by the backend NestJS server.
- **Why It Matters**: Prevents client-side game state desynchronization, cheating, and split-brain states where two players observe conflicting boards.
- **Relevant Sources**:
  - `src/app/module/business/game/state/state.ts` (`subscribePlay`, `subscribePersonal`, `publishDiscardTile`, etc.)
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `docs/game-architecture-analysis-report.md` (Lines 13, 27)
- **Evidence**: `GameState` sends intents via WebSocket (`publishActionDiscardTile`, `publishActionClaimTile`) and awaits incoming `subscribePlay`/`subscribePersonal` payloads before updating `_play` and `_personal` signals.
- **Verification Method**: Inspect network WebSocket messages. Verify that no local state mutations confirm a discard or claim prior to receiving server confirmation.
- **Confidence Status**: **VERIFIED**

---

### INV-002: Preservation of Existing Code with `OLDCODE` / `NEWCODE`
- **Rule**: Existing source code must not be deleted or reformatted away during modifications. Replaced code must be commented out and marked with `OLDCODE`; replacement code must be marked with `NEWCODE`.
- **Why It Matters**: Preserves developer intent, maintains explicit revision history in-place, and allows immediate rollback without git excavation.
- **Relevant Sources**:
  - `.agents/AGENTS.md` (Line 2)
  - `src/app/module/business/game/service.ts` (Lines 95, 125)
  - `src/app/module/business/game/phaser/scenes/scene.ts` (Lines 3, 29, 337, 491, 502)
  - `src/app/module/business/game/phaser/template.html` (Lines 36, 51)
- **Evidence**: Codebase widespread usage of `/* OLDCODE ... OLDCODE */` paired with `/* NEWCODE */ ... /* NEWCODE */`.
- **Verification Method**: `git diff` review before finalizing changes. Ensure zero net line deletions of functional code without corresponding `OLDCODE` wrappers.
- **Confidence Status**: **VERIFIED**

---

### INV-003: Confidentiality of `todo/Frontend Development.txt`
- **Rule**: AI agents must never read, parse, follow, or alter the file `todo/Frontend Development.txt`.
- **Why It Matters**: This document contains private personal developer notes, scratch work, and unstructured musings not intended for automated consumption.
- **Relevant Sources**:
  - `.agents/AGENTS.md` (Line 1)
- **Evidence**: Explicit instruction in user rules.
- **Verification Method**: Verify agent tool logs to ensure `todo/Frontend Development.txt` was never accessed.
- **Confidence Status**: **VERIFIED**

---

### INV-004: Component Scoping of `GameState` and `GameService`
- **Rule**: `GameState`, `GameService`, `GameRoute`, and `GameHeptic` must remain scoped to `GameComponent` via `GAME_PROVIDER` and must never be registered as root singletons (`providedIn: 'root'`).
- **Why It Matters**: Guarantees that entering a new game session destroys the previous session, cleans up WebSocket subscriptions, and creates an unpolluted state context.
- **Relevant Sources**:
  - `src/app/module/business/game/provider.ts` (`GAME_PROVIDER`)
  - `src/app/module/business/game/component.ts` (Line 26)
  - `src/app/module/business/game/state/state.ts` (`@Service({ autoProvided: false })`)
- **Evidence**: Explicit decorator `@Service({ autoProvided: false })` on `GameState` and `GameService`.
- **Verification Method**: Unit test verifying that consecutive mountings of `GameComponent` yield distinct instances of `GameState`.
- **Confidence Status**: **VERIFIED**

---

### INV-005: Four-Area Route Partitioning and 404/503 Isolation
- **Rule**: All application routes must be registered under one of four Area registries (`AuthAreaRegistry`, `OpenAreaRegistry`, `PrivateAreaRegistry`, `ProtectedAreaRegistry`). The catch-all `**` route MUST be owned at the root level of `AreaRoute` and point to `HttpStatusNotFoundRoute`.
- **Why It Matters**: Prevents rogue modules from placing wildcards early in the route tree, which previously broke access to `/503` maintenance screens.
- **Relevant Sources**:
  - `src/app/area/route.ts` (Lines 21-27, 50-58)
  - `src/app/area/open/registry.ts`
- **Evidence**: Explicit comment in `src/app/area/route.ts`: "OWNED HERE, so no module can ever place a route after it. A module contributing '**' mid array is what made /503 unreachable on 2026-08-16".
- **Verification Method**: Run Angular router navigation tests to non-existent paths, ensuring resolution to `/404`.
- **Confidence Status**: **VERIFIED**

---

## 2. Gameplay & State Invariants

### INV-006: American Mahjong Tile Sorting Determinism
- **Rule**: The bottom player rack tiles must support two sorting modes (Suit and Rank). The canonical sorting order from left to right per NMJL rules is:
  1. Flowers (`flower_1` to `flower_8`)
  2. Numbers: Bams (1-9), Dots (1-9), Cracks (1-9)
  3. Dragons: Green (`dragon_green`), Red (`dragon_red`), White/Soap (`dragon_white`)
  4. Winds: East, South, West, North (or N, S, E, W per NMJL card)
  5. Jokers (`joker_1` to `joker_8`)
- **Active Runtime Sorting vs. Client Fallback Discrepancy**:
  - *Active Runtime Ordering (VERIFIED)*: In active gameplay, clicking the HUD Sort button invokes `TableSceneCallbacks.onSortTiles(mode)`, which dispatches `GameState.publishOderPersonalRackTiles(sortBy)`. The backend game engine computes the sorted tile order and pushes `hand_order` over WebSocket. The reactive effect in `PhaserComponent` emits `this.phaser.events.emit("rack:order", order)`, which `PhaserScene` reconciles into `this.rackOrder` and animates via `layoutRackTiles(true)`. The server is the sole authority for active runtime order (`INV-001`).
  - *Client Fallback Methods (INFERRED UNUSED)*: `PhaserComponent.sortRackByRank` and `sortRackBySuit` (lines 255-336) contain client-side sorting logic that explicitly places Jokers at the front/far-left (`if (aType === 'joker') return -1`), directly contradicting `todo/points.txt:209` (Jokers last). However, source search confirms these client methods are only called by `onAutoSortClicked()`, which is unreferenced across all templates, styles, and event bindings. Therefore, this discrepancy does not affect current runtime gameplay, but remains a latent trap if client-side fallback sorting is ever reconnected.
- **Why It Matters**: Tournament rule compliance and user expectations; prevents suits or dragons from scattering randomly across the rack.
- **Relevant Sources**:
  - `todo/points.txt` (Lines 205-214)
  - `src/app/module/business/game/state/state.ts` (`publishOderPersonalRackTiles`)
  - `src/app/module/business/game/phaser/component.ts` (Lines 255-348, 865)
  - `src/app/module/business/game/phaser/scenes/scene.ts` (Lines 457-482)
- **Confidence Status**: **VERIFIED** (Active server-driven sort) / **INFERRED UNUSED** (Client fallback method discrepancy).

---

### INV-007: Sequential Claim & Discard Presentation Queue
- **Rule**: Rapid incoming game events (opponent pick, discard, claim, exposure change) must be queued and animated sequentially rather than executed in a single synchronous burst. When the queue backlogs (> 2 items), delays accelerate to prevent UI lag.
- **Why It Matters**: Players must visually recognize discarded tiles and understand who claimed what before the board shifts to the next turn.
- **Relevant Sources**:
  - `src/app/module/business/game/phaser/claim-queue.spec.ts`
  - `src/app/module/business/game/phaser/const.ts` (`CLAIM_DISCARD_FLIGHT_MS`, `CLAIM_RECOGNITION_BEAT_MS`, `CLAIM_TRANSFER_FLIGHT_MS`)
  - `src/app/module/business/game/phaser/scenes/scene.ts`
- **Evidence**: Working unit test suite in `claim-queue.spec.ts`.
- **Verification Method**: Run `npm test` verifying `claim-queue.spec.ts`. Note: Ensure timing constant discrepancies between `const.ts` and spec are resolved without breaking tests.
- **Confidence Status**: **VERIFIED**

---

### INV-008: Call Reversal Permitted Only Before Exposure Commitment
- **Rule**: A human player who calls a discarded tile may change their mind and reverse the call (returning the tile to the table) ONLY if they have not yet committed any tiles from their rack to the exposure tray. Once reversed, the player's turn ends immediately.
- **Why It Matters**: Standard NMJL rule governing claim retraction.
- **Relevant Sources**:
  - `todo/points.txt` (Lines 21-25, 90-94)
  - `src/app/module/business/game/state/state.ts` (`publishReverseCallTile`)
  - `src/app/module/business/game/phaser/scenes/scene.ts`
- **Evidence**: Client specification in `todo/points.txt`: "If I call for an exposure, I can change my mind as long as I don’t add any of my tiles to the rack. If I change my mind, once I return that tile back to the board, my turn is over and it moves to the next player’s turn."
- **Verification Method**: Test `publishReverseCallTile` trigger condition in `PhaserScene` and `GameState`.
- **Confidence Status**: **VERIFIED**

---

### INV-009: Rack Capacity and Opponent Orientation Correctness
- **Rule**: All 4 player racks must accommodate up to 14 tiles. Opponent tiles on the top rack (Player 3) must be upright and readable from the table perspective; exposure melds on all racks must maintain identical tile sizing.
- **Why It Matters**: Visual consistency across seats; prevents upside-down tile rendering on the top rack.
- **Relevant Sources**:
  - `todo/points.txt` (Lines 58-63)
  - `src/app/module/business/game/phaser/layout/game.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
- **Evidence**: `todo/points.txt`: "1] For consistency, all the exposed tiles on the racks should be the same size. 2] All racks should be able to show 14 tiles. 3] Player3 tiles are upside-down on their rack."
- **Verification Method**: Visual verification in browser subagent across all 4 seats.
- **Confidence Status**: **VERIFIED**

---

## 3. Rendering, Animation & Audio Invariants

### INV-010: Tile Texture Atlas Selection and Aspect Ratio
- **Rule**: Tiles must preserve the constant aspect ratio of `1.43` (`GAME_TABLE_CONFIG.rack.tileAspect`). Texture atlas loading uses packed spritesheets (`public/assets/game/tiles/`).
- **Atlas Selection Reality & Inactive Dynamic Branch**:
  - While both 1x (`TILE_ATLAS_1X_KEY` = `tiles_1x`) and 2x (`TILE_ATLAS_2X_KEY` = `tiles_2x`) assets exist on disk in `public/assets/game/tiles/`, `GameService.selectTileAtlas` unconditionally returns `{ atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" }` (line 182).
  - The dynamic resolution branch (selecting 1x for mobile portrait or low-DPI displays) is commented out in code. The application currently operates exclusively against the 2x atlas.
- **Why It Matters**: Prevents distorted or stretched tile faces; eliminates blurriness or downsampling aliasing on Retina displays.
- **Relevant Sources**:
  - `src/app/module/business/game/const.ts` (`TILE_ATLAS_1X_KEY`, `TILE_ATLAS_2X_KEY`)
  - `src/app/module/business/game/service.ts` (`selectTileAtlas`, line 182)
  - `src/app/module/business/game/phaser/const.ts` (`GAME_TABLE_CONFIG.rack.tileAspect`)
  - `public/assets/game/tiles/`
- **Evidence**: Inspected source code in `service.ts:182` confirming hardcoded 2x return and commented-out 1x conditional logic.
- **Verification Method**: Verify tile dimensions in Phaser scene: `height = width * 1.43`.
- **Confidence Status**: **VERIFIED** (Aspect ratio constraint & static 2x atlas usage) / **INFERRED INACTIVE** (Dynamic 1x selection branch).

---

### INV-011: Audio Sprite Pooling & Throttling
- **Rule**: Sound effects and tile discard speech voices must be dispatched via `PhaserSound` using the `tiles` and `effects` audio sprites. Rapid consecutive tile voices must be throttled by at least 80ms; UI sfx must be throttled by at least 35ms.
- **Why It Matters**: Prevents browser audio clipping, buffer overflow, and distorted sound playback during fast automated turns or bot discards.
- **Relevant Sources**:
  - `src/app/module/business/game/phaser/sound.ts` (Lines 18-30, 58-60)
  - `public/assets/sounds/tiles.json`, `public/assets/sounds/effects.json`
- **Evidence**: `PhaserSound.sfxConfig` and `playTileDiscardVoice` explicitly enforcing `throttleMs` checks against `scene.time.now`.
- **Verification Method**: Trigger rapid discard events and verify via audio listener that no overlapping voice instances stutter.
- **Confidence Status**: **VERIFIED**

---

### INV-012: Safe-Area Inset Isolation on Native & Mobile Devices
- **Rule**: All table bounds and HTML overlay positions must respect hardware safe-area insets (`top`, `bottom`, `left`, `right`) measured from `#safeAreaProbe`.
- **Why It Matters**: Prevents the bottom rack, username, mobile action drawers, and header logos from being obscured by iPhone camera notches, Dynamic Islands, or Android navigation bars.
- **Relevant Sources**:
  - `src/app/module/business/game/phaser/component.ts` (`readSafeAreaInsets`)
  - `src/app/module/business/game/phaser/template.html` (`#safeAreaProbe`)
  - `src/app/module/business/game/phaser/layout/game.ts`
  - `src/theme/_safe-area.scss`
- **Evidence**: Explicit `#safeAreaProbe` DOM element read via `getComputedStyle()` and passed into `PhaserLayoutGame.compute()`.
- **Verification Method**: Test on simulated iPhone 15 Pro viewport with notch insets.
- **Confidence Status**: **VERIFIED**

---

## 4. Performance & Reliability Invariants

### INV-013: Deterministic Cleanup of Phaser, Timers, and Listeners
- **Rule**: When `PhaserComponent` is destroyed, all DOM resize observers, orientation event listeners, window timers, and the `Phaser.Game` instance (`destroy(true)`) MUST be dismantled cleanly.
- **Why It Matters**: Prevents WebGL context leaks (which cause browsers to drop canvas rendering after 8-16 context creations), memory leaks, and phantom audio playback.
- **Relevant Sources**:
  - `src/app/module/business/game/phaser/component.ts` (Lines 980-992)
  - `src/app/module/business/game/phaser/scenes/scene.ts` (Lines 565-596)
- **Evidence**: Implementation in `destroyRef.onDestroy` and `Phaser.Scenes.Events.SHUTDOWN`.
- **Verification Method**: Repeatedly navigate between `/home` and `/game/:gkeyid` 20 times in browser while monitoring WebGL context count in Chrome DevTools.
- **Confidence Status**: **VERIFIED**

---

### INV-014: Tailwind CSS Class Prefixing (`tw:`)
- **Rule**: All Tailwind CSS classes used in templates and SCSS files MUST be prefixed with `tw:` (e.g. `tw:flex`, `tw:absolute`, `tw:text-sm`).
- **Why It Matters**: Prevents class name collisions with Angular Material and existing legacy CSS utility classes.
- **Relevant Sources**:
  - `src/tailwind.css` (`@import "tailwindcss" prefix(tw);`)
  - `.agents/style-typography.md`
- **Evidence**: Tailwind v4 configuration file `src/tailwind.css`.
- **Verification Method**: Grep search in `src/app` for unprefixed Tailwind utility classes.
- **Confidence Status**: **VERIFIED**

---

### INV-015: Debug Environment Insulation
- **Rule**: Debug tools (debug sidebar, development raw payloads containing full private seat hands, and debug email utilities) must be strictly gated behind `environment.DEBUG === true`.
- **Why It Matters**: Prevents cheating, data leakage of opponent hands in production, and visual clutter for real users.
- **Relevant Sources**:
  - `src/app/module/business/game/component.ts` (Lines 38, 40, 46)
  - `src/app/module/business/game/template.html` (Lines 18, 207)
  - `src/app/module/business/game/state/state.ts` (Lines 155, 161, 172)
- **Evidence**: `isDebugEnvironment = environment.DEBUG === true` gating both template rendering and `GameState` payload processing.
- **Verification Method**: Build with `npm run build.prod` and verify that the debug toggle button is absent from the DOM.
- **Confidence Status**: **VERIFIED**
