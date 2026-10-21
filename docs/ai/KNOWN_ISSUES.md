# Known Issues & Technical Risks: Mahjfit Client

This document records confirmed defects, technical risks, fragile code paths, test gaps, and unresolved architectural questions discovered during the repository audit.

---

## 1. Confirmed Defects

### DEF-001: Claim Queue Timing Discrepancy Between `const.ts` and Unit Tests
- **Category**: Regression / Test Failure
- **Severity**: Medium
- **Location**:
  - `src/app/module/business/game/phaser/const.ts` (Lines 51–55)
  - `src/app/module/business/game/phaser/claim-queue.spec.ts` (Lines 8–20, 109–116)
- **Description**:
  In `const.ts`, claim animation timings were updated under `/* NEWCODE */` to:
  ```ts
  export const CLAIM_DISCARD_FLIGHT_MS = 320;
  export const CLAIM_RECOGNITION_BEAT_MS = 340;
  export const CLAIM_TRANSFER_FLIGHT_MS = 320;
  ```
  However, `claim-queue.spec.ts` still tests for the older 1st implementation timing targets. Running `npx vitest run src/app/module/business/game/phaser/claim-queue.spec.ts` results in **two distinct test failures** (2 failed, 3 passed):
  
  1. **Failure 1 (Timing Target Assertion)**:
     - Test: `uses the 1st implementation timing targets` (Lines 10–19).
     - Assertion: `expect(CLAIM_DISCARD_FLIGHT_MS).toBe(220)`.
     - Result: Expected `220`, received `320`. Furthermore, total presentation time is `320 + 340 + 320 = 980ms`, which violates the assertion `expect(totalPresentationTime).toBeLessThanOrEqual(900)`.
  
  2. **Failure 2 (Sequential Timer Progression Assertion)**:
     - Test: `processes queued updates sequentially instead of in a single synchronous burst` (Lines 94–117).
     - Cause: The test simulation sets `case 'opponent-discard': stepDelayMs = CLAIM_DISCARD_FLIGHT_MS;` (now `320ms`). At line 110, the test executes `vi.advanceTimersByTime(220);` (hardcoded to the old 220ms delay). Because the actual delay is 320ms, advancing by only 220ms leaves 100ms remaining on the timer, so the next event (`'exposures'`) has not executed yet.
     - Result: `AssertionError: expected ['opponent-pick', 'opponent-discard'] to deeply equal ['opponent-pick', 'opponent-discard', 'exposures']`.

- **Root Cause & Contract Status**:
  The timing constants in `const.ts` were intentionally increased to 320/340/320ms for visual pacing, but `claim-queue.spec.ts` was not updated to match. Either:
  - The unit test is stale and needs its expectations and `advanceTimersByTime` calls updated to match the new 320ms step delays.
  - OR the implementation change in `const.ts` violated an intended product contract (a strict 900ms total claim presentation ceiling).
  Further team consensus is needed before modifying either file. Neither file was modified during this audit.

---

### DEF-002: Dead Hand Declaration Action Missing Backend SDK Implementation
- **Category**: Incomplete Feature / Stub
- **Severity**: Medium
- **Location**:
  - `src/app/module/business/game/state/state.ts` (Lines 1833–1839)
- **Description**:
  The UI provides a Dead Hand button in the HUD and a seat selection dialog (`deadHandSelectionState`), but the underlying action dispatcher `GameState.publishDeclareDead` is an unimplemented stub:
  ```ts
  public async publishDeclareDead(targetSeatId: number): Promise<void> {
      const game_keyid = this.game_keyid();
      if (!game_keyid) return;
      // TODO: Wait for API SDK support for DECLAIRDEAD or use a generic action
      // await this.api.sdk.graphql.ws.gameEngine?.publishAction...
  }
  ```
  Clicking "Confirm" in the Dead Hand dialog does not notify the backend server.
- **Remediation**: Coordinate with backend team to verify whether `@bfw/api-sdk` exports `publishActionDeclareDead` or a generic `publishAction`.

---

### DEF-003: Hardcoded 2x Texture Atlas Selection
- **Category**: Visual Quality / Performance Risk
- **Severity**: Low
- **Location**:
  - `src/app/module/business/game/service.ts` (Lines 172–194)
- **Description**:
  `GameService.selectTileAtlas` unconditionally returns `{ atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" }`. The mobile portrait downsampling branch (`TILE_ATLAS_1X_KEY`) is commented out:
  ```ts
  public selectTileAtlas(tileDisplayWidth = 0): TileAtlasSelection {
      return { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" };
      /* if (this.isMobilePortraitOnly()) { ... } */
  }
  ```
  On low-resolution mobile devices (width < 640px), downscaling dense 2x tile textures can produce aliasing or jagged edges on fine bamboo and character lines.
- **Remediation**: Validate visual fidelity on low-DPI Android/iOS mobile screens and restore the 1x atlas fallback if aliasing is observed.

---

### DEF-004: Ignored `targetRackId` Parameter in `publishMoveTilesToExposurePanel`
- **Category**: Fragile API Contract / Potential Multi-Rack Risk
- **Severity**: Low
- **Location**:
  - `src/app/module/business/game/state/state.ts` (Lines 1765–1786)
  - `src/app/module/business/game/phaser/component.ts` (Line 838)
