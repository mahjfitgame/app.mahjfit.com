# AI Agent Development Work Log: Mahjfit Client

This log records verified development tasks, bug fixes, refactorings, and architectural audits conducted by AI agents on this repository.

---

## [2026-11-05] Discard Area: Disable Drag and Drop for Discarded Tiles

- **Agent**: Antigravity
- **Task**: Disable drag and drop event handling for discarded tiles so that discarded tiles cannot be moved or dragged by the player, preventing accidental tile movement while scrolling.
- **Implementation**:
  - `todo/phase-play-after-before-plan-disable-discard-tile-drag.md`: Created detailed Before/After plan document.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - `registerTileInput`: Guarded `onPointerDown`, `onPointerOver`, `onDragStart`, `onDrag`, `onDragEnd`, and `onPointerUp` with `if (runtime.zone === "discard") return;`.
    - `snapTileToDiscard`: Added `runtime.image.disableInteractive()` and `this.input.setDraggable(runtime.image, false)`.
    - `layoutDiscardTiles`: Explicitly called `runtime.image.disableInteractive()` and `this.input.setDraggable(runtime.image, false)`.
    - `renderDiscardsSet` and `handleOpponentDiscard`: Explicitly called `image.disableInteractive()` on opponent discard tiles.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - Did not access `todo/Frontend Development.txt`.
  - TypeScript compilation check (`npx tsc --noEmit`) verified with 0 errors.

---

## [2026-11-05] Tile Drag & Drop: Fix Layering Above HTML Overlays & Eliminate High-DPI Duplicate Tile

- **Agent**: Antigravity
- **Task**:
  1. Eliminate duplicate mini-tile appearing near the top-left corner on iPhone 16 Pro and Mac Retina displays when dragging any tile.
  2. Ensure the dragged tile maintains correct layering (`z-index: 1000`) and stays strictly **on top** of HTML overlays (Instruction Panel, PASS buttons, player labels).
- **Root Cause**:
  1. `showDragProxy()` and `updateDragProxy()` previously divided coordinates (`dragX`, `dragY`) and tile dimensions by `dpr`. Because Phaser's coordinate system is already in 1:1 CSS screen pixels (`host.clientWidth`, `host.clientHeight`), dividing by DPR shrank the HTML proxy to 1/2 or 1/3 size and shifted it toward `(0, 0)`.
  2. The Phaser canvas tile sprite (`runtime.image`) was kept at 100% opacity simultaneously with the HTML proxy, causing two tiles to be visible during drag.
- **Implementation**:
  - `todo/phase-play-after-before-plan-eliminate-duplicate-drag-tile.md`: Created detailed Before/After plan document.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - `onDrag`: Set `runtime.image.setAlpha(0)` when drag starts so only the topmost HTML proxy (`z-index: 1000`) is visible.
    - `onDragEnd` & `onPointerUp`: Restore `runtime.image.setAlpha(1)` and hide the HTML proxy (`hideDragProxy()`).
    - `showDragProxy` & `updateDragProxy`: Removed `/ dpr` division. Positions and sizes now use exact 1:1 CSS logical pixels (`dragX - width / 2`, `dragY - height / 2`).
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - Did not access `todo/Frontend Development.txt`.
  - TypeScript compilation check (`npx tsc --noEmit`) verified with 0 errors.

---

## [2026-11-05] Discard Area: Smooth Scrolling with Momentum & Elastic Bounce-Back

- **Agent**: Antigravity
- **Task**:
  1. Fix syntax error: `Property 'isDesktop' does not exist on type 'ResponsiveMetrics'`.
  2. Implement smooth physics-based scrolling for discard tiles (RexRainbow scroller style):
     - Smooth mouse wheel gliding via interpolation.
     - Drag fling momentum with decelerating friction.
     - Elastic overscroll resistance and rubber-band bounce-back.
- **Root Cause & Fix for Syntax Error**:
  - `this.layout.metrics` is of type `ResponsiveMetrics`, which has `isMobile` and `isTablet` but not `isDesktop`.
  - Replaced `this.layout.metrics.isDesktop` with `!this.layout.metrics.isMobile && !this.layout.metrics.isTablet`.
- **Implementation**:
  - `todo/phase-play-after-before-plan-smooth-discard-area-scroll.md`: Plan document created with Before/After snippets and plain English explanations.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Added physics state variables: `discardTargetScrollY`, `discardVelocityY`, `discardLastPointerY`, `discardLastPointerTime`.
    - Mouse wheel listener: Glide smoothly by updating `discardTargetScrollY` with bounds clamping.
    - Pointer drag/flick listener: Track velocity on move, apply elastic damping when pulled past boundaries, and convert pointer release into inertia momentum (`discardVelocityY`).
    - Added `updateDiscardSmoothScroll()` in Phaser `update(time, delta)`:
      - Applies gliding deceleration (`* 0.92`).
      - Applies rubber-band bounce-back via `Phaser.Math.Linear(..., 0.15)` when out of bounds.
      - Smoothly interpolates `discardScrollY` towards `discardTargetScrollY` (`0.18`).
      - Updates discard tile positions smoothly whenever scrolling.
    - Synchronized `scrollToBottomDiscard` to align target scroll position cleanly.
