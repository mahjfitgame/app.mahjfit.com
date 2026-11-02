# AI Agent Development Work Log: Mahjfit Client

This log records verified development tasks, bug fixes, refactorings, and architectural audits conducted by AI agents on this repository.

---

## [2026-11-02] Result Popup: Restore 3D Gold Gradient Style for Mahjong Text

- **Agent**: Antigravity
- **Task**: Restore the classic 3D Gold Gradient style with drop shadow for the "MAH JONGG!" title in the discard area result card popup.
- **Implementation**:
  - `src/app/module/business/game/phaser/style.scss`:
    - Updated `.result-card-title` with `linear-gradient(180deg, #fff7d6 0%, #f6c542 50%, #d97706 100%)`, `-webkit-background-clip: text`, `-webkit-text-fill-color: transparent`, `filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))`, weight 900, and letter-spacing 1px.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Mahjong Win: Upright Top Exposure, Opponent Reveal on Player Win & Full 14-Tile Winning Hand

- **Agent**: Antigravity
- **Task**:
  1. Fix top exposure rack tiles showing reversed (upside down) when revealed to exposure area on game finish (Mahjong and Wall Game).
  2. Fix opponent rack hands not showing in table exposure panels when the bottom player (local seat) declares Mahjong.
  3. Fix Mahjong popup winning hand display: ensure all 14 tiles show with genuine texture atlas images and proper meld/hand grouping (including exposed Kongs and suited/honor melds), with simple, readable syntax maintainable by any junior developer.
- **Root Cause**:
  1. `scene.ts`: `image.setAngle(180)` was hardcoded for top seat in `revealOpponentHands()` and `revealAllSeatsHandsForWallGame()`, which inverted top exposure tiles.
  2. `component.ts`: `winnerId` resolution only inspected `play_seats()`, failing to check local player's rack (`personal_seat_rack_first_is_mahjong()`). Opponents were not extracted and `mahjong:win` was never emitted when bottom player won.
  3. `component.ts`: `exp.tiles` contained objects `{ tile_id: number }` rather than primitive IDs, dropping exposed Kongs. Tile labels checked only string literals and missed numeric enum types. Concealed grouping split suited tiles into single-tile groups.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `revealOpponentHands()` and `revealAllSeatsHandsForWallGame()` so `seat === "top"` uses `image.setAngle(0)` to render upright.
  - `src/app/module/business/game/phaser/component.ts`:
    - Added check for `personal_seat_rack_first_is_mahjong()` and `isMyTurn` when resolving `winnerId`.
    - Extracted opponent hands using `all_seat_rack_hands()` with clean fallback to `play_seats()`.
    - Added simple `extractTileIdsFromExp(exp)` helper to extract tile IDs from exposures.
    - Updated `mapRawTileToWinningTile()` to support numeric enum values (`TileTypeEnumAddon.JOKER = 15`, `BAM = 1`, `CHAR = 2`, `DOT = 3`, `DRAGON_RED = 8`, `DRAGON_GREEN = 9`, `DRAGON_WHITE = 10`, etc.).
    - Implemented clean `groupConcealedTiles()` using simple loops to group suited tiles into e.g. `2488 Crack` and honors into individual melds.
- **Plan File**:
  - `todo/phase-play-after-before-plan-mahjong-full-hand-opponent-reveal.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/component.ts`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - Simple, clean loop syntax accessible to junior developers (~6 months experience).
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Allow Discard on Complete Exposure

- **Agent**: Antigravity
- **Task**: Allow player to discard a tile via drag-and-drop or double click once an exposure meld has been built ($\ge 3$ tiles) during `NEED_EXPOSURE`, while continuing to enforce incomplete exposure blocks and single-discard locks.
- **Root Cause**:
  - `canDiscard` computed signal in `state.ts` strictly required `stage === GameTurnStageEnum.NEED_DISCARD`. Because the server is still in `NEED_EXPOSURE` while the client builds the meld, `canDiscard` was `false`, causing Phaser's drop and double-click interaction guards to block all discards.
