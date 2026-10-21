# Feature Map: Mahjfit Client

This document provides a comprehensive inventory of all major features implemented in the Mahjfit client, detailing entry points, key symbols, state dependencies, network contracts, and test coverage.

---

## 1. Feature Inventory Table

| Feature Key | Feature Name | Primary Entry Point | State Owner | Primary External Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `FEAT-001` | **Game Lifecycle & Bootstrap** | `GameComponent` / `GameRoute` | `GameState` | `@bfw/api-sdk` (GraphQL Game & Engine) |
| `FEAT-002` | **Phaser Table & Tile Rendering**| `PhaserComponent` / `PhaserScene` | `PhaserState` / `GameState` | Phaser 4, Tile Atlases (1x, 2x) |
| `FEAT-003` | **Bottom Rack & Tile Drag/Drop** | `PhaserScene` | `PhaserState` / `GameState` | Phaser Input / Pointer Events |
| `FEAT-004` | **Charleston Passing Subsystem** | `PhaserScene` / `instructionPanel`| `GameState.charlestonState` | WS: `publishActionCharlestone` |
| `FEAT-005` | **Turn Play: Pick from Wall** | `PhaserScene` / `claimPanel` | `GameState.canPickTile` | WS: `publishActionPickTile` |
| `FEAT-006` | **Turn Play: Discard Tile** | `PhaserScene` | `GameState.canDiscard` | WS: `publishActionDiscardTile`, Audio |
| `FEAT-007` | **Claim / Call Offer Window** | `claimPanelOverlay` | `GameState.active_claim` | WS: `publishActionClaimTile` |
| `FEAT-008` | **Call Reversal Subsystem** | `PhaserScene` | `GameState` | WS: `publishActionReverseCallTile` |
| `FEAT-009` | **Joker Exchange Subsystem** | `PhaserScene` | `GameState` | WS: `publishActionExchangeJoker` |
| `FEAT-010` | **Exposure Trays & Melds** | `PhaserScene` | `GameState.all_seat_exposures`| WS: `publishActionCreateExposure` |
| `FEAT-011` | **Discard Grid & Masked Scroll**| `PhaserScene` | `PhaserScene.discardContainer` | Pointer / Wheel Events |
| `FEAT-012` | **Tile Sorting (Suit vs Rank)** | `PhaserLayoutUi` (HUD Sort btn) | `GameState` / `PhaserScene` | WS: `publishActionOrderTiles` |
| `FEAT-013` | **Dead Hand Challenges** | `deadHandSelectionState` modal | `GameState.all_seat_dead_states`| WS: `publishDeclareDead` (Stubbed) |
| `FEAT-014` | **Mah Jongg Win Celebration** | `winningOverlayData` / modal | `GameState.play_winner_seat_ids` | WS: `publishActionCallMahjong` |
| `FEAT-015` | **Sound & Voice Announcer** | `PhaserSound` | `PhaserSound` | Web Audio, Audio Sprites |
| `FEAT-016` | **Device Layout & Safe-Area** | `PhaserLayoutGame` / `device` | `PhaserLayoutDevice` | `@capacitor/screen-orientation` |
| `FEAT-017` | **Debug State & Inspection** | `GameComponent` sidebar | `GameState._development` | `environment.DEBUG` |
| `FEAT-018` | **Area Routing & Authentication**| `AreaRoute` / `AreaGuard` | `ContextProfileService` | Router, Auth API |

---

## 2. Deep-Dive Feature Specifications

### FEAT-001: Game Lifecycle & Bootstrap
- **Purpose**: Creates or joins a Mahjong game session, establishes WebSocket connectivity, joins table and player rooms, and manages board teardown.
- **Entry Points**:
  - `src/app/module/business/game/route.ts` (`GameRoute`, `GameInstanceRoute`)
  - `src/app/module/business/game/component.ts` (`GameComponent.ngOnInit`, `restartGame`, `quitGame`)
- **Key Symbols**:
  - `GameComponent.gkeyid`: Input signal containing URL route param.
  - `GameState.createGame()`: GraphQL mutation creating game instance.
  - `GameState.startGame()`: GraphQL mutation retrieving initial game payload.
  - `GameState.afterGameStart()`: Connects Socket.IO, joins game group, joins personal subject.
- **State Dependencies**: `_urlGkeyid`, `createdGame`, `_game`, `_play`, `_personal`.
- **Existing Behavior to Preserve**:
  - Accessing `/game` without key creates a game and redirects to `/game/:gkeyid`.
  - Restarting game destroys Phaser canvas and sleeps 100ms before re-initializing to avoid WebGL context collision.
