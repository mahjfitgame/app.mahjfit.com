# AI Agent Development Work Log: Mahjfit Client

This log records verified development tasks, bug fixes, refactorings, and architectural audits conducted by AI agents on this repository.

---

## [2026-10-28] Post-Charleston Tile Overlap & Exposure Isolation Fix

- **Agent**: Antigravity
- **Task**: Fix tiles overlapping each other on the rack after discarding the first tile or declaring exposures (e.g. 1 Crak overlapping 3 Dot, exposed 1 Craks overlapping rack tiles).
- **Root Causes**:
  - `setTablePhase()` blindly set `zone = "rack"` and made visible all tiles with `zone === "pass"`, including tiles that were passed away to opponents during Charleston.
  - `reconcileRackTiles()` checked `zone !== "rack"` and restored exposed tiles back onto the rack because `isTileInAnyExposure()` only checked confirmed server melds, not pending local builds (`activeExposureBuildTileIds`).
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `setTablePhase()`: Destroys sprites of tiles that were passed away (`!validRackIds.has(id)`), only reviving kept tiles.
    - Updated `reconcileRackTiles()`: Explicitly skips tiles in active exposure or pending exposure builds (`isExposed || existingRuntime.zone === "exposure"`), preventing exposed tiles from being pulled back onto the rack.
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed.
  - No existing code deleted.
  - TypeScript compilation check (`tsc --noEmit`) verified with 0 errors.

---

## [2026-10-28] Charleston Courtesy Pass & Post-Charleston Rack Tile Gap Fix

- **Agent**: Antigravity
- **Task**: Fix empty gap(s) on the bottom seat rack occurring during the Charleston Courtesy Pass and after all Charleston rounds complete into the "Discard a tile" phase.
- **Root Causes**:
  - Tiles staged for passing had `zone = "pass"`, `visible = false`, and `scaleX = 0`.
  - When the server confirmed these tiles in the player's hand, `reconcileRackTiles()` only revived tiles with `zone === "exposure"`, skipping tiles with `zone === "pass"`.
  - `layoutRackTiles()` skipped any runtime with `zone === "pass"`, while placing subsequent tiles according to `this.rackOrder`, resulting in physical 1-tile gaps.
  - `setTablePhase()` did not restore lingering pass-zone tiles when leaving `PASSING` into `PLAYING`.
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `reconcileRackTiles()`: Unconditionally resets `zone = "rack"`, kills tweens, resets `scale = 1`, `visible = true`, and `interactive = true` for all server-confirmed rack tiles.
    - Updated `setTablePhase()`: When leaving `PASSING`, restores any lingering pass tiles back to rack zone and calls `layoutRackTiles(true)`.
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed across all changes.
  - No existing code deleted.
  - Simple syntax and concise English comments (max 2-3 lines).
  - TypeScript compilation check (`tsc --noEmit`) verified with 0 errors.

---

## [2026-10-28] Charleston Courtesy Pass Rack Tile Sync & Redirection Fix

- **Agent**: Antigravity
- **Task**: Fix 2 missing tiles on the Phaser rack after Charleston Courtesy Pass across with 2 tiles. Ensure the rack tile order strictly follows the order received from the server API response.
- **Root Causes**:
  - `rack:order` listener ignored incoming server order updates due to strict `shouldApply` gating (`!hasAppliedInitialRackOrder || isExplicitSortRequested`).
  - `newRackOrder` dropped newly received tiles because it strictly filtered `this.rackOrder.includes(id)`.
  - In `commitBotPassVisualTilesToRacks`, `3 - passWaitingTileIds.length` redirected 1 tile away from the bottom rack on a 2-tile pass because courtesy pass does not steal or redirect tiles.
  - `animateBotTransferToWaitingArea` hardcoded 3 tile transfers instead of matching the courtesy pass tile count.
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `rack:order` event listener to apply when `isServerOrderChanged`, taking all valid rack tiles from server `order`.
    - Updated `reconcileRackTiles` to include newly arrived tiles into `rackOrder` and synchronize `this.rackOrder` with incoming API tiles.
    - Updated `animateBotTransferToWaitingArea` to use `count = isCourtesy ? this.passWaitingTileIds.length : 3`.
    - Updated `commitBotPassVisualTilesToRacks` to use `bottomTilesToRedirect = isCourtesy ? 0 : 3 - this.passWaitingTileIds.length`.
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed across all changes.
  - No existing code deleted.
  - Simple syntax and concise English comments (max 2-3 lines).
  - TypeScript compilation check (`tsc --noEmit`) verified with 0 errors.

---

## [2026-10-21] Mahjong Button Click Error Feedback & Error Sound