- **Implementation**:
  - `src/app/module/business/game/state/state.ts`:
    - Updated `canDiscard` computed signal to evaluate `true` for both `NEED_DISCARD` and `NEED_EXPOSURE`.
    - Phaser's `snapTileToDiscard()` continues to enforce that exposures must have $\ge 3$ tiles before discarding is accepted, and locks `this.canDiscard = false;` immediately on flight to prevent multiple discards.
- **Plan File**:
  - `todo/phase-play-after-before-plan-allow-discard-on-complete-exposure.md`
- **Files Modified**:
  - `src/app/module/business/game/state/state.ts`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Fix Exposure Instruction Message ("Complete the exposure, then discard a tile")

- **Agent**: Antigravity
- **Task**: Restore the claim exposure instruction message ("Complete the exposure, then discard a tile") in the yellow instruction panel above the player's rack during `NEED_EXPOSURE`, instead of incorrectly showing "Pick a tile".
- **Root Cause**:
  1. `getLocalExposureStatus()` in `scene.ts` checked `!this.canDiscard` and returned `null`. Because `canDiscard` was correctly updated to `false` during `NEED_EXPOSURE` to prevent premature discards, this check caused `getLocalExposureStatus()` to prematurely return `null`.
  2. `updateInstruction()` in `ui.ts` checked `if (!canDiscard)` before `else if (effectiveExposureStatus === "building")`. Because `canDiscard` is `false` during `NEED_EXPOSURE`, it entered `if (!canDiscard)` and set the message to `"Pick a tile"`.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - In `getLocalExposureStatus()`: Removed `!this.canDiscard` and allowed `count < 3` to return `"building"` whenever `isNeedExposure` is true.
  - `src/app/module/business/game/phaser/layout/ui.ts`:
    - In `updateInstruction()`: Prioritized `if (effectiveExposureStatus === "building")` before checking `!canDiscard`.
- **Plan File**:
  - `todo/phase-play-after-before-plan-exposure-instruction-message.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/layout/ui.ts`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Claim Exposure & Discard Validation Guards

- **Agent**: Antigravity
- **Task**: Discard must not be allowed without a completed exposure group (at least 3 tiles); multiple discards in a single turn must be prevented; clicking MAHJONG during `NEED_EXPOSURE` must not prematurely advance local stage to `NEED_DISCARD` when exposure has `< 3` tiles.
- **Root Cause**:
  1. `handleHtmlMahjongAction()` in `scene.ts` forcibly set `this.turnStage = NEED_DISCARD` and cleared `activeExposureBuildTileIds` when the user clicked MAHJONG during `NEED_EXPOSURE`, even when exposure had $< 3$ tiles. This corrupted the local stage and bypassed discard validation.
  2. `canDiscard` computed signal in `state.ts` evaluated `stage === GameTurnStageEnum.NEED_EXPOSURE` as allowing a discard.
  3. `snapTileToDiscard()` did not immediately lock `this.canDiscard = false;`, permitting consecutive drag-to-discard actions.
  4. In `component.ts`, `pendingDiscardTileId` was not cleared if a backend action error occurred (`play_action_error`).
- **Implementation**:
  - `src/app/module/business/game/state/state.ts`:
    - Updated `canDiscard` computed signal to strictly require `stage === GameTurnStageEnum.NEED_DISCARD`. Discard is strictly forbidden during `NEED_EXPOSURE`.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - In `handleHtmlMahjongAction()`: Added guard `if (this.activeExposureBuildTileIds.length < 3) { this.callbacks.onMahjongDeclare?.(); return; }`. Does not submit invalid exposure or advance `turnStage` to `NEED_DISCARD`.
    - In `snapTileToDiscard()`: Guarded `this.activeExposureBuildTileIds.length < 3` to return tile to slot and abort discard. Immediately sets `this.canDiscard = false;` to block any subsequent discards in the same turn.
  - `src/app/module/business/game/phaser/component.ts`:
    - In `play_action_error` effect: Resets `this.pendingDiscardTileId = null;` when an error is received from the server.
- **Plan File**:
  - `todo/phase-play-after-before-plan-claim-exposure-discard-guard.md`
- **Files Modified**:
  - `src/app/module/business/game/state/state.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/component.ts`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Mahjong UI Upgrade: Atlas Tile Images & Opponent Hand Reveal