- **Invariants Upheld**:
  - Existing code commented out with `/* OLDCODE */` and replaced with `/* NEWCODE */`.
  - Did not access `todo/Frontend Development.txt`.
  - Verified 0 errors with `npx tsc --noEmit`.

---

## [2026-11-05] Discard Area: 30% Tile Size Reduction on Desktop

- **Agent**: Antigravity
- **Task**: Decrease discard area tile size by 30% specifically for Desktop devices while preserving existing sizes on tablet and mobile.
- **Implementation**:
  - `todo/phase-play-after-before-plan-desktop-discard-tile-size-reduction.md`: Created detailed Before & After plan document.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `discardGrid()`: Checked `isDesktop`, scaling tiles by `0.81 * 0.70 = 0.567` on desktop (~40 × 57 px).
    - Preserved `scale = 0.81` on tablet and mobile devices.
- **Invariants Upheld**:
  - Existing code preserved with `/* OLDCODE */` and `/* NEWCODE */`.
  - Did not access `todo/Frontend Development.txt`.
  - Verified 0 errors with `npx tsc --noEmit`.

---

## [2026-11-05] Dead Hand Popup: Center Text Vertically & Horizontally

- **Agent**: Antigravity
- **Task**: Center the text in the Dead Hand popup dialogs.
- **Root Cause**:
  1. In `dead-hand-popup` (the Declare Dead Hand modal), the template had `[style.display]="'block'"`, overriding the stylesheet's `place-items: center` and pushing the section to the top of the screen.
  2. Inside `wall-game-theme` (when a game ends due to Dead Hand), `.wall-game-popup__dead-note` had `text-align: left` and default flex alignment, keeping the note on the left side of the popup.
- **Implementation**:
  - `src/app/module/business/game/phaser/template.html`:
    - Updated `.dead-hand-popup` container from `[style.display]="'block'"` to `[style.display]="'grid'"`.
  - `src/app/module/business/game/phaser/style.scss`:
    - Added `display: grid; place-items: center;` to `.dead-hand-popup`.
    - Added `margin: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;` to `.dead-hand-popup section`.
    - Centered `.wall-game-popup__dead-note` within `.wall-game-theme .result-card-header` (`text-align: center; justify-content: center; margin: 8px auto 0;`).
- **Invariants Upheld**:
  - Existing code commented out with `/* OLDCODE */` and replaced with `/* NEWCODE */`.
  - Did not access `todo/Frontend Development.txt`.
  - Verified 0 errors with `npx tsc --noEmit`.

---

## [2026-11-04] Wall Game Popup: Center Text Vertically & Horizontally

- **Agent**: Antigravity
- **Task**: Center the text (title, announcement message, and dead note) in the Wall Game popup dialog.
- **Root Cause**: `.discard-area-result-card` had `justify-content: space-between` with only two elements (`<header>` and `<footer>`), pushing the header text all the way to the top border with a large empty gap in the middle.
- **Implementation**:
  - `src/app/module/business/game/phaser/style.scss`:
    - Updated `.wall-game-theme .result-card-header` with `flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%;`.
    - Pinned `.result-card-actions` neatly at the bottom with `margin-top: 0; margin-bottom: 6px;`.
- **Invariants Upheld**:
  - Existing code commented out with `/* OLDCODE */` and replaced with `/* NEWCODE */`.
  - Did not access `todo/Frontend Development.txt`.
  - Verified 0 errors with `npx tsc --noEmit`.

---

## [2026-11-04] Joker Exchange: Permanent Rack Overlap Elimination via Pure Slot Calculation & Numeric Slot Reconciliation

- **Agent**: Antigravity
- **Task**:
  1. Fix persistent rack tile overlap when performing a Joker exchange with opponent exposures (e.g. Left/Right opponent exposure).
  2. Implement the verified three-part solution detailed in `todo/phase-play-after-before-plan-joker-exchange-rack-overlap-permanent-fix.md`.
  3. Ensure all tile ID lookups, slot index restorations, and array manipulations use numeric coercion (`Number(id)`).