- **Test Coverage**: No existing automated spec. (Risk: HIGH).

---

### FEAT-002: Phaser Table & Tile Rendering
- **Purpose**: Renders the 2.5D wooden Mahjong table surface, player seat racks, tile faces, shadow depth, and exposure trays.
- **Entry Points**:
  - `src/app/module/business/game/phaser/component.ts` (`PhaserComponent`)
  - `src/app/module/business/game/phaser/scenes/scene.ts` (`PhaserScene.create`, `preload`)
- **Key Symbols**:
  - `PhaserScene.tableBgImage`: Table wood surface.
  - `GameService.selectTileAtlas`: Resolves 1x or 2x atlas based on display width.
  - `GameService.assetBaseName`: Maps tile category, type, and rank to texture frame name (e.g. `bam_1`, `dragon_green`, `flower_3`).
- **State Dependencies**: `allTiles` catalogue, `rackTiles`.
- **Existing Behavior to Preserve**:
  - Tile aspect ratio of 1.43 must be maintained across all zoom/scale levels.
- **Test Coverage**: No direct visual unit test. Covered indirectly by claim queue specs.

---

### FEAT-003: Bottom Rack & Tile Drag/Drop
- **Purpose**: Manages the human player's active 14-tile rack, tile selection, drag-and-drop to table (to discard) or exposure tray, and slot snapping.
- **Entry Points**:
  - `src/app/module/business/game/phaser/scenes/scene.ts`
  - `src/app/module/business/game/phaser/animation.ts` (`animateRackTileSelection`, `animateRackTileReturn`)
- **Key Symbols**:
  - `PhaserScene.selectedIds`: Set of currently selected tile IDs.
  - `PhaserScene.rackOrder`: Array of tile IDs reflecting left-to-right rack order.
  - `PhaserScene.activeDragTile`: Tile currently being dragged.
- **State Dependencies**: `personal_seat_rack_first_hand()`, `canDiscard()`.
- **Existing Behavior to Preserve**:
  - Dropping tile outside legal discard drop zones springs back to original rack slot via `Back.easeOut` tween.
  - Tap vs. drag disambiguation uses `dragDistanceThreshold = 35` and `dragTimeThreshold = 60`.

---

### FEAT-004: Charleston Passing Subsystem
- **Purpose**: Implements the American Mahjong Charleston passing phase (First round: Right -> Across -> Left; Second round: Left -> Across -> Right with vote; Courtesy pass: 0-3 tiles across).
- **Entry Points**:
  - `src/app/module/business/game/phaser/scenes/scene.ts` (`setPassDirection`)
  - `src/app/module/business/game/phaser/template.html` (`instructionPanelOverlay`)
- **Key Symbols**:
  - `GameState.charlestonState`: Computed Charleston phase, round, direction, and tile count.
  - `GameState.publishCharlestone(tileIds)`: Sends 3 passed tile IDs to server.
  - `GameState.publishCharlestoneSecondRoundVote(vote)`: Submits vote to continue or stop Charleston.
- **Existing Behavior to Preserve**:
  - Passing requires exactly 3 tiles selected (except Courtesy pass which permits 0 to 3).
  - PASS button in instruction panel remains disabled until required tile count is selected.
  - Visual passing animation flies tiles across table to recipient seat.

---

### FEAT-005 & FEAT-006: Turn Play (Pick & Discard)
- **Purpose**: Handles standard turn cycle: player picks from wall when it is their turn, or discards an active rack tile.
- **Entry Points**:
  - `PhaserScene.pickFromWall()` / `claimPanelOverlay` PICK button
  - `PhaserScene.discardTile()` / dragging tile to center drop zone
  - `PhaserComponent.onLocalPlayerDiscard`
- **Key Symbols**:
  - `GameState.canPickTile`: True when personal turn and turn stage is `PICK`.
  - `GameState.canDiscard`: True when personal turn and turn stage is `DISCARD`.
  - `GameState.publishPickTile()`: Emits `PICKFROMWALL` action.
  - `GameState.publishDiscardTile(tileId)`: Emits `DISCARD` action.
  - `PhaserSound.playTileDiscardVoice(soundKey)`: Plays localized tile call speech audio.
  - `PhaserComponent.pendingDiscardTileId`: Deferred discard slot during exposure phase.
