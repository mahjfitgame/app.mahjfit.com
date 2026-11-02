# Before & After Plan: Claim Exposure & Discard Validation Guards

## 1. Problem Description & Root Cause Analysis

### Identified Problem
1. When a player claims a tile from an opponent's discard, the game stage becomes `NEED_EXPOSURE`.
2. If the player moves only 1 tile to the exposure panel (total = 2 tiles, which is less than the required minimum of 3 for a valid meld) and clicks the **MAHJONG** button:
   - `handleHtmlMahjongAction()` in `scene.ts` immediately attempted to submit the incomplete 2-tile exposure to the server (`create.exposure`).
   - The server correctly rejected it with `INVALID_TILE_COUNT`, and rejected Mahjong with `Need to pick tile first.`.
   - **However, on the client**: `handleHtmlMahjongAction()` had already prematurely set `this.turnStage = GameTurnStageEnum.NEED_DISCARD` and cleared `activeExposureBuildTileIds = []`.
3. Because the client turn stage was forcibly flipped to `NEED_DISCARD`, the guard `if (activeExposureBuildTileIds.length < 3)` inside `snapTileToDiscard()` was completely bypassed.
4. Furthermore, `canDiscard` in `state.ts` incorrectly evaluated `stage === GameTurnStageEnum.NEED_EXPOSURE` as allowing a discard.
5. In `component.ts`, `onLocalPlayerDiscard` intercepted the discard and did not send `publishDiscardTile` because the server was still in `NEED_EXPOSURE`. Because the discard was never sent and `canDiscard` remained `true` locally, the player was able to drag and drop multiple tiles into the discard area.

---

## 2. Expected Behavior
1. **Exposure Completion Required**: A player **cannot** discard any tile while in `NEED_EXPOSURE` until a valid exposure (minimum 3 tiles: Pung/Kong/Quint) is completed and confirmed.
2. **Mahjong Click Validation**: Clicking the MAHJONG button during `NEED_EXPOSURE` must **not** prematurely force `this.turnStage = NEED_DISCARD` or clear the exposure build state if the exposure is incomplete (`< 3` tiles).
3. **Strict Discard Guard**: In `state.ts`, `canDiscard` must **only** be `true` when the stage is strictly `NEED_DISCARD`.
4. **Single Discard Lock**: Once a player discards a tile, `this.canDiscard` is immediately locked (`false`) locally so no second or subsequent tile can ever be dragged to the discard area.

---

## 3. Files to Modify
1. `src/app/module/business/game/state/state.ts`
2. `src/app/module/business/game/phaser/scenes/scene.ts`
3. `src/app/module/business/game/phaser/component.ts`

---

## 4. Detailed Before & After Code Snippets

---

### File 1: `src/app/module/business/game/state/state.ts`
**Location**: `canDiscard` computed signal (around lines 404–412)

#### BEFORE:
```typescript
    // ████ canDiscard SIGNAL ███████████████████████████████████████████
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const stage = this.play_turn_stage();
        //const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD || stage === 2 || stage === 'NEED_DISCARD' || stage === GameTurnStageEnum.NEED_EXPOSURE || stage === 3 || stage === 'NEED_EXPOSURE';
        const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD || stage === GameTurnStageEnum.NEED_EXPOSURE;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING || this.play_phase() === ("EXPOSURE_CREATE" as any);

        return isMyTurn && needsDiscard && isPlayingPhase;
    });
```