- **Root Cause**:
  1. **Mid-Loop `rackOrder` Mutation**: `slotFor()` was mutating `this.rackOrder` by pushing tiles mid-loop during `layoutRackTiles()`, causing later tiles (e.g. newly arriving Joker) to be positioned for a 14-tile rack while earlier tiles were positioned for a 13-tile rack. This half-tile offset produced the ~50% visual overlap on the last tile.
  2. **Type Coercion & Slot Restoration**: In `reconcileRackTiles()`, `executeJokerSwap()`, and `handleJokerExchange()`, strict equality (`===`) and `indexOf()` comparisons against GraphQL string/number IDs failed. The exchanged Joker failed to match `pendingLocalJokerSwap.jokerTileId`, falling back to `preservedOrder.push(id)` at the end of the rack rather than slotting into the vacated natural tile position.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - **Snippet 1 (`slotFor`)**: Made `slotFor(runtime)` a pure read-only getter so it never mutates `this.rackOrder` mid-loop.
    - **Snippet 2 (`layoutRackTiles`)**: Pre-sanitizes `this.rackOrder` before layout and positions tiles strictly by slot index (`forEach((tileId, index) => ...)`), ensuring `this.rackOrder.length` is immutable throughout the entire layout pass.
    - **Snippet 3 (`reconcileRackTiles`)**: Replaced split manual/API branches with numeric ID synchronization (`Number(id)`), ensuring `this.pendingLocalJokerSwap.rackIndex` is always honored so the Joker replaces the exact slot of the swapped natural tile.
    - **`executeJokerSwap` & `handleJokerExchange`**: Normalized all tile ID lookups and rack replacements using `Number()` and `.findIndex(...)`.
- **Invariants Upheld**:
  - All existing code preserved with `/* OLDCODE */` and `/* NEWCODE */`.
  - Did not read or modify `todo/Frontend Development.txt`.
  - Verified 0 errors with `npx tsc --noEmit`.

---

## [2026-11-04] Joker Exchange: Own Seat Exposure Limbo & Numeric Tile ID Synchronization

- **Agent**: Antigravity
- **Task**:
  1. Fix Joker exchange with own seat exposure (`to_seat === "bottom"`) where the returning Joker vanished, leaving the player with only 13 tiles total instead of 14.
  2. Normalize all tile ID comparisons across `scene.ts` (`Number(id)`) to prevent string vs number strict equality failures that resulted in duplicate/overlapping tiles in the rack.
  3. Create an After/Before plan document in `todo/phase-play-after-before-plan-joker-exchange-fixes.md` with simple English comments accessible to a junior developer.
- **Root Cause**:
  1. In `reconcileRackTiles()`, when the server confirmed the Joker in `this.rackTiles`, its runtime in `this.tileMap` still had `zone === "exposure"`. The loop had `if (isExposed || existingRuntime.zone === "exposure") continue;`, which skipped the Joker completely.
  2. Line 1787 had `if (runtime.zone === "exposure") this.removeFromRackOrder(runtime.vm.tile_id!)`, which stripped the Joker from `rackOrder` every time `reconcileRackTiles()` ran.
  3. Line 2035 had `existingRuntime?.zone !== "exposure"`, which blocked the Joker from ever being re-added to `this.rackOrder`.
  4. Tile IDs from GraphQL payloads were compared strictly (`===`) without coercion, causing `indexOf()` to return `-1` and `removeFromRackOrder()` to fail to remove old entries, leaving duplicate tile slots overlapping.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `reconcileRackTiles()`: line 1787 now checks `if (runtime.zone === "exposure" && this.isTileInAnyExposure(runtime.vm.tile_id!))` so tiles that left exposures are not removed from the rack order.
    - Updated `reconcileRackTiles()`: transitions runtimes with `zone === "exposure"` to `"rack"` when the server confirms them in `this.rackTiles` and they are no longer in an active exposure.
    - Updated `reconcileRackTiles()`: replaces `existingRuntime?.zone !== "exposure"` with `!isExposedNow` so returning Jokers are re-integrated into `this.rackOrder`.
    - Updated `removeFromRackOrder()`: coerces tile IDs via `Number()` to ensure clean removal regardless of string/number types.
    - Updated `handleJokerExchange()`: coerces `from_tile_id` and `joker_tile_id` to numbers and adds fallback to `img.getData("joker-swap-enabled")` for bottom exposure Joker lookup.
  - `todo/phase-play-after-before-plan-joker-exchange-fixes.md`:
    - Created detailed Before and After code snippets with clear, simple English explanations for junior developer maintainability.
- **Invariants Upheld**:
  - Strict `/* OLDCODE */` and `/* NEWCODE */` comments maintained without deleting existing code.
  - Did not read or touch `todo/Frontend Development.txt`.
  - TypeScript compilation check (`npx tsc --noEmit`) verified with 0 errors.