- **Deferred Discard During `NEED_EXPOSURE` Flow**:
  1. When a player claims a tile, the game enters `GameTurnStageEnum.NEED_EXPOSURE`.
  2. If the user drags and drops a tile to discard before exposure declaration is committed, `PhaserComponent.onLocalPlayerDiscard(tileId)` intercepts the action:
     - Instead of immediately dispatching `publishDiscardTile`, it stores `this.pendingDiscardTileId = tileId`.
  3. Once the exposure meld API call succeeds and the server broadcasts turn stage update to `GameTurnStageEnum.NEED_DISCARD`, the Angular reactive effect in `PhaserComponent` detects the stage change:
     - `this.gameState.publishDiscardTile(this.pendingDiscardTileId)` is automatically dispatched to the server.
     - `this.pendingDiscardTileId = null` resets the pending state.
  4. *Unverified Edge Cases & Risks*: If the exposure action fails, is cancelled, or if the call is reversed (`publishReverseCallTile`), whether `pendingDiscardTileId` is properly discarded or preserved across re-prompts is an unverified boundary risk requiring behavioral testing.
- **Existing Behavior to Preserve**:
  - Wall count decrements on pick.
  - Discard tile flies to discard grid and triggers discard voice speech.
  - Enlarged discarded tile visual appears in center between action buttons.

---

### FEAT-007 & FEAT-008: Claims, Calls & Reversals
- **Purpose**: Allows players to claim the most recently discarded tile for Pung (3 of a kind), Kong (4), Quint (5), Sextet (6), or Mah Jongg, and reverse the call if no rack tiles have been committed.
- **Entry Points**:
  - `src/app/module/business/game/phaser/template.html` (`claimPanelOverlay`)
  - `src/app/module/business/game/phaser/scenes/scene.ts`
- **Key Symbols**:
  - `GameState.active_claim`: Computed active claim offer.
  - `GameState.publishClaimAction(action, tileId)`: Emits claim intent.
  - `GameState.publishReverseCallTile()`: Reverses call before rack tile commitment.
  - `PhaserScene.processPendingClaimTile()`: Scheduled via `setTimeout(..., 50)` on `table:turn_stage` change. Promotes claimed tile zone from `"discard"` to `"rack"` and moves tile sprite to bottom exposure tray or opponent exposure tween.
- **State Dependencies**: `play_claim`, `play_turn_stage`, `turnStage == NEED_EXPOSURE`.
- **Existing Behavior to Preserve**:
  - Instruction prompt changes to "Complete the exposure, then discard a tile".
  - Returning called tile to discard area cancels call and ends turn.

---

### FEAT-009: Joker Exchange
- **Purpose**: Allows a player whose turn it is to exchange a matching natural tile from their rack for an exposed Joker on any player's rack.
- **Entry Points**:
  - `PhaserScene.handleJokerExchange`
  - `GameState.publishJokerExchange`
- **Key Symbols**:
  - `publishJokerExchange(targetJokerTileId, rackReplacementTileId, fromSeatId, toSeatId, targetRackId)`
  - Sound: `joker_exchange.mp3` (loaded standalone in `PhaserScene.preload`)
- **Existing Behavior to Preserve**:
  - Dedicated Joker exchange animation and audio confirmation.

---

### FEAT-010 & FEAT-011: Exposures & Discard Grid
- **Purpose**: Displays declared melds on rack exposure panels and tracks all discarded tiles in a scrollable, masked grid in the center of the table.
- **Entry Points**:
  - `PhaserScene.discardContainer`, `PhaserScene.discardMask`
  - `PhaserScene.layoutCalledOpponentExposureTiles`
  - `GameState.publishMoveTilesToExposurePanel(tile_ids, targetRackId)`
- **Key Symbols**:
  - `PhaserScene.discardScrollY`: Vertical scroll offset for discards.
  - `PhaserScene.leftExposureScrollY`, `rightExposureScrollY`, `topExposureScrollX`, `bottomExposureScrollX`.
  - `PhaserScene.deferredClaimVisualUpdates`: Queue buffering animations while claims/discards fly.
- **Sequential Visual Event Queue**:
  - Visual updates (`"opponent-discard"`, `"opponent-pick"`, `"exposures"`, `"discards"`, `"mahjong"`) are intercepted by `deferClaimVisualUpdate()` when `activeClaimPresentation` is non-null.
  - `coalesceDeferredQueue()` deduplicates stale interim snapshots of discards and exposures.
  - `processNextDeferredVisualUpdate()` drains items sequentially with designated step delays (e.g. `CLAIM_DISCARD_FLIGHT_MS = 320ms`) to avoid tween collisions.
