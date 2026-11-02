# Before & After Plan: Allow Discard on Complete Exposure

## 1. Problem Description & Root Cause Analysis

### Identified Problem
After building a valid exposure meld ($\ge 3$ tiles) during `NEED_EXPOSURE`, the instruction banner correctly updates to **"Discard a tile"**.
However, when the player attempts to discard a tile by dragging and dropping to the discard area or by double-clicking, the tile is not discarded.

### Root Cause
In `src/app/module/business/game/state/state.ts`:
```typescript
const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD;
```
Because `stage === GameTurnStageEnum.NEED_EXPOSURE` was removed from `needsDiscard`, `this.gameState.canDiscard()` evaluates to `false` during `NEED_EXPOSURE`.
In `scene.ts`:
- Lines 2617 & 2545: `if (this.canDiscard && this.isInsidePlayableDiscardArea(...))` fails because `this.canDiscard` is `false`.
- Line 2674: `if (this.canDiscard)` (double-click to discard) fails because `this.canDiscard` is `false`.

Therefore, Phaser completely ignores the player's discard attempt and snaps the tile back to the rack.

### The Fix
1. In `state.ts`: Include `GameTurnStageEnum.NEED_EXPOSURE` in `canDiscard` so that Phaser allows discard interactions during a player's turn in `NEED_EXPOSURE`.
2. In `scene.ts`: `snapTileToDiscard()` already enforces the validation:
   - If `activeExposureBuildTileIds.length < 3`: Discard is strictly BLOCKED and tile returns to rack (`returnTileToSlot`).
   - If `activeExposureBuildTileIds.length >= 3`: Discard is ACCEPTED, exposure is submitted, and `this.canDiscard = false;` immediately locks out multiple discards.

---

## 2. Expected Behavior
1. In `NEED_EXPOSURE`, if exposure has $< 3$ tiles: Dragging or double-clicking to discard is blocked.
2. In `NEED_EXPOSURE`, if exposure has $\ge 3$ tiles (complete): Dragging or double-clicking to discard is allowed and finishes the turn.
3. Only a single discard is permitted per turn.

---

## 3. Files to Modify
1. `src/app/module/business/game/state/state.ts`

---

## 4. Detailed Before & After Code Snippets

### File: `src/app/module/business/game/state/state.ts`
**Location**: `canDiscard` computed signal (around lines 410–425)

#### BEFORE:
```typescript
    // Only allow discard when stage is strictly NEED_DISCARD. Discard is forbidden during NEED_EXPOSURE.
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const stage = this.play_turn_stage();
        const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING;

        return isMyTurn && needsDiscard && isPlayingPhase;
    });
```

#### AFTER:
```typescript
    /* OLDCODE
    // Only allow discard when stage is strictly NEED_DISCARD. Discard is forbidden during NEED_EXPOSURE.
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const stage = this.play_turn_stage();
        const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING;

        return isMyTurn && needsDiscard && isPlayingPhase;
    });
    OLDCODE */
    /* NEWCODE */
    // Allow discard during NEED_DISCARD and NEED_EXPOSURE (Phaser's snapTileToDiscard validates that exposure has >= 3 tiles before accepting)
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const stage = this.play_turn_stage();
        const needsDiscard = stage === GameTurnStageEnum.NEED_DISCARD || stage === GameTurnStageEnum.NEED_EXPOSURE;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING;

        return isMyTurn && needsDiscard && isPlayingPhase;
    });
    /* NEWCODE */
```

---

## 5. Verification Plan
1. `npx tsc -p tsconfig.app.json --noEmit` must exit with 0 errors.
2. In `NEED_EXPOSURE`:
   - With 1 or 2 tiles in exposure: Discard attempt snaps back to rack (blocked).
   - With 3+ tiles in exposure: Discard attempt succeeds, sends exposure and discard.
3. Single discard lock: After discarding, `canDiscard` is locked to false locally.