- **Agent**: Antigravity
- **Task**: Render winning hand tile images using authentic texture atlas frames instead of text numbers, scale tile images to match bottom rack proportions, and extract opponent hands using `rack.hand` to reveal all seats' tiles in their exposure panels on Mahjong.
- **Root Cause & Fixes**:
  - `mapRawTileToWinningTile` queried `"PhaserScene"`, but the registered scene key was `"table-scene"`. Fixed to query `"table-scene"` and extract tile image URLs via `getTileDataUrl()`.
  - Opponent hands extraction previously checked `(rack as any).tiles` which was undefined. Updated to read `rack.hand` dictionary as received from the GraphQL WebSocket play payload.
  - Sized `.atlas-tile-img` to `clamp(38px, 4.8vw, 54px)` with `aspect-ratio: 0.72` and rounded corners to match bottom rack tile dimensions.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Updated `opponentHands` extraction to read `rack.hand`.
    - Fixed scene key to `"table-scene"` for tile image URL resolution.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Tracked revealed opponent tile images in `this.calledOpponentExposureTiles[seat]`.
  - `src/app/module/business/game/phaser/style.scss`:
    - Updated `.atlas-tile-img` dimensions and aspect ratio to match bottom rack tiles.
- **Plan File**:
  - `todo/phase-play-after-before-plan-mahjong-ui-upgrade.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/component.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/style.scss`
  - `todo/phase-play-after-before-plan-mahjong-ui-upgrade.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Discard-Area Scoped Mahjong Win & Wall Game Popup Redesign

- **Agent**: Antigravity
- **Task**: Redesign Mahjong Win and Wall Game popups to cover only the discard area, use authentic Phaser tile atlas artwork for winning hand meld groups, include an Eye icon to toggle visibility, reveal all players' hands to exposures on Wall Game, and add functional "Play Again" (`/game`) and "Exit" (`/home`) buttons adhering to Mahjfit Design System.
- **Root Cause & Requirements**:
  - The old popups covered the full screen, obscuring the board, player racks, and exposures.
  - The old winning hand tiles used CSS/text symbols rather than authentic texture atlas artwork.
  - Players wanted the ability to hide/show the summary to inspect the discard area underneath.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/type.ts`:
    - Added `onDiscardAreaOverlay` callback to `PhaserSceneCallbacks`.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Published `discardArea` bounds to Angular on layout/drawTable (`onDiscardAreaOverlay`).
    - Added `getTileDataUrl()` to extract high-resolution image Data URLs from texture atlas frames.
    - Added `revealAllSeatsHandsForWallGame()` and registered `"table:wall-game"` event.
  - `src/app/module/business/game/phaser/component.ts`:
    - Added `discardAreaRect` and `isResultPopupHidden` signals.
    - Wired `onDiscardAreaOverlay` callback to track discard area geometry.
    - Updated `mapRawTileToWinningTile()` to populate `imageUrl` from atlas frames.
    - Updated `onExitGame()` to route to `/home`, and `onStartNewGame()` to restart on `/game`.
    - Emitted `"table:wall-game"` with seats data when wall game is detected.
  - `src/app/module/business/game/phaser/template.html`:
    - Commented out old full-screen popups with `<!-- OLDCODE ... -->`.
    - Implemented new discard-area scoped popups with eye toggle icon, celebration confetti, atlas tile artwork, and styled action buttons.
  - `src/app/module/business/game/phaser/style.scss`:
    - Styled `.discard-area-result-card`, `.result-card-eye-btn`, `.result-popup-toggle-eye`, `.atlas-tile-img`, `.result-btn-primary`, and `.result-btn-secondary` using `Outfit` font, Fuchsia `#B92A90`, Avocado `#C7C22E`, and 8px border radius.