- **Exposure Target Rack ID Parameter Discrepancy**:
  - `GameState.publishMoveTilesToExposurePanel(tile_ids: number[], targetRackId: number)` accepts `targetRackId`, but line 1782 in `state.ts` hardcodes `rack_id: this.personal_seat_rack_first_rack_id()`.
  - *Risk*: In single-rack games this has no ill effect; if multi-tier or multi-rack structures are introduced in future versions, melds will inadvertently target Rack 1.
- **Existing Behavior to Preserve**:
  - Drag or mouse wheel inside discard area smoothly scrolls discards without bleeding outside discard bounds.
  - Calling a tile removes it from the discard grid.

---

### FEAT-012: Tile Sorting (Suit vs Rank)
- **Purpose**: Toggles between sorting hand by Suit and sorting hand by Rank with a single click.
- **Entry Points**:
  - HUD Sort button in `PhaserLayoutUi` / `PhaserScene`
  - `GameState.publishOderPersonalRackTiles(sortBy)` *[sic - spelling with "Oder" reflects the exact source identifier in state.ts]*
- **Key Symbols & Sequential Processing**:
  - `GameState.publishOderPersonalRackTiles(sortBy)`: Emits server GraphQL mutation requesting re-sorted hand order.
  - `this.game.events.on("rack:order", (order: number[]) => ...)`: Event listener in `scene.ts:457-482`. Reconciles incoming order with current local `rackOrder` (handling exposed/discarded tiles), calls `reindexRackRuntimeSlots()`, and animates tiles into their sorted rack slots via `layoutRackTiles(true)`.
- **Existing Behavior to Preserve**:
  - Strictly follows NMJL sorting order (Flowers -> Numbers [Bam, Dot, Crack] -> Dragons [G, R, W] -> Winds [N, S, E, W] -> Jokers) as returned by server `hand_order`.

---

### FEAT-013: Dead Hand Challenges
- **Purpose**: Allows challenging an opponent's hand as dead (due to impossible hands on card, 4 dead key tiles discarded, or false Mah Jongg declaration).
- **Entry Points**:
  - HUD Dead Hand button -> `deadHandSelectionState` modal
- **Key Symbols**:
  - `GameState.publishDeclareDead(targetSeatId)` (Currently marked TODO pending backend API support).
- **Known Risk**: Backend API SDK method not yet exposed.

---

### FEAT-014: Mah Jongg Win Celebration
- **Purpose**: Celebrates a confirmed winning Mah Jongg hand, displays winning score, base points, bonus, and meld breakdown.
- **Entry Points**:
  - `PhaserComponent.mahjongGameOver` / `winningOverlayData`
  - `PhaserScene.showMahjongWinCelebration`
- **Key Symbols**:
  - `WinningOverlayData`: Winner seat, name, baseScore, bonus, totalPoints, `winningHandGroups`.

---

### FEAT-015: Sound & Voice Announcer
- **Purpose**: Low-latency tile announcements and UI feedback.
- **Entry Points**: `PhaserSound` (`sound.ts`)
- **Key Symbols**:
  - Audio sprites: `assets/sounds/tiles.json`, `assets/sounds/effects.json`.
  - Voices: 1-9 Bam, 1-9 Crack, 1-9 Dot, East, South, West, North, Red, Green, Soap, Flower, Joker.

---

### FEAT-016: Device Layout & Safe-Area Inset Adapter
- **Purpose**: Dynamic responsive scaling across iPhone, iPad, Android tablets, and desktop displays.
- **Entry Points**:
  - `PhaserLayoutDevice` (`device.ts`)
  - `PhaserLayoutGame` (`game.ts`)
  - `PhaserLayoutUi` (`ui.ts`)
- **Key Symbols**:
  - `DeviceLayoutMode`: `"phone-portrait" | "phone-landscape" | "tablet-portrait" | "tablet-landscape" | "desktop"`.

---

### FEAT-017: Debug State & Inspection Panel
- **Purpose**: Real-time diagnostic tool for developers and QA to inspect game states and report bug snapshots.
- **Entry Points**:
  - `GameComponent.toggleDebug()`, `sendDebugEmail()`
  - `src/app/module/business/game/template.html` (`<aside class="debug-panel">`)
- **Key Symbols**:
  - `GameState.development_with_actual_tiles`: Decodes physical tile IDs into human-readable tile codes.