---

## [2026-11-04] Joker Exchange: Elimination of Wall Flight Hijack and Rack Overlap

- **Agent**: Antigravity
- **Task**:
  1. Fix Joker exchange erroneously animating tiles from the WALL instead of from the opponent exposure tray.
  2. Fix exchanged Joker landing and overlapping the adjacent/last tile in the player's bottom rack.
- **Root Cause**:
  1. `reconcileRackTiles()` in `scene.ts` had a loose check `const isPickAction = this.isWaitingForPickResponse || (this.tablePhase === GamePhaseEnum.PLAYING && this.rackTiles.length === 14);`. Because the player has 14 tiles during their turn when exchanging a Joker, this condition evaluated to true, falsely treating the incoming Joker as a wall pick and launching `animateWallTileToSeat("bottom", ...)`.
  2. `handleJokerExchange()` checked `this.tileMap.get(joker_tile_id)` first when determining `oldJokerPos`. If `reconcileRackTiles()` had already placed the Joker runtime in the rack, `oldJokerPos` took the coordinates from the bottom rack / wall rather than the opponent's exposure tray (`calledOpponentExposureTiles[to_seat]`).
  3. `animateWallTileToSeat()` created an orphaned tile sprite clone flying from the wall to the rack, while `handleJokerExchange()` concurrently tweened a second clone to the rack, resulting in two conflicting Joker sprites rendered over the same hand positions.
  4. `destJokerPos` was computed before `rackOrder` was updated with the incoming Joker, causing coordinate mismatch with the 14-tile centered layout.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `reconcileRackTiles()`: guarded `isPickAction` so that any tile arriving via Joker exchange (`isJokerSwapTile`) is strictly excluded from wall pick detection.
    - Updated `handleJokerExchange()`: resolves `oldJokerPos` directly from `calledOpponentExposureTiles[to_seat]` (or `calledBottomExposureTiles` for own exposure), ensuring the flight starts from the exposure tray.
    - Updated `handleJokerExchange()`: updates `rackOrder` first, then computes `destJokerPos` from the final updated `slotForIndex(finalRackIndex)` so the destination matches the final hand layout.
    - Set static Joker tile alpha to 0 during flight so it only becomes visible upon tween completion (`layoutRackTiles(true)`).
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`npx tsc --noEmit`) verified with 0 errors.

---

## [2026-11-04] Mahjong JOKER Exchange Animation & UI/UX (Dual-Input Support & Rack Overlap Fix)

- **Agent**: Antigravity
- **Task**:
  1. Fix returning Joker overlapping the last tile on the player's rack by cleaning up swapped natural tiles from `tileMap` when entering opponent exposures, preserving the exact rack slot index (`pendingLocalJokerSwap.rackIndex`), and synchronizing slot coordinates via unified `slotForIndex()`.
  2. Clean up zombie runtimes in `reconcileRackTiles()`: destroy sprites and remove from `tileMap` and `rackOrder` any tile marked `zone === "rack"` that the server excludes from `this.rackTiles`.
  3. Fix the default `else` branch of `reconcileRackTiles()` which was inadvertently reviving swapped-out tiles by pushing them back into `syncedOrder` and ignoring `pendingLocalJokerSwap`.
  4. Implement group-wide drop acceptance: dropping a matching natural tile anywhere on an exposure group containing a Joker triggers the swap.
  3. Implement Mode A (Double-Tap): double-tapping either the exposed Joker OR the matching natural tile in the rack triggers automated simultaneous flight of both tiles (260ms `ease-out`) without flips.
  4. Implement Mode B (Drag-and-Drop): set original rack slot opacity to 30% via ghost image while dragging, apply 40px magnetic proximity snap on exposed Joker (scale-down to 0.92 + gold target border), and smooth 200ms `ease-in-out` return animation upon cancellation.
  5. In Mode B flight: hide natural tile instantly at drop point and animate only `jokerClone` flying downward (200ms `ease-out`) into the player's rack.
  6. On landing: reveal static tiles in final positions and trigger horizontal slide layout refresh (`layoutRackTiles(true)`) to snap Joker into place.
- **Implementation**:
  - `src/app/module/business/game/phaser/animation.ts`:
    - Updated `animateJokerExchange()` to support both Mode A (simultaneous flight of both clones) and Mode B (downward flight of `jokerClone` only), with rapid `ease-out` curves and zero during-flight scale/flip distortion.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Added `slotForIndex()` helper to unify rack coordinates between flight destination and static layout.
    - Updated `reconcileRackTiles()` to place returning Joker in its original rack slot index.
    - Added `showRackDragGhost()` and `hideRackDragGhost()` to display 30% opacity ghost at the original rack slot.
    - Added `updateJokerMagneticProximity()` and `clearJokerMagneticProximity()` for 40px magnetic target docking hints.
    - Updated `handleJokerSwapDrop()` to accept drops across the entire meld group containing a Joker.
    - Added natural tile double-tap trigger (`findMatchingExposedJokerForTile()`) for Mode A.
    - Cleaned up swapped natural tiles from `tileMap` when entering opponent exposures (`to_seat !== "bottom"`).
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`npx tsc --noEmit`) verified with 0 errors.