- **Agent**: Antigravity
- **Task**: Upgrade Mahjong button click event to handle failed Mahjong declaration (when not a winning hand / no response) by disabling during evaluation, shaking/wiggling the button upon failure to indicate completion and re-enabling, and playing `public/assets/sounds/error_01.wav` directly from its path.
- **Files Modified**:
  - `src/app/module/business/game/phaser/component.ts`: Added `mahjongButtonProcessing` and `mahjongButtonShaking` signals, evaluation timeout tracking (~1.2s), failure handler with HTML5 `Audio` playback of `'assets/sounds/error_01.wav'`, and timer cleanups.
  - `src/app/module/business/game/phaser/template.html`: Bound `[class.instruction-panel__button--shake]`, updated `backgroundColor`, `aria-disabled`, and click handler to respect processing state.
  - `src/app/module/business/game/phaser/style.scss`: Added `.instruction-panel__button--shake` and `@keyframes mahjongButtonShake` for tactile wiggle animation.
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` strict pattern adhered to across all modified files.
  - No existing code deleted.
  - Angular build completed with exit code 0.

## [2026-10-21] Charleston Pass Round Tile Disappearance Animation

- **Agent**: Antigravity
- **Task**: Implement Fade & Sink disappearance animation when tiles reach the seat rack during the Charleston pass round.
- **Files Modified**:
  - `src/app/module/business/game/phaser/animation.ts` (`animatePassWaitingTilesIntoSeatRack`): Tile travels to the rack target at full visibility (`alpha: 1`), then smoothly disappears with a fade and sink into the rack (`scale: 0.45`, `alpha: 0`).
  - `src/app/module/business/game/phaser/scenes/scene.ts` (`commitBotPassVisualTilesToRacks`): Opponent visual pass tiles travel to their destination racks at full visibility (`alpha: 1`), then smoothly disappear with a fade and sink animation (`scale: 0.42`, `alpha: 0`).
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` strict pattern adhered to in all modified files.
  - No existing code deleted.
  - Zero TypeScript compilation errors (`tsc --noEmit` verified).

---

## [2026-10-20] Full Project Audit & Knowledge Base Generation

- **Agent**: Antigravity
- **Task**: Perform a complete, read-only source-code audit of the Mahjfit repository and establish an authoritative, source-code-grounded AI Development Knowledge Base.
- **Scope Inspected**:
  - Application entry points & configuration: `package.json`, `angular.json`, `tsconfig.json`, `src/main.ts`, `src/app/app.config.ts`, `src/app/app.service.ts`, `src/app/app.state.ts`.
  - Routing architecture: `src/app/area/route.ts`, `src/app/area/open/registry.ts`, `src/app/area/guard.ts`.
  - Core game subsystem:
    - Route & component: `src/app/module/business/game/route.ts`, `component.ts`, `provider.ts`, `service.ts`, `const.ts`, `template.html`.
    - Reactive state: `src/app/module/business/game/state/state.ts`.
    - Phaser scene & managers: `src/app/module/business/game/phaser/component.ts`, `scenes/scene.ts`, `layout/ui.ts`, `layout/game.ts`, `layout/device.ts`, `animation.ts`, `sound.ts`, `const.ts`.
  - Assets & Audio: `public/assets/game/tiles/`, `public/assets/sounds/` (`tiles.json`, `effects.json`).
  - Styling & Theme: `src/tailwind.css`, `src/theme/`, `.agents/style-typography.md`.
  - Testing Infrastructure: `claim-queue.spec.ts`, `app.spec.ts`, `vitest` config.
  - Client Notes: `todo/points.txt`.
- **Documents Generated**:
  - `docs/ai/PROJECT_OVERVIEW.md`
  - `docs/ai/ARCHITECTURE.md`
  - `docs/ai/CODING_RULES.md`
  - `docs/ai/SYSTEM_INVARIANTS.md`
  - `docs/ai/FEATURE_MAP.md`
  - `docs/ai/DECISIONS.md`
  - `docs/ai/KNOWN_ISSUES.md`
  - `docs/ai/REGRESSION_TESTS.md`
  - `docs/ai/AI_TASK_WORKFLOW.md`
  - `docs/ai/WORK_LOG.md`
  - Updated `.agents/AGENTS.md` and root `AGENTS.md`
- **Confirmed Regressions / Gaps Discovered**:
  1. `claim-queue.spec.ts` failure: Timing targets in `const.ts` were updated to 320/340/320ms (`total = 980ms`), which violates the 900ms assertion threshold in `claim-queue.spec.ts`.
  2. `GameState.publishDeclareDead` is a stub with an unfulfilled TODO for backend SDK support.
  3. Low unit test coverage (only 5 spec files across the entire workspace).
- **Limitations**:
  - Backend NestJS server repositories (`api-sdk` implementation internals and live WebSocket server) are outside this workspace; contracts were verified through installed `@bfw/api-sdk` bundle types and client payloads.
  - Per mandatory user rule, `todo/Frontend Development.txt` was strictly excluded from inspection.