- **Description**:
  `GameState.publishMoveTilesToExposurePanel(tile_ids: number[], targetRackId: number)` accepts a `targetRackId` parameter, but line 1782 of `state.ts` hardcodes:
  ```ts
  rack_id: this.personal_seat_rack_first_rack_id(),
  ```
  The supplied `targetRackId` argument is completely ignored. `PhaserComponent:838` notes: `// targetRackId isn't actually used in publishMoveTilesToExposurePanel's GraphQL call inside state.ts`.
- **Impact & Risk**: In standard 4-player 1-rack Mahjong, this has no immediate defect since only Rack 1 is used. However, if 2-rack variants (e.g. 2-player mode with 2 racks per player) are activated, exposure actions will mistakenly target Rack 1 even when issued for Rack 2.

---

### DEF-005: Latent Inverted Joker Sorting in Fallback Client Methods
- **Category**: Latent Defect / Unused Code Path
- **Severity**: Low
- **Location**:
  - `src/app/module/business/game/phaser/component.ts` (Lines 255–298, 300–325)
- **Description**:
  Active gameplay hand sorting is performed server-side via `this.gameState.publishOderPersonalRackTiles` and applied via `this.game.events.on("rack:order")`. However, `PhaserComponent` still retains two client-side sorting methods (`sortRackByRank` and `sortRackBySuit`).
  Both methods explicitly place Jokers on the **far left**:
  ```ts
  // Jokers go to the far left
  if (aIsJoker && !bIsJoker) return -1;
  if (!aIsJoker && bIsJoker) return 1;
  ```
  This directly contradicts American Mahjong tournament rules and the client requirements in `todo/points.txt:209-214`, which mandate that Jokers be placed **last (on the far right)**.
- **Impact & Risk**: While currently uninvoked during standard play, if an agent or developer repurposes these client-side helpers as offline fallbacks, it will reintroduce the inverted Joker sorting bug.

---

## 2. Technical Risks & Fragile Code Paths

### RISK-001: Extreme Source File Monoliths
- **Severity**: High
- **Description**: Several core application source files have grown exceptionally large:
  - `src/app/module/business/game/phaser/scenes/scene.ts`: **7,417 lines (265 KB)**
  - `src/app/module/business/game/phaser/layout/ui.ts`: **3,652 lines (118 KB)**
  - `src/app/module/business/game/phaser/component.ts`: **1,992 lines (74 KB)**
  - `src/app/module/business/game/state/state.ts`: **1,841 lines (84 KB)**
- **Impact**:
  - High probability of git merge conflicts.
  - Difficulty in reasoning about state mutations and lifecycle transitions.
  - Slower IDE language server responsiveness and type checking.
- **Mitigation Strategy**: Incrementally decompose files into focused managers (e.g., `PhaserExposureManager`, `PhaserDiscardGridManager`, `GameTurnManager`) using composition, adhering strictly to the `OLDCODE`/`NEWCODE` preservation rule.

---

### RISK-002: Critical Test Coverage Gaps
- **Severity**: High
- **Description**: Only 5 unit test files exist across the entire workspace:
  - `src/app/module/business/game/phaser/claim-queue.spec.ts`
  - `src/app/app.spec.ts`
  - `src/app/base/form-fields/flag/service.spec.ts`
  - `libs/src/browser-cache-storage/service.spec.ts`
  - `libs/src/signal-state/local.db.spec.ts`
- **Impact**: Zero automated unit tests exist for:
  - `GameState` signal derivations (`canDiscard`, `canPickTile`, `charlestonState`).
  - `GameService.assetBaseName` and `resolveTileSoundKey`.
  - Tile sorting algorithms (Suit vs Rank NMJL ordering).
  - Responsive layout metric calculations (`PhaserLayoutGame`).
  - Handshake and session expiration recovery.
- **Mitigation Strategy**: Implement the prioritized test suites detailed in `REGRESSION_TESTS.md`.

---

### RISK-003: Potential Visual Desynchronization During Rapid Socket Bursts
- **Severity**: Medium
- **Location**: `src/app/module/business/game/phaser/scenes/scene.ts`
- **Description**: When playing against fast bots (`BotLevelModeEnum.FAST`), multiple bot picks, discards, and pass turns can arrive across WebSockets in milliseconds. While `PhaserScene` contains a sequential queue with acceleration, long tween chains (such as Charleston passing or discard flights) can occasionally overlap if tweens are not forcefully completed or killed when incoming state jumps forward.
- **Mitigation Strategy**: Ensure every state update checks if an ongoing tween matches the incoming snapshot revision and accelerates or snaps to target if lagging behind.

---

## 3. Unresolved Questions

1. **Mah Jongg Scoring Computation**: Is winning score validation and bonus point calculation computed on the server and returned in `GameStatePlayOutputDto`, or is the client expected to calculate NMJL combinations locally?
2. **PWA Offline Mode Strategy**: `src/app/app.component.ts` comments out `this.registerServiceWorker()`. Should service worker caching be re-enabled for static assets, and if so, how should GraphQL caching be strictly excluded?
3. **Bot Takeover Timeout**: Client notes in `todo/points.txt` specify that a human playing only against bots should never have the computer resume without them, while human-vs-human games should allow 1 minute before bot takeover. Is this timeout enforced by the server or does the client emit a timeout intent?