---

## [2026-11-03] Mahjong Win: Hide Winner's Hand from Exposure Tray (Shown Exclusively in Win Popup)

- **Agent**: Antigravity
- **Task**:
  1. Do not display tiles in the exposure tray for whichever seat won the game upon Mahjong win celebration.
  2. The complete authoritative winning hand is already presented clearly inside the central Mahjong win popup dialog.
  3. Ensure non-winning opponents still have their remaining hands revealed for board review.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Updated `opponentHands` construction during game finish to skip `tableSeat` (the winner seat).
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - In `revealOpponentHands()`, cleared and destroyed existing exposure sprites for `result.winner` if `result.winner !== "bottom"`, or hid bottom exposure sprites if bottom won.
    - Added guard `if (seatPos === result.winner) continue;` so winner tiles are never rendered into the table exposure area.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-03] Joker Exchange: Authoritative Sequence Sync, Table Exposure Tile-Flip Animation & Toast

- **Agent**: Antigravity
- **Task**:
  1. Process authoritative Joker exchanges using `play.joker_exchanges` and `play.joker_exchange_seq` ordered sequence with pointer `lastSeenJokerSeq`.
  2. Fix destination positioning `destNaturalPos` so natural tiles fly directly to the Joker's slot in the table exposure area (`oldJokerPos`) instead of opponent avatar racks.
  3. Update opponent exposure sprites on exchange completion to display the incoming natural tile rather than re-showing the swapped Joker.
  4. Implement 2.5D horizontal scale flip animation (`scaleX: 0 -> targetScale`) when natural tiles land in exposures.
  5. Play `joker_exchange` sound effect and display toast notification `"<Seat Name> swapped a Joker"`.
  6. Ensure complete safety and zero breaking changes for real human user (`bottom` seat) Joker swaps.
- **Implementation**:
  - `src/app/module/business/game/state/state.ts`:
    - Added `play_joker_exchanges` and `play_joker_exchange_seq` computed signals.
    - Updated `commonSelectionFields.play` to include `joker_exchange_seq` and `joker_exchanges` fields.
  - `src/app/module/business/game/phaser/component.ts`:
    - Added `lastSeenJokerSeq` tracking. Initialized on initial load/reconnect without animating.
    - Processed new exchanges in ascending `seq` order, emitted `joker:exchange`, and showed toast notifications.
    - Retained legacy `play_last_joker_exchange` as backward compatibility fallback.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `destNaturalPos` to point to `oldJokerPos` in table exposures.
    - Updated `calledOpponentExposureTiles[to_seat]` sprite texture to the natural tile upon arrival.
  - `src/app/module/business/game/phaser/animation.ts`:
    - Added tile-flip tween on arrival in `animateJokerExchange()`.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-03] Mahjong Popup: Authoritative Winning Hand Layout via Backend `state.play.winning_hands`

- **Agent**: Antigravity
- **Task**:
  1. Render server-authoritative winning hand layout provided by backend directly on `state.play.winning_hands`.
  2. Map `winningHand.groups` (`index`, `kind`, `set_type`, `title`, `exposed`, `tile_ids`) directly to winning melds and tiles in exact sequence without heuristic guessing or regex parsing.
  3. Display card hand description (`winningHand.label`), card hand base score (`winningHand.value_mult`), and visual `"EXPOSED"` badge on exposed meld groups.
  4. Preserve legacy heuristic grouping as fallback safety when `winning_hands` is absent.
- **Implementation**:
  - `src/app/module/business/game/state/state.ts`:
    - Added `play_winning_hands` computed signal.
    - Updated `commonSelectionFields.play.winning_hands` GraphQL selection fields with all fields (`seat_id`, `rack_id`, `rule_id`, `label`, `value_kind`, `value_mult`, `groups`).
  - `src/app/module/business/game/phaser/component.ts`:
    - Updated `buildWinningOverlayData()` to locate `winningHand` matching `winnerSeatId` and `rack_id`.
    - Mapped `winningHand.groups` in exact card order with `title`, `exposed`, and tiles in server-provided sequence.
  - `src/app/module/business/game/phaser/template.html`:
    - Added `result-card-rule-label` to display `winData.ruleLabel`.
    - Added `is-exposed` CSS class and `result-card-exposed-badge` (`EXPOSED`) for exposed groups.
  - `src/app/module/business/game/phaser/style.scss`:
    - Added styles for `.result-card-rule-label` and `.result-card-exposed-badge`.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-03] Mahjong Popup: Winner Display Uses Table Player Label / Real Username