- **Verification**:
  - Read-only audit performed. No existing application source files or configuration files were modified. Existing uncommitted working tree changes were completely preserved.

---

## [2026-10-20] Independent Knowledge-Base Validation Corrections

- **Agent**: Antigravity
- **Task**: Apply targeted corrections identified during the independent validation audit across the `docs/ai/` knowledge base. Verify findings against current source code, tests, and configuration without modifying application source, tests, or build manifests.
- **Documents Corrected**:
  - `docs/ai/KNOWN_ISSUES.md`:
    - Updated `DEF-001` detailing two distinct failure modes in `claim-queue.spec.ts` (assertion threshold exceeded at 980ms vs 900ms; sequential timer advancement 100ms short).
    - Added `DEF-004` documenting ignored `targetRackId` parameter in `GameState.publishMoveTilesToExposurePanel` (hardcoded to `personal_seat_rack_first_rack_id()`).
    - Added `DEF-005` documenting latent inverted Joker sort in unreferenced client fallback methods `sortRackByRank` and `sortRackBySuit`.
  - `docs/ai/REGRESSION_TESTS.md`:
    - Detailed `claim-queue.spec.ts` failure mechanics and updated table.
    - Added `TEST-SUITE-5: phaser-lifecycle-teardown.spec.ts` clearly designated as **PROPOSED**.
    - Updated Vitest command prefix (`export PATH="/usr/local/bin:$PATH"`).
  - `docs/ai/ARCHITECTURE.md`:
    - Added Section 6 detailing Angular + Phaser Integration Boundaries:
      - 6.1 Angular Zone Management (`NgZone.runOutsideAngular` for Phaser 60fps loop; selective `this.zone.run()` for Angular events and router navigation).
      - 6.2 Angular Dependency Injection & `runInInjectionContext` in `PhaserScene` instantiation.
      - 6.3 Dual-Channel Communication Architecture (`TableSceneCallbacks` constructor injection for UI overlay layout vs `this.game.events` EventEmitter for gameplay state).
      - 6.4 Sequential Presentation Queue & Reconciliation Pipeline (`deferClaimVisualUpdate`, `coalesceDeferredQueue`).
  - `docs/ai/FEATURE_MAP.md`:
    - Documented deferred discard flow during `GameTurnStageEnum.NEED_EXPOSURE` (`pendingDiscardTileId`, `processPendingClaimTile`).
    - Documented sequential visual queue pipeline and the ignored `targetRackId` parameter discrepancy in `publishMoveTilesToExposurePanel`.
    - Documented `publishOderPersonalRackTiles` with explicit note preserving exact source symbol spelling `[sic - typo in state.ts]`.
  - `docs/ai/SYSTEM_INVARIANTS.md`:
    - `INV-006`: Separated verified active server-authoritative sorting flow (`publishOderPersonalRackTiles` -> `hand_order`) from latent, unreferenced client fallback sorting methods.
    - `INV-010`: Clarified that `selectTileAtlas` unconditionally loads the 2x atlas while dynamic 1x selection is commented out/inactive. Reclassified confidence status accordingly.
  - `docs/ai/PROJECT_OVERVIEW.md`:
    - Clarified Vitest package range (`^4.0.8`) vs locally resolved version (`v4.1.11`).
    - Documented standalone loading of `assets/sounds/joker_exchange.mp3`.
    - Added comparison table explaining exact differences between `npm run start.web`, `npm run dev.web`, and `npm run dev`.
- **Test Verification Result**:
  - Executed: `export PATH="/usr/local/bin:$PATH" && npx vitest run src/app/module/business/game/phaser/claim-queue.spec.ts`
  - Results: 5 tests, 3 passed, 2 failed. Neither test was altered, masked, or falsely reported as passing.
- **Invariants Upheld**:
  - Application source code and tests untouched.
  - Uncommitted working tree modifications strictly preserved.
  - `todo/Frontend Development.txt` strictly excluded from inspection.

---

## [2026-10-21] Fix: PICK Button Not Enabled During Player's Active Turn

- **Agent**: Antigravity
- **Problem**: When a player reached their active turn with `turn_stage: 1 (NEED_PICK)` during the playing phase, the UI displayed "Pick a tile", but the PICK button remained disabled in gray (`#9eb5c1`).
- **Root Cause**:
  1. `GamePhaserComponent` emitted the server-authoritative `wall:set-pick-mode` event based on `this.gameState.canPickTile()`, but `PhaserScene` did not have a listener for `wall:set-pick-mode`.
  2. `PhaserScene.canPickFromWall()` was using a legacy mock heuristic: `rackCount + apiExposedCount < 14`. Whenever the bottom player had melds exposed (e.g. 7 tiles from a Pung and a Kong), `rackCount + apiExposedCount` evaluated to 14 or higher (and `this.rackOrder` still retained tiles that had been exposed), causing `canPickFromWall()` to return `false` and disabling the PICK button.
