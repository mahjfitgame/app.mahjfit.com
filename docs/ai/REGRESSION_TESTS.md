# Regression Testing Strategy & Test Inventory: Mahjfit Client

This document catalogs existing unit test suites in the repository and specifies recommended regression tests mapped to critical system invariants and features.

---

## 1. Existing Test Suites Inventory

Currently, 5 spec files exist in the repository:

| Test File Path | Status | Target Under Test | Coverage & Failure Summary |
| :--- | :--- | :--- | :--- |
| `src/app/module/business/game/phaser/claim-queue.spec.ts` | **EXISTING (2 FAILED, 3 PASSED)** | Sequential claim animation queue & timing targets | Verifies sequential execution, backlog acceleration (<120ms), and queue coalescing.<br>**Observed Failures**: (1) Expects `CLAIM_DISCARD_FLIGHT_MS` = 220ms (received 320ms, total 980ms > 900ms threshold). (2) Sequential timer test advances timers by 220ms instead of 320ms, leaving 100ms on the timer and failing deep equality on processed events.<br>**Status**: Unresolved whether the test is stale or the implementation change in `const.ts` violated an intended 900ms presentation contract. |
| `src/app/app.spec.ts` | **EXISTING (PASSED)** | `AppComponent` bootstrap | Minimal Angular root component smoke test. |
| `src/app/base/form-fields/flag/service.spec.ts` | **EXISTING (PASSED)** | Country flag form field service | Validates flag asset path resolution. |
| `libs/src/browser-cache-storage/service.spec.ts` | **EXISTING (PASSED)** | Browser Cache Storage lib | Verifies cache put, get, and delete operations. |
| `libs/src/signal-state/local.db.spec.ts` | **EXISTING (PASSED)** | SignalState Local DB persistence | Validates SQLite/storage persistence adapter. |

---

## 2. Invariant & Feature Test Mapping

| Invariant / Feature ID | Rule / Feature Summary | Existing Test | Recommended New Test Specification |
| :--- | :--- | :--- | :--- |
| **INV-001** | Server-Authoritative State | None | `game-state-authority.spec.ts`: Mock WS inputs and assert signals update only after payload delivery. |
| **INV-004** | Component Scoping of `GameState` | None | `game-provider-scoping.spec.ts`: Verify consecutive `GameComponent` creations yield fresh instances. |
| **INV-005** | Area Route Wildcard Catch-All | None | `area-route-fallback.spec.ts`: Assert navigation to arbitrary path redirects strictly to `/404`. |
| **INV-006** | Tile Sorting (Suit vs Rank) | None | `tile-sorting.spec.ts`: Feed 14 mixed tiles and assert output matches NMJL ordering. |
| **INV-007** | Sequential Claim Animation Queue | `claim-queue.spec.ts` (2 failing) | Reconcile test expectations with design: either update test delays to 320ms or restore 220/380/240ms in `const.ts`. |
| **INV-008** | Call Reversal Subsystem | None | `call-reversal.spec.ts`: Verify `publishReverseCallTile` emits only when zero rack tiles are committed. |
| **INV-010** | Tile Atlas Texture Resolution | None | `tile-texture-resolution.spec.ts`: Test `GameService.assetBaseName` and `resolve` for all 152 tile variants. |
| **INV-011** | Sound Announcer Throttling | None | `sound-throttling.spec.ts`: Assert rapid discard sound requests throttle by >= 80ms. |
| **INV-012** | Safe-Area Responsive Calculation | None | `layout-responsive.spec.ts`: Test `PhaserLayoutGame.compute` across phone, tablet, and desktop viewports. |
| **INV-013** | Teardown and Cleanup | None | `phaser-lifecycle-teardown.spec.ts` [PROPOSED]: Assert `destroyRef.onDestroy` tears down Phaser, observers, and sound. |
| **INV-015** | Debug Environment Insulation | None | `debug-insulation.spec.ts`: Assert debug signals and DOM elements return null/hidden when `DEBUG=false`. |

---

## 3. High-Priority Recommended Test Suites to Implement