- **Plan File**:
  - `todo/phase-play-after-before-plan-mahjong-wall-game-popup.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/type.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/component.ts`
  - `src/app/module/business/game/phaser/template.html`
  - `src/app/module/business/game/phaser/style.scss`
  - `todo/phase-play-after-before-plan-mahjong-wall-game-popup.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Handle "Game start failed. No game found." Redirect to `/home`

- **Agent**: Antigravity
- **Task**: Redirect the user to `/home` when attempting to reload or start an already completed/non-existent game.
- **Root Cause**:
  - The GraphQL mutation `GameStatePublicStart` returned HTTP 200 with `errors: [{ message: "Game start failed. No game found." }]` and `data: null`.
  - Because HTTP status was 200, it was not caught in the `catch` block. `startGame()` simply returned `false` without checking `startResp.errors`.
  - In `GameComponent.ngOnInit()`, `startGame()` was awaited without checking for failure.
  - The old `catch` block previously redirected to `['/']` instead of canonical `['/home']`.
- **Implementation**:
  - `src/app/module/business/game/state/state.ts`:
    - Checked `(startResp as any)?.errors` for `"Game start failed. No game found."`.
    - If detected, cleared stale cookie (`this.clearCreatedGame()`), navigated to `['/home']`, and returned `false`.
    - Updated `catch` block to check for "No game found." or 400 status, clear stale game cookie, and navigate to `['/home']`.
  - `src/app/module/business/game/component.ts`:
    - In `ngOnInit()`, added a guard: if `!gameStartedResp`, redirect to `['/home']`.
- **Plan File**:
  - `todo/phase-play-after-before-plan-game-start-error-redirect.md`
- **Files Modified**:
  - `src/app/module/business/game/state/state.ts`
  - `src/app/module/business/game/component.ts`
  - `todo/phase-play-after-before-plan-game-start-error-redirect.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Manual Rack Tile Drag & Drop Order Persistence

- **Agent**: Antigravity
- **Task**: Preserve user's manual tile drag-and-drop arrangement across game actions while resetting to server `hand_order` on explicit sort ("Order by Suit" / "Order by Rank") or page reload.
- **Root Cause**:
  - `reconcileRackTiles()` and `rack:order` in `scene.ts` unconditionally overwrote `this.rackOrder` with the server's `apiOrderIds` / `hand_order` on every server play event (picks, discards, exposures), wiping out manual drag-and-drop layouts.
- **Implementation**:
  - `scene.ts`:
    - Added `hasUserManualRackOrder: boolean = false;` flag.
    - Set `hasUserManualRackOrder = true` when the player drags and drops a tile into a new slot (`moveRackTileToIndex`).
    - Reset `hasUserManualRackOrder = false` and set `isExplicitSortRequested = true` when sort is clicked (`onSortRequested`).
    - Guarded `rack:order` event listener to only override rack order when `!this.hasUserManualRackOrder || isExplicitSort || isInitial`.
    - Updated `reconcileRackTiles()`: when `hasUserManualRackOrder` is active, it preserves the user's customized rack ordering, removes discarded/exposed tiles, and appends newly drawn tiles (14th tile) to the end.
- **Plan File**:
  - `todo/phase-play-after-before-plan-manual-rack-order.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `todo/phase-play-after-before-plan-manual-rack-order.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Remove Tile Shadow from Exposure Area

- **Agent**: Antigravity
- **Task**: Remove tile shadow when tiles move to the exposure area so that drop-shadow is only shown when tiles are in the player rack.
- **Root Cause**:
  - Exposure handlers previously applied `applyTileTextureFilter(image, true)` to retain shadows on exposure tiles.
- **Implementation**:
  - `scene.ts`:
    - Updated `applyTileTextureFilter` to `(image, isBottomRack = false)` so it only enables shadows when `isBottomRack` is true.
    - Updated exposure addition points (lines 3971, 4654, 5148, 6864) to call `this.removeTileTextureFilter()`.
    - Added safeguard in `layoutCalledBottomExposureTiles()` to call `this.removeTileTextureFilter(image)`.
- **Plan File**:
  - `todo/phase-play-after-before-plan-exposure-tile-shadow-remove.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `todo/phase-play-after-before-plan-exposure-tile-shadow-remove.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Fix Opponent Discard Tile Animation

- **Agent**: Antigravity
- **Task**: Restore opponent discard flight animation that stopped playing.
- **Root Cause**:
  1. `subscribeDebug` in `state.ts` called `this.setPlay(data.play)` with partial debug socket payloads lacking discard rack data, corrupting the active play state and causing discard updates in `component.ts` to trigger bulk load without animation.
  2. `handleOpponentDiscard` in `scene.ts` used a hardcoded 500ms timer that fired prematurely while the bot pick flight (1000ms on Easy) was still in mid-air.
  3. `processOpponentDiscard` flight duration used hardcoded 320ms (`CLAIM_DISCARD_FLIGHT_MS`) instead of matching the active bot animation speed.