- **Agent**: Antigravity
- **Task**:
  1. Replace hardcoded "Computer (Top)", "Computer (Left)", etc. text in the Mahjong win celebration with the actual table player label (e.g. "PLAYER 2") or the real player's username when a real human player wins.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Updated `buildWinningOverlayData()` to resolve `winnerName` by checking active `playerLabelStates` on the table or falling back to `this.getPlayerName(winnerPos)` (which handles real user full names/usernames and bot profile names).
  - `src/app/module/business/game/phaser/template.html`:
    - Updated the announcement line to render `{{ winData.winnerName }} earned {{ winData.totalPoints }} points`.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-03] Mahjong Popup UI: Border Removal, 2x Title Font Size & Glassmorphic Transparency

- **Agent**: Antigravity
- **Task**:
  1. Remove border around `.discard-area-result-card` (and wall game theme variant).
  2. Increase the "MAH JONGG!" font size by 2x from previous scale (`clamp(48px, 7.6vw, 84px)`, with mobile breakpoint scaling).
  3. Make popup card background slightly transparent (`rgba(..., 0.82)` to `0.88`) with backdrop blur (`backdrop-filter: blur(8px)`).
  4. Ensure fully responsive layout across all device widths.
- **Implementation**:
  - `src/app/module/business/game/phaser/style.scss`:
    - Updated `.discard-area-result-card` to set `border: none;`, gradient background with `0.82`-`0.88` alpha, and `backdrop-filter: blur(8px)`.
    - Updated `.result-card-title` to use `clamp(48px, 7.6vw, 84px)` with `@media (max-width: 480px)` responsive fallback.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-03] Mahjong Popup: Robust Winning Hand Grouping & Arrangement as per American Mahjongg Rules

- **Agent**: Antigravity
- **Task**:
  1. Fix winning hand grouping in `PhaserComponent` so that all American Mahjongg card rules (Consecutive Runs, Odds, Evens, Year hands, Winds & Dragons, 369, Quints) are properly identified and displayed.
  2. Implement detection of suited runs (`113579`, `13579`, `246`, `135`) without wrongly adding Jokers.
  3. Implement detection of `NEWS` winds and White Dragon pairs (`00` Soap in year hands).
  4. Ensure Jokers are only assigned to valid melds of 3+ (Pung of 3, Kong of 4, Quint of 5), preventing Jokers from corrupting pairs or runs.
  5. Sort winning hand groups in canonical Mahjong card order: Flowers -> Suited combinations & their matching pungs/kongs -> Dragons -> Winds.
  6. Create plan file in `todo/phase-play-after-before-plan-mahjong-winning-hand-grouping.md`.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Replaced naive `groupConcealedTiles` with constraint-based pattern grouping solver.
    - Updated `describeMeldGroup` and `getWinningGroupSortOrder` to maintain suit and run cohesion.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-03] Tile Drag & Rack Scale Fix: Prevent Tile Enlargement During Manual Reordering

- **Agent**: Antigravity
- **Task**:
  1. Fix issue where dragging a tile or reordering tiles in the rack causes the tile to become 2x or 3x larger.
  2. Fix `showDragProxy()` and `updateDragProxy()` so the HTML overlay drag proxy accounts for high-DPI displays (`renderDpr`) and remains strictly at the identical visual size of the rack tiles.
  3. Replace improper `setScale(1)` resets with `setDisplaySize(rackTileWidth, rackTileHeight)` in `setRack()` and Charleston cleanup to prevent resetting Phaser images to raw 288px atlas texture scale.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `showDragProxy()` and `updateDragProxy()` to compute `dpr` (`this.renderDpr || window.devicePixelRatio || 1`) and divide `displayWidth`, `displayHeight`, `dragX`, and `dragY` by `dpr`.
    - In `setRack()` and Charleston cleanup: replaced `runtime.image.setScale(1)` with `runtime.image.setDisplaySize(rackTileWidth, rackTileHeight)`.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Charleston Second Round: Disappearance & Suppression of Re-Triggered Stop Popup