- **Solution**:
  1. Added `canPick` property to `PhaserState` (defaulting to `false`).
  2. Added getter and setter for `canPick` in `PhaserScene`.
  3. Added `this.game.events.on("wall:set-pick-mode")` in `PhaserScene.create()` to update `this.canPick`, `this.updateInstructionText()`, and `this.updatePassButtonState()`.
  4. Added cleanup for `wall:set-pick-mode` on scene `SHUTDOWN`.
  5. Updated `PhaserScene.canPickFromWall()` to return the server-authoritative `this.canPick` for personal turns (INV-001).
  6. Emitted the initial `wall:set-pick-mode` and `rack:set-discard-mode` synchronously in `GamePhaserComponent` upon `table:ready`.
- **Invariants Upheld**:
  - All modified code preserved with `OLDCODE` / `NEWCODE` markers.
  - Server-authoritative gameplay state enforced (INV-001).
  - `todo/Frontend Development.txt` excluded.

---

## [2026-10-21] Fix: Preserving Local Rack Order During Joker Exchange & Scoping Server Rack Order

- **Agent**: Antigravity
- **Problem**: When a player swapped a Joker with an exposed tile, the rack order was automatically scrambled or reset, losing the player's manual tile placement.
- **Root Cause**:
  1. In `PhaserScene`, the `rack:order` event listener indiscriminately reorganized `this.rackOrder` on any server `hand_order` change (such as on Picks and Joker exchanges), resetting custom manual tile positions.
  2. During a local Joker exchange, the server response arrived with the Joker appended at the end or in default server order, which caused `rack:order` to overwrite Phaser's in-place swap.
  3. If `reconcileRackTiles` processed incoming tiles before or after the exchange, any new Joker was appended to the end of `this.rackOrder` instead of staying at the vacated natural tile's slot.
- **Solution**:
  1. Added `isExplicitSortRequested` and `hasAppliedInitialRackOrder` flags in `PhaserScene`.
  2. Modified `rack:order` event listener to only forcibly reorganize `this.rackOrder` on initial game deal or when the user explicitly triggers a sort via UI (`onSortRequested`), ignoring hand modifications like Picks and Joker Swaps.
  3. Added `pendingLocalJokerSwap` in `executeJokerSwap` to track the exact `rackIndex` and swap in-place immediately in `this.rackOrder`.
  4. Updated `reconcileRackTiles` and `handleJokerExchange` to preserve and place the incoming Joker at `pendingLocalJokerSwap.rackIndex`.
  5. Synchronized `this.lastServerOrder = this.rackOrder.join(',')` post-swap to maintain clean state.
- **Invariants Upheld**:
  - All modified code preserved with `OLDCODE` / `NEWCODE` markers.
  - `todo/Frontend Development.txt` strictly excluded.
  - Validated with `npx tsc --noEmit` (clean 0 exit code).

---

## [2026-10-26] Fix: Tile Exposure vs Discard State Guard & Cleanup

- **Agent**: Antigravity
- **Problem**: When double-clicking or dragging a tile (such as 9 Crack) during a player's normal turn (`NEED_DISCARD`), the tile went to the bottom exposure tray instead of discarding.
- **Root Cause**:
  1. `this.exposureBuildAsset` lingered in Phaser memory from a previous reversed/abandoned call because neither `table:turn_stage`, `reversePendingCall()`, nor `returnExposureTileToRack()` cleaned it up when leaving exposure stage.
  2. `canAddTileToBottomExposure()` did not check `turnStage === NEED_EXPOSURE` and only verified `exposureBuildAsset` and asset matching.
  3. Double-click handler prioritizes exposure addition before discard, causing the rack tile to be routed into the exposure tray.
- **Solution**:
  1. Added turn stage guard in `canAddTileToBottomExposure()` requiring `GameTurnStageEnum.NEED_EXPOSURE` before allowing any rack tile into exposure.
  2. Cleaned up `exposureBuildAsset` and `activeExposureBuildTileIds` in `table:turn_stage` handler whenever transitioning out of `NEED_EXPOSURE`.
  3. Cleaned up `exposureBuildAsset` and filtered `activeExposureBuildTileIds` in `reversePendingCall()`.
  4. Reset `exposureBuildAsset = undefined` in `returnExposureTileToRack()` when no exposure tiles or build tile IDs remain.
  5. Cleared `exposureBuildAsset = undefined` upon confirming exposure in `handleHtmlMahjongAction()`.
- **Invariants Upheld**:
  - All modified code preserved with `OLDCODE` / `NEWCODE` markers.
  - `todo/Frontend Development.txt` strictly excluded.
  - Validated with `npx tsc --noEmit` (clean 0 exit code).