- **Implementation**:
  - `state.ts`:
    - Removed `this.setPlay(data.play)` in `subscribeDebug`, preserving debug hand tiles via `captureDevelopmentPayload(data)` without corrupting authoritative game state.
  - `scene.ts`:
    - Updated `handleOpponentDiscard` to delay discard execution by `this.animationDuration` so pick flight finishes before discard begins.
    - Updated `processOpponentDiscard` flight tween and scroll timer to use `this.animationDuration`.
- **Plan File**:
  - `todo/phase-play-after-before-plan-opponent-discard-fix.md`
- **Files Modified**:
  - `src/app/module/business/game/state/state.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `todo/phase-play-after-before-plan-opponent-discard-fix.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-31] Fix Tile Shadow on Discard and Preserve on Exposure

- **Agent**: Antigravity
- **Task**: Fix issue where discarded tiles carried the drop-shadow into the discard area, and ensure bottom player exposure tiles preserve their drop-shadow.
- **Root Cause**:
  1. `removeTileTextureFilter()` in `scene.ts` attempted to call non-existent methods (`disableFilters()`, `removeShadow()`). In Phaser 4, shutting off filter rendering on a Game Object requires setting `(image as any).renderFilters = false;` and clearing `filters.external.clear()`. Because `renderFilters = false` was never set, Phaser continued to render the shadow shader even after the tile was moved to discard.
  2. `applyTileTextureFilter()` did not re-enable `renderFilters = true`, which is required if filters were previously toggled.
  3. When tiles moved from rack or claim to bottom exposures, `removeTileTextureFilter()` was called on them, erroneously stripping shadow from exposure tiles.
- **Implementation**:
  - `scene.ts`:
    - Updated `applyTileTextureFilter(image, isBottomRackOrExposure)` to set `(image as any).renderFilters = true;` and apply shadow when true.
    - Updated `removeTileTextureFilter(image)` to completely dismantle the GameObject's filter pipeline by clearing filters, calling `filterCamera.destroy()`, resetting `filterCamera = undefined`, setting `renderFilters = false`, and removing `renderWebGLFilters` from `_renderSteps`. This ensures discarded tiles render through standard sprite passes with zero lingering filter textures.
    - Added safeguard in `layoutDiscardTiles()` to ensure all bottom player tiles in `discardedTileIds` have `removeTileTextureFilter()` applied.
    - Updated exposure handlers (lines 3968, 4645, 5132, 6824) to call `this.applyTileTextureFilter(image, true)` so exposure tiles keep their shadow.
- **Plan File**:
  - `todo/phase-play-after-before-plan-tile-shadow-fix.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `todo/phase-play-after-before-plan-tile-shadow-fix.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-30] Fix Pick Tile Animation Skipping on Player Rack

- **Agent**: Antigravity
- **Task**: Fix issue where drawing/picking a tile sometimes directly placed the tile in the player's rack without playing the wall-to-rack flight animation.
- **Root Cause**:
  1. Safety timer in `setRack()` was hardcoded to 800ms. On `Easy` bot speed (`animationDuration = 1000ms`), the safety timer fired before the animation finished, making the tile abruptly appear at full opacity and clearing animation flags prematurely.
  2. `isWaitingForPickResponse` was reset to `false` at the end of `reconcileRackTiles()` before the server's 14th tile actually arrived. When the tile arrived a few milliseconds later, the pick flag was gone, causing the tile to appear immediately without animation.
  3. No fallback detection existed when a 14th tile arrived in the play phase to trigger the pick animation if a transient flag was missed.
- **Implementation**:
  - `scene.ts`:
    - Updated `delayedCall` safety timer in both `setRack()` blocks to scale dynamically to `this.animationDuration + 300ms` so it never cuts off the animation early.
    - Updated `reconcileRackTiles()` tile addition to detect when a new tile is drawn (`this.isWaitingForPickResponse || (this.tablePhase === GamePhaseEnum.PLAYING && this.rackTiles.length === 14)`), keeping the tile invisible until animated into the rack.
    - Prevented premature cleanup in `reconcileRackTiles()` by only resetting `this.isWaitingForPickResponse = false` if `pendingLocalPickRuntime` was found and prepared.
    - Opponent pick/claim/discard logic was left intact as it was already functioning properly.