- **Agent**: Antigravity
- **Task**:
  1. Fix the 2nd Charleston round popup re-appearing after confirming "YES" on the "Are you sure?" confirmation popup.
  2. Ensure the 1st stop popup ("Would you like to stop the Charleston?") disappears immediately when clicking "NO" (`pass`).
  3. Ensure the confirmation popup ("Are you sure?") disappears completely when clicking "YES" (`stop-confirm`) and does not re-open the 1st popup while waiting for the server response.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Added `hasVotedSecondDecision` flag and an effect observing `this.gameState.play_pass_stage()` to reset the flag and confirmation state when leaving `SECOND_DECISION`.
    - In `setInstructionPanelOverlay()`: Suppressed re-triggering overlay when `hasVotedSecondDecision` is true, emitting `{ visible: false }` to clear Phaser background graphics.
    - In `onInstructionPanelClick()`:
      - On `pass`: Marks `hasVotedSecondDecision = true`, hides popup, clears Phaser sync, and submits vote.
      - On `stop`: Opens "Are you sure?" confirmation popup.
      - On `stop-confirm`: Marks `hasVotedSecondDecision = true`, clears confirmation popup, emits `instruction-panel:sync` (`{ visible: false }`), and submits vote without allowing the 1st popup to re-appear.
      - On `stop-cancel`: Reverts back to the 1st popup.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Wall Game: Test Helper `testWallGame()` & `closeWallGame()` Added

- **Agent**: Antigravity
- **Task**:
  1. Add dummy Wall Game test harness matching the existing `testMahjongWin()` helper.
  2. Expose `window.testWallGame()` and `window.closeWallGame()` on the global browser window.
  3. Support triggering Wall Game popup with either live seat rack hands or mock tile hands (14 tiles each for top, left, right), emitting `table:wall-game` to Phaser to render full exposure tray reveal.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Exposed `(window as any).testWallGame = () => this.testWallGame()` and `(window as any).closeWallGame = () => this.closeWallGame()` in constructor.
    - Implemented `testWallGame()`: Sets `gameOverState` & `wallGameOver`, provides fallback `discardAreaRect` if not yet computed, maps active seats or mock tiles, and emits `table:wall-game` to Phaser.
    - Implemented `closeWallGame()`: Resets `wallGameOver` and restores visibility.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Wall Game: Opponent Seat Hand Revelation via Authoritative `play.seats` Key-by-Value

- **Agent**: Antigravity
- **Task**:
  1. Fix Wall Game exposure trays not showing opponent seat tiles.
  2. Map `play.seats` key-by-value directly to visual table positions (`top`, `left`, `right`) using `seat_position_by_gseat_id()`.
  3. Emit a clean visual position-to-tile-array dictionary `{ top: tileIds, left: tileIds, right: tileIds }` to Phaser so `revealAllSeatsHandsForWallGame` accurately places each player's rack hand tiles in their exposure tray with zero intra-tile gap.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Updated Wall Game handling: Iterated over `Object.values(play.seats)`, resolved table position for each opponent seat, extracted `seat.racks[1].hand_order` (or `seat.racks[1].hand` keys), and emitted `opponentHands` via `table:wall-game`.
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `revealAllSeatsHandsForWallGame()`: Consumed visual table position map `Record<string, number[]>`, bypassing numeric seat key mismatches.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Mahjong Result Popup: Winning Hand Grouping & Canonical Rule Order

- **Agent**: Antigravity
- **Task**:
  1. Group Mahjong winning hand tiles into natural combinations (Flowers, Pairs, Pungs, Kongs, Quints) instead of lumping all suited tiles into a single combined string.
  2. Order winning hand groups strictly as per canonical Mahjong card rules: Flowers (`FFF`) $\rightarrow$ Suited numbers in ascending rank order (`55`, `77`, `999`) $\rightarrow$ Winds (`NEWS`) $\rightarrow$ Dragons (`DDDD`) $\rightarrow$ Jokers.
  3. Simplify grouping and sorting logic to maintainable procedural TypeScript without complex nested functional chaining.
- **Implementation**:
  - `src/app/module/business/game/phaser/component.ts`:
    - Updated `groupConcealedTiles()`: Separates flowers into a single group (`FFF`), aggregates identical natural tiles into combinations (Pair, Pung, Kong), and assigns Jokers to incomplete melds.
    - Updated `describeMeldGroup()`: Labels groups as `Pair of ...`, `Pung of ...`, `Kong of ...`, etc. based on representative natural tiles.
    - Added `getWinningGroupSortOrder()`: Implements canonical NMJL sort weights (Flowers: 100, Suited: $200 + \text{rank} \times 10$, Winds: 400, Dragons: 500, Jokers: 600).
    - Updated `buildWinningOverlayData()`: Sorts all combined winning hand groups by `getWinningGroupSortOrder()`.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Exposure Trays: Meld Ordering, Joker Exchange Slot Alignment & Reveal Zero Gap