#### AFTER:
```typescript
    // ████ canDiscard SIGNAL ███████████████████████████████████████████
    /* OLDCODE
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const stage = this.play_turn_stage();
        //const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD || stage === 2 || stage === 'NEED_DISCARD' || stage === GameTurnStageEnum.NEED_EXPOSURE || stage === 3 || stage === 'NEED_EXPOSURE';
        const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD || stage === GameTurnStageEnum.NEED_EXPOSURE;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING || this.play_phase() === ("EXPOSURE_CREATE" as any);

        return isMyTurn && needsDiscard && isPlayingPhase;
    });
    OLDCODE */
    /* NEWCODE */
    // Only allow discard when stage is strictly NEED_DISCARD. Discard is forbidden during NEED_EXPOSURE.
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const stage = this.play_turn_stage();
        const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING;

        return isMyTurn && needsDiscard && isPlayingPhase;
    });
    /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Change 2.1: Prevent premature `NEED_DISCARD` in `handleHtmlMahjongAction`
**Location**: around lines 3598–3617

#### BEFORE:
```typescript
  private handleHtmlMahjongAction(): void {
    if (this.turnStage === GameTurnStageEnum.NEED_EXPOSURE && this.activeExposureBuildTileIds.length > 0) {
      this.callbacks.onLocalPlayerExposureCreate?.([...this.activeExposureBuildTileIds]);
      this.activeExposureBuildTileIds = [];
      this.exposureBuildAsset = undefined;
      this.turnStage = GameTurnStageEnum.NEED_DISCARD;
      for (const button of this.exposureCloseButtons.values()) {
        button.destroy();
      }
      this.exposureCloseButtons.clear();

      // Delay the mahjong declare slightly to ensure backend processes the exposure first
      setTimeout(() => {
        this.callbacks.onMahjongDeclare?.();
      }, 500);
    } else {
      this.callbacks.onMahjongDeclare?.();
    }
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private handleHtmlMahjongAction(): void {
    if (this.turnStage === GameTurnStageEnum.NEED_EXPOSURE && this.activeExposureBuildTileIds.length > 0) {
      this.callbacks.onLocalPlayerExposureCreate?.([...this.activeExposureBuildTileIds]);
      this.activeExposureBuildTileIds = [];
      this.exposureBuildAsset = undefined;
      this.turnStage = GameTurnStageEnum.NEED_DISCARD;
      for (const button of this.exposureCloseButtons.values()) {
        button.destroy();
      }
      this.exposureCloseButtons.clear();

      // Delay the mahjong declare slightly to ensure backend processes the exposure first
      setTimeout(() => {
        this.callbacks.onMahjongDeclare?.();
      }, 500);
    } else {
      this.callbacks.onMahjongDeclare?.();
    }
  }
  OLDCODE */
  /* NEWCODE */
  private handleHtmlMahjongAction(): void {
    if (this.turnStage === GameTurnStageEnum.NEED_EXPOSURE && this.activeExposureBuildTileIds.length > 0) {
      // If exposure does not have at least 3 tiles, do not submit an invalid exposure or force NEED_DISCARD
      if (this.activeExposureBuildTileIds.length < 3) {
        this.callbacks.onMahjongDeclare?.();
        return;
      }

      this.callbacks.onLocalPlayerExposureCreate?.([...this.activeExposureBuildTileIds]);
      this.activeExposureBuildTileIds = [];
      this.exposureBuildAsset = undefined;
      for (const button of this.exposureCloseButtons.values()) {
        button.destroy();
      }
      this.exposureCloseButtons.clear();

      // Delay the mahjong declare slightly to ensure backend processes the exposure first
      setTimeout(() => {
        this.callbacks.onMahjongDeclare?.();
      }, 500);
    } else {
      this.callbacks.onMahjongDeclare?.();
    }
  }
  /* NEWCODE */
```

#### Change 2.2: Lock discard immediately and block incomplete exposures in `snapTileToDiscard`
**Location**: around lines 7958–7985

#### BEFORE:
```typescript
    if (this.turnStage === GameTurnStageEnum.NEED_EXPOSURE) {
      // console.log(`[DEBUG EXPOSURE] Attempting discard. activeExposureBuildTileIds:`, this.activeExposureBuildTileIds);
      if (this.activeExposureBuildTileIds.length < 3) {
        // console.log(`[DEBUG EXPOSURE] BLOCKED! Length is ${this.activeExposureBuildTileIds.length} which is < 3`);
        // Must build a valid group of 3 or 4 tiles before discarding
        this.returnTileToSlot(runtime);
        return;
      }
      // console.log(`[DEBUG EXPOSURE] SUCCESS! Confirming exposure with IDs:`, this.activeExposureBuildTileIds);
      // Confirm the exposure
      this.callbacks.onLocalPlayerExposureCreate?.([...this.activeExposureBuildTileIds]);
      this.activeExposureBuildTileIds = [];
      this.turnStage = GameTurnStageEnum.NEED_DISCARD;

      for (const button of this.exposureCloseButtons.values()) {
        button.destroy();
      }
      this.exposureCloseButtons.clear();
    }

    // Always clear the exposure build state on discard, as the turn is over
    this.turnStage = GameTurnStageEnum.NEED_DISCARD;
    this.activeExposureBuildTileIds = [];
    this.exposureBuildAsset = undefined;
```

#### AFTER:
```typescript
    /* OLDCODE
    if (this.turnStage === GameTurnStageEnum.NEED_EXPOSURE) {
      // console.log(`[DEBUG EXPOSURE] Attempting discard. activeExposureBuildTileIds:`, this.activeExposureBuildTileIds);
      if (this.activeExposureBuildTileIds.length < 3) {
        // console.log(`[DEBUG EXPOSURE] BLOCKED! Length is ${this.activeExposureBuildTileIds.length} which is < 3`);
        // Must build a valid group of 3 or 4 tiles before discarding
        this.returnTileToSlot(runtime);
        return;
      }
      // console.log(`[DEBUG EXPOSURE] SUCCESS! Confirming exposure with IDs:`, this.activeExposureBuildTileIds);
      // Confirm the exposure
      this.callbacks.onLocalPlayerExposureCreate?.([...this.activeExposureBuildTileIds]);
      this.activeExposureBuildTileIds = [];
      this.turnStage = GameTurnStageEnum.NEED_DISCARD;

      for (const button of this.exposureCloseButtons.values()) {
        button.destroy();
      }
      this.exposureCloseButtons.clear();
    }

    // Always clear the exposure build state on discard, as the turn is over
    this.turnStage = GameTurnStageEnum.NEED_DISCARD;
    this.activeExposureBuildTileIds = [];
    this.exposureBuildAsset = undefined;
    OLDCODE */
    /* NEWCODE */
    if (this.turnStage === GameTurnStageEnum.NEED_EXPOSURE) {
      // Must build a valid group of at least 3 tiles before discarding
      if (this.activeExposureBuildTileIds.length < 3) {
        this.returnTileToSlot(runtime);
        return;
      }
      // Confirm the exposure
      this.callbacks.onLocalPlayerExposureCreate?.([...this.activeExposureBuildTileIds]);
      this.activeExposureBuildTileIds = [];
      this.exposureBuildAsset = undefined;

      for (const button of this.exposureCloseButtons.values()) {
        button.destroy();
      }
      this.exposureCloseButtons.clear();
    }

    // Lock discard mode immediately so no multiple tiles can ever be discarded in the same turn
    this.canDiscard = false;
    this.activeExposureBuildTileIds = [];
    this.exposureBuildAsset = undefined;
    /* NEWCODE */
```

---

### File 3: `src/app/module/business/game/phaser/component.ts`
**Location**: `onLocalPlayerDiscard` (around lines 900–908)

#### BEFORE:
```typescript
          onLocalPlayerDiscard: (tileId) => {
            if (this.gameState.play_turn_stage() === GameTurnStageEnum.NEED_EXPOSURE) {
              this.pendingDiscardTileId = tileId;
              // console.log(`[Component] Saved pending discard tile ${tileId} while waiting for exposure API...`);
            } else {
              this.gameState.publishDiscardTile(tileId);
            }
            this.knownDiscardTileIds.add(tileId);
          },
```

#### AFTER:
```typescript
          /* OLDCODE
          onLocalPlayerDiscard: (tileId) => {
            if (this.gameState.play_turn_stage() === GameTurnStageEnum.NEED_EXPOSURE) {
              this.pendingDiscardTileId = tileId;
              // console.log(`[Component] Saved pending discard tile ${tileId} while waiting for exposure API...`);
            } else {
              this.gameState.publishDiscardTile(tileId);
            }
            this.knownDiscardTileIds.add(tileId);
          },
          OLDCODE */
          /* NEWCODE */
          onLocalPlayerDiscard: (tileId) => {
            // Discarding is strictly prohibited during incomplete NEED_EXPOSURE
            if (this.gameState.play_turn_stage() === GameTurnStageEnum.NEED_EXPOSURE) {
              return;
            }
            this.gameState.publishDiscardTile(tileId);
            this.knownDiscardTileIds.add(tileId);
          },
          /* NEWCODE */
```

---

## 5. Verification & Testing Strategy
1. **Compilation Check**: Run `npx tsc -p tsconfig.app.json --noEmit` to verify 0 errors.
2. **Behavioral Invariants**:
   - Verify that during `NEED_EXPOSURE`, dragging a tile to the discard area without at least 3 tiles in exposure snaps the tile back to the rack.
   - Verify that clicking MAHJONG with `< 3` tiles in exposure does not advance the stage to `NEED_DISCARD`.
   - Verify that once a tile is discarded, `this.canDiscard` becomes `false` immediately, preventing multiple discards.
   - Strict `OLDCODE` / `NEWCODE` pattern with 0 code deletions.