### TEST-SUITE-1: `tile-sorting.spec.ts` [PROPOSED] (Target: `INV-006`, `FEAT-012`)
- **Objective**: Ensure player hand sorting strictly complies with NMJL rules.
- **Test Cases**:
  1. **Sort by Suit**:
     - Given a hand containing: Joker 1, 3-Bam, 1-Crack, Flower 2, Green Dragon, 9-Dot, North Wind, 2-Bam, Red Dragon, East Wind, White Dragon.
     - Expected sequence: `Flower 2`, `2-Bam`, `3-Bam`, `9-Dot`, `1-Crack`, `Green Dragon`, `Red Dragon`, `White Dragon`, `East Wind`, `North Wind`, `Joker 1`.
  2. **Sort by Rank**:
     - Flowers first, matching rank numbers grouped (1s from Bam/Dot/Crack, then 2s, etc.), followed by Dragons, Winds, and Jokers.
  3. **Duplicate Tiles**:
     - Correctly groups identical tiles adjacently.

---

### TEST-SUITE-2: `tile-texture-resolution.spec.ts` [PROPOSED] (Target: `INV-010`, `GameService`)
- **Objective**: Verify that every tile category, type, and rank maps to an existing atlas frame without throwing errors or returning empty strings.
- **Test Cases**:
  1. Suits (Bam 1-9, Crack 1-9, Dot 1-9) -> `bam_1.png` to `bam_9.png`, `char_1.png` to `char_9.png`, `dot_1.png` to `dot_9.png`.
  2. Winds -> `wind_e.png`, `wind_s.png`, `wind_w.png`, `wind_n.png`.
  3. Dragons -> `dragon_green.png`, `dragon_red.png`, `dragon_white.png`.
  4. Flowers -> `flower_1.png` to `flower_8.png`.
  5. Jokers -> `joker_1.png` to `joker_8.png`.
  6. Invalid or null tile -> Returns fallback empty string `""` without crashing.

---

### TEST-SUITE-3: `game-state-signals.spec.ts` [PROPOSED] (Target: `INV-001`, `FEAT-004`, `FEAT-005`, `FEAT-006`)
- **Objective**: Verify computed signals derived from raw WebSocket payloads.
- **Test Cases**:
  1. `canDiscard`:
     - Returns `true` when `play.current_turn_seat_id === personal.seat_id` and `play.turn_stage === DISCARD`.
     - Returns `false` when it is an opponent's turn.
  2. `canPickTile`:
     - Returns `true` when personal turn and `play.turn_stage === PICK`.
  3. `charlestonState`:
     - Correctly reflects round (1 vs 2) and direction (`RIGHT`, `ACROSS`, `LEFT`).
  4. `active_claim`:
     - Emits active claim tile when server provides `play.claim` with deadline.

---

### TEST-SUITE-4: `responsive-layout.spec.ts` [PROPOSED] (Target: `INV-012`, `FEAT-016`)
- **Objective**: Verify table coordinates and safe-area margins across all 5 device modes.
- **Test Cases**:
  1. Phone Portrait (`width: 390, height: 844`, safe-area bottom: 34):
     - Resolves `phone-portrait` layout mode.
     - Bottom rack Y position avoids the 34px bottom inset.
  2. Tablet Landscape (`width: 1194, height: 834`):
     - Resolves `tablet-landscape` mode with enlarged tile sizes.
  3. Desktop (`width: 1920, height: 1080`):
     - Resolves `desktop` mode with maximum tile width (76px).

---

### TEST-SUITE-5: `phaser-lifecycle-teardown.spec.ts` [PROPOSED] (Target: `INV-013`)
- **Objective**: Prevent WebGL context leaks, zombie audio sprites, and hanging timers during component unmounting.
- **Test Cases**:
  1. **Clean Canvas Disposal**:
     - When `PhaserComponent` unmounts, assert `phaser.destroy(true)` is invoked with `removeCanvas: true`.
  2. **Listener & Observer Detachment**:
     - Assert `ResizeObserver.disconnect()` is called and `window.removeEventListener("orientationchange", ...)` is unregistered.
  3. **Audio Teardown**:
     - Assert `PhaserSound.destroy()` stops all active audio sprites and releases Web Audio references.
  4. **Timer Cleanup**:
     - Assert all refresh and popup timers (`safeAreaRefreshTimer`, `debugViewportRefreshTimer`, `joinTablePopupTimer`, `mahjongWinPopupTimer`) are cleared.

---

## 4. How to Execute Tests

```bash
# Run all Vitest unit tests
npm test

# Run tests in watch mode during development
npx vitest

# Run only the claim-queue test
export PATH="/usr/local/bin:$PATH" && npx vitest run src/app/module/business/game/phaser/claim-queue.spec.ts
```