- **Plan File**:
  - `todo/phase-play-after-before-plan-pick-tile-animation-fix.md`
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `todo/phase-play-after-before-plan-pick-tile-animation-fix.md`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-30] Fix Charleston 2nd Round Left Pass Submission & Stage Transition

- **Agent**: Antigravity
- **Task**: Fix issue where selecting 3 tiles in Charleston Round 2 Stage 2 (Left Pass) and clicking PASS did not make the API request, and address popup UX on 2nd round Charleston voting.
- **Root Cause**:
  1. `setPassDirection(direction)` in `scene.ts` had an early return `if (this.passDirection === direction) return;`. When moving from Charleston Round 1 Pass 3 (Left) through Second Decision into Round 2 Pass 1 (Left), `this.passDirection` was already `"LEFT"`. Because the direction string was identical, `setPassDirection` aborted early, skipping the reset of `isBotPassVisualAnimating`, `isPassAnimating`, `stateManager.optimisticPassTileIds`, and `passFlowManager.setPassDirection()`.
  2. `this.lastSubmittedPassDestination` remained `"left"` from Round 1 Pass 3 because neither `setCharlestonState` nor `setPassDirection` cleared it on stage/round transition.
  3. `clearBotPassVisualTiles()` killed tweens and destroyed tiles but did not reset `this.isBotPassVisualAnimating = false;`, leaving the submission guard stuck.
  4. In `submitPassWaitingTiles()`, `isBotPassVisualAnimating` blocked human tile pass submission if bot pass visual flags were stale.
  5. In `component.ts`, when voting YES or NO on the Charleston second round decision, the panel remained mounted until server response, causing the first popup to flash again after confirmation.
- **Implementation**:
  - `scene.ts`:
    - Updated `setCharlestonState()`: When stage or round changes, resets `this.passDirection = undefined`, `this.lastSubmittedPassDestination = undefined`, `this.botAutoStagedDestination = undefined`, `this.clearBotPassVisualTiles()`, `this.isBotPassVisualAnimating = false`, `this.isPassAnimating = false`, and optimistic pass IDs.
    - Updated `setPassDirection()`: Checks `lastHandledPassStage` and `lastHandledPassRound` so it never aborts early when entering a new stage or round even if the direction string matches.
    - In `clearBotPassVisualTiles()`: Explicitly sets `this.isBotPassVisualAnimating = false`.
    - In `handlePrimaryAction()`: Added `return;` inside `if (this.isPassingPhase())` block after `submitPassWaitingTiles()` to prevent fall-through.
    - In `submitPassWaitingTiles()`: If `botPassVisualTiles.length === 0` or if `isBotPassVisualAnimating` is set when human player submits, calls `this.clearBotPassVisualTiles()` and sets `isBotPassVisualAnimating = false` to guarantee human submission proceeds.
  - `component.ts`:
    - Cleared `this.rawInstructionPanelState = undefined;` and `this.instructionPanelOverlay.set(undefined);` immediately on vote selection (`stop-confirm` and `pass`), removing popup lag/flashing.
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/component.ts`
  - `docs/ai/WORK_LOG.md`
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed.
  - No existing code deleted.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-30] Dynamic Tile Pick & Discard Animation Speeds by Bot Level

- **Agent**: Antigravity
- **Task**: Configure pick and discard tile animation speeds dynamically according to the game's Bot Level (`EASY`, `NORMAL`, `FAST`).
- **Details**:
  - `EASY`: 1000 ms (1.0 second, slow and relaxed).
  - `NORMAL`: 650 ms (medium, smooth speed).
  - `FAST`: 400 ms (snappy, default speed).
- **Implementation**:
  - `component.ts`: Emits `table:bot-level` event from Angular `gameState.game_botlvl_id()` to Phaser both at initial scene start and whenever the bot level updates.
  - `scene.ts`:
    - Listens to `table:bot-level` and calculates `animationDuration` (1000ms, 650ms, or 400ms).
    - Uses `this.animationDuration` dynamically in `pickAnimationDurationForSeat(seat)` and `snapTileToDiscard(runtime, ...)`.
- **Files Modified**:
  - `src/app/module/business/game/phaser/component.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed.
  - No existing code deleted.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-30] Fix Charleston Pass Button Click Routing During Tile Passing