- **Agent**: Antigravity
- **Task**:
  1. Fix bottom player's Joker exchange alignment bug where swapping a Joker from one meld (e.g. 2 Crack Pung) caused the natural replacement tile to jump to or overlap an adjacent meld (e.g. 4 Crack Kong).
  2. Reconstruct `calledBottomExposureTiles` strictly in authoritative meld order inside `renderExposuresSet()`.
  3. Ensure natural replacement tile inherits `meld-index` from the swapped Joker in `processJokerExchange()`.
  4. Apply 0 intra-group gap and group gap formatting to opponent reveals during Mahjong and Wall Game (`revealOpponentHands` and `revealAllSeatsHandsForWallGame`).
  5. Update opponent exposure scrolling limits (`maxLeftExposureScroll`, `maxRightExposureScroll`, `maxTopExposureScroll`) to match zero-gap intra-meld dimensions.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - In `renderExposuresSet()`: Reconstructed `this.calledBottomExposureTiles` in exact meld order, preventing swapped tiles from appending out-of-order to the end of the tray.
    - In `handleJokerExchange()` / `processJokerExchange()`: Stored `jokerTile.image.getData("meld-index")` and assigned it to `naturalTile.image`, preserving slot position.
    - In `animateCalledDiscardToBottomExposure()`: Assigned newly called claim tiles the next available `meld-index`.
    - In `revealOpponentHands()` and `revealAllSeatsHandsForWallGame()`: Assigned revealed hand tiles their own `revealMeldIndex` and updated layout through `layoutCalledOpponentExposureTiles()`.
    - In `maxLeftExposureScroll()`, `maxRightExposureScroll()`, `maxTopExposureScroll()`: Calculated total content height/width using 0 intra-group gap + groupGap between melds.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Exposure Trays: Flush Intra-Meld Tiles (0 Gap) & Group Gap Between Melds

- **Agent**: Antigravity
- **Task**:
  1. Remove gap between exposure tiles belonging to the same meld (e.g. Sextet `FFFFFF`, Kong `1111`) so they touch flush edge-to-edge.
  2. Add distinct visual group gap between different melds (e.g. between Sextet of flowers and Kong of 1-Bam) across all exposure trays (Bottom, Top, Left, Right).
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `renderExposuresSet()`: Tagged each tile image with its `meld-index` ($0, 1, 2, \dots$) for both local and opponent exposures.
    - Updated `calledBottomExposureTilePosition()`: Used $\text{startX} + i \times W + M \times G$, eliminating gaps between tiles within the same meld while inserting `groupGap` between separate melds.
    - Updated `calledOpponentExposureTilePosition()`: Applied the same meld-aware positioning formula for top, left, and right exposure trays.
    - Updated `maxBottomExposureScroll()`: Included group gaps in total content width calculation for scrolling.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Discard Area UI: Further 10% Tile Size Reduction

- **Agent**: Antigravity
- **Task**: Reduce discarded tile size by an additional 10% from the previous size (`scale = 0.81` instead of `0.90`).
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `discardGrid()`: Set `scale = 0.81` (`0.90 * 0.90`), reducing tile dimensions by a further 10% while keeping zero gap flush positioning.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

---

## [2026-11-02] Discard Area UI Upgrade: Sizing Expansion, 10% Tile Reduction & Zero Gap

- **Agent**: Antigravity
- **Task**:
  1. Increase the discard area dimensions across all responsive screen profiles (Desktop, Tablet, Mobile) by reducing outer insets to utilize maximum available table space without touching exposure trays.
  2. Reduce discard tile size by 10% from the current rack size (`scale = 0.90`).
  3. Remove gaps between discard tiles (`gapX = 0`, `gapY = 0`) so tiles sit seamlessly flush edge-to-edge.
- **Implementation**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`:
    - Updated `discardGrid()`: Set `gapX = 0`, `gapY = 0`, and `scale = 0.90`.
  - `src/app/module/business/game/phaser/layout/game.ts`:
    - In `computeDesktopLayout()`: Reduced horizontal margin from `0.055` to `0.015`.
    - In `computeTabletPortraitLayout()`: Reduced horizontal margin from `0.055` to `0.015`.
    - In `computeTabletLandscapeLayout()`: Reduced horizontal margin from `0.055` to `0.015` and removed arbitrary `+ 35` height reduction.
    - In `computeMobileLandscapeLayout()`: Reduced horizontal margin from `0.040` to `0.012`.
    - In `computeMobilePortraitLayout()`: Reduced horizontal margin from `0.035` to `0.012`.
- **Invariants Upheld**:
  - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 code deletions.
  - Full responsiveness maintained across all screen profiles.
  - TypeScript compilation check (`tsc -p tsconfig.app.json --noEmit`) verified with 0 errors.

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