- **Agent**: Antigravity
- **Task**: Fix issue where clicking the PASS button during Charleston tile passes (e.g. First Across) did not submit the pass action to Phaser.
- **Root Cause**:
  - `onInstructionPanelClick()` had an unconditional `if (action === "pass")` check that called `publishCharlestoneSecondRoundVote(true)`.
  - Because the instruction panel PASS button uses action `"pass"`, all regular tile passing clicks were being intercepted as 2nd round Charleston votes instead of routing to `instruction-panel:primary-action`.
- **Implementation**:
  - In `src/app/module/business/game/phaser/component.ts`, imported `GameCharlestoneStageEnum` and updated `onInstructionPanelClick()` to only route `action === "pass"` to `publishCharlestoneSecondRoundVote(true)` when `gameState.play_pass_stage() === GameCharlestoneStageEnum.SECOND_DECISION`.
  - In all normal pass rounds (`FIRST`, `SECOND`, `COURTESY`), clicking PASS now properly emits `instruction-panel:primary-action` to Phaser to execute `submitPassWaitingTiles()`.
- **Files Modified**:
  - `src/app/module/business/game/phaser/component.ts`
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed.
  - No existing code deleted.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-29] Bottom Seat Pick Tile Premature Rack Placement & Duplicate Flight Fix

- **Agent**: Antigravity
- **Task**: Fix bottom seat picked tile appearing prematurely in the rack and prevent duplicate animations when multiple `rack:set` events fire during flight.
- **Root Cause**:
  - `pendingLocalPickRuntime` was acting as both the animation trigger in `setRack()` and the alpha guard in `layoutRackTiles()`.
  - When retained to guard alpha, a subsequent `rack:set` event arriving mid-flight re-triggered `if (this.pendingLocalPickRuntime)` and launched a second flight animation for the same tile.
- **Implementation**:
  - Separated concerns: `this.pendingLocalPickRuntime` is cleared immediately when the flight tween begins to guarantee `animateWallTileToSeat()` is only invoked once.
  - Introduced `this.animatingPickTileId` which remains active throughout the flight until `onComplete` (and fallback safety timer).
  - Both `layoutRackTiles()` and `reconcileRackTiles()` use `this.animatingPickTileId` to keep `runtime.image.alpha = 0` during flight.
- **Files Modified**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed.
  - No existing code deleted.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-10-29] Debug Mode All Seat Hand Tiles Display & WebSocket Sync

- **Agent**: Antigravity
- **Task**: In debug mode (`environment.DEBUG === true`), show concealed rack hand tiles for all opponent seats (`top`, `left`, `right`) above each seat's exposure area in smaller size for bot inspection.
- **Details**:
  - Connected WebSocket `subscribeDebug` (listening on `game.publish.debug`) and `publishGetDebugState` (emitting `game.subscribe.debug.state`).
  - Added computed signal `all_seat_rack_hands` in `GameState` that extracts 13-14 concealed hand tiles for each seat in correct order, falling back to development payload.
  - Added Angular effect in `PhaserComponent` to emit `debug:opponent-hands` event to Phaser.
  - Implemented `renderDebugOpponentHands` and `layoutDebugOpponentHandTiles` in `PhaserScene`:
    - Renders smaller tiles (70% size of regular exposure tiles).
    - Positioned in the space between the table border and exposure for `top`, `left`, and `right` seats.
    - Leaves bottom seat completely unchanged.
    - Added proper lifecycle cleanup on shutdown and resize.
- **Files Modified**:
  - `src/app/module/business/game/state/state.ts`
  - `src/app/module/business/game/phaser/component.ts`
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `todo/phase-play-after-before-plan-debug-hand-tiles.md`
- **Invariants Upheld**:
  - `OLDCODE` / `NEWCODE` pattern strictly followed across all changes.
  - No existing code deleted.
  - Simple syntax and clear English comments.
  - TypeScript compilation check (`tsc --noEmit`) verified with 0 errors.

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



