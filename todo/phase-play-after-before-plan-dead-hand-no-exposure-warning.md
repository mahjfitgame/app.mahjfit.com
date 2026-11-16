# Phase Play: Dead Hand No Exposure Validation & Warning

## Task Summary
When a player clicks an opponent's seat in the Dead Hand seat selection overlay:
1. Check if the selected seat has any exposures.
2. If the selected seat has **no exposure**:
   - Change center instruction text to `"The hand is not dead"` for 5 seconds.
   - Play the error sound (`error_01`).
   - Keep the seat selection overlay open (do not close it).
   - After 5 seconds, restore the center instruction text back to `"Select the hand that you would like to dead"`.
   - Abort/return without making the backend API WebSocket call.
3. If the selected seat **has exposure**:
   - Close the seat selection overlay.
   - Proceed with submitting the claim and executing the backend WebSocket call.

---

## Files to Modify
1. `src/app/module/business/game/phaser/scenes/scene.ts`:
   - Add `deadHandCustomInstruction` and `deadHandInstructionTimer` tracking.
   - Add `seatHasExposures(seat)` helper method.
   - In `showDeadHandSeatSelection()`: Initialize default instruction text.
   - In `publishDeadHandSeatSelection()`: Use custom instruction text if set, otherwise default to `"Select the hand that you would like to dead"`.
   - In `handleHtmlDeadHandSeatChosen(seat)`: Validate exposure. If no exposure, play error sound, set instruction to `"The hand is not dead"`, start 5s revert timer, and return early.
   - In `closeDeadHandSeatSelection()`: Clear instruction timer and reset custom instruction.
2. `src/app/module/business/game/phaser/component.ts`:
   - In `onSubmitDeadHandClaim(targetSeat, reason)`: Add safety guard checking `this.gameState.all_seat_exposures()?.[targetSeat]`.

---

## Detailed Before & After Snippets

### 1. `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet A: Properties & Helper method (~lines 7500-7520)
**BEFORE:**
```typescript
  /**
   * Shows the first Dead Hand step. Each opponent exposure is highlighted and
   * its arrow/panel is clickable, so the player chooses the hand directly on
   * the table before choosing a reason for the claim.
   */
  private showDeadHandSeatSelection(): void {
    if (!this.layout || this.tablePhase !== GamePhaseEnum.PLAYING) return;

    this.deadHandSeatSelectionOpen = true;
    this.publishDeadHandSeatSelection();
  }
```

**AFTER:**
```typescript
  /* OLDCODE
  private showDeadHandSeatSelection(): void {
    if (!this.layout || this.tablePhase !== GamePhaseEnum.PLAYING) return;

    this.deadHandSeatSelectionOpen = true;
    this.publishDeadHandSeatSelection();
  }
  OLDCODE */
  /* NEWCODE */
  private deadHandCustomInstruction?: string;
  private deadHandInstructionTimer?: any;

  /** Checks whether the opponent seat has any called exposure melds or sprites. */
  private seatHasExposures(seat: Exclude<TableSeat, "bottom">): boolean {
    const melds = this.latestExposures?.[seat];
    const hasMelds = Array.isArray(melds) && melds.length > 0;
    const hasSprites = (this.calledOpponentExposureTiles[seat]?.length ?? 0) > 0;
    return hasMelds || hasSprites;
  }

  /**
   * Shows the first Dead Hand step. Each opponent exposure is highlighted and
   * its arrow/panel is clickable, so the player chooses the hand directly on
   * the table before choosing a reason for the claim.
   */
  private showDeadHandSeatSelection(): void {
    if (!this.layout || this.tablePhase !== GamePhaseEnum.PLAYING) return;

    if (this.deadHandInstructionTimer) {
      clearTimeout(this.deadHandInstructionTimer);
      this.deadHandInstructionTimer = undefined;
    }
    this.deadHandCustomInstruction = "Select the hand that you would like to dead";
    this.deadHandSeatSelectionOpen = true;
    this.publishDeadHandSeatSelection();
  }
  /* NEWCODE */
```

---

#### Snippet B: `publishDeadHandSeatSelection` (~lines 7540)
**BEFORE:**
```typescript
    this.callbacks.onDeadHandSeatSelection({
      visible: true,
      instruction: "SELECT THE HAND YOU WOULD\nLIKE TO CALL DEAD",
      instructionFontSize: Math.round(
        Phaser.Math.Clamp(Math.min(width, height) * 0.034, 16, 28),
      ),
```

**AFTER:**
```typescript
    /* OLDCODE
    this.callbacks.onDeadHandSeatSelection({
      visible: true,
      instruction: "SELECT THE HAND YOU WOULD\nLIKE TO CALL DEAD",
      instructionFontSize: Math.round(
        Phaser.Math.Clamp(Math.min(width, height) * 0.034, 16, 28),
      ),
    OLDCODE */
    /* NEWCODE */
    this.callbacks.onDeadHandSeatSelection({
      visible: true,
      instruction: this.deadHandCustomInstruction || "Select the hand that you would like to dead",
      instructionFontSize: Math.round(
        Phaser.Math.Clamp(Math.min(width, height) * 0.034, 16, 28),
      ),
    /* NEWCODE */
```

---

#### Snippet C: `handleHtmlDeadHandSeatChosen` and `closeDeadHandSeatSelection` (~lines 7575-7585)
**BEFORE:**
```typescript
  /** Confirms the chosen hand and hands over to the native reason dialog. */
  private handleHtmlDeadHandSeatChosen(seat: Exclude<TableSeat, "bottom">): void {
    this.closeDeadHandSeatSelection();
    this.callbacks.onDeadHandClaimPrompt(seat);
  }

  /** Closes the table-level Dead Hand seat selection without creating a claim. */
  private closeDeadHandSeatSelection(): void {
    this.deadHandSeatSelectionOpen = false;
    this.publishDeadHandSeatSelection();
  }
```

**AFTER:**
```typescript
  /* OLDCODE
  private handleHtmlDeadHandSeatChosen(seat: Exclude<TableSeat, "bottom">): void {
    this.closeDeadHandSeatSelection();
    this.callbacks.onDeadHandClaimPrompt(seat);
  }

  private closeDeadHandSeatSelection(): void {
    this.deadHandSeatSelectionOpen = false;
    this.publishDeadHandSeatSelection();
  }
  OLDCODE */
  /* NEWCODE */
  /** Validates exposure, updates instruction warning if not dead, or submits claim. */
  private handleHtmlDeadHandSeatChosen(seat: Exclude<TableSeat, "bottom">): void {
    if (!this.seatHasExposures(seat)) {
      this.playSfx("error_01");
      this.deadHandCustomInstruction = "The hand is not dead";
      this.publishDeadHandSeatSelection();

      if (this.deadHandInstructionTimer) {
        clearTimeout(this.deadHandInstructionTimer);
      }
      this.deadHandInstructionTimer = setTimeout(() => {
        this.deadHandCustomInstruction = "Select the hand that you would like to dead";
        if (this.deadHandSeatSelectionOpen) {
          this.publishDeadHandSeatSelection();
        }
      }, 5000);
      return;
    }

    if (this.deadHandInstructionTimer) {
      clearTimeout(this.deadHandInstructionTimer);
      this.deadHandInstructionTimer = undefined;
    }
    this.deadHandCustomInstruction = undefined;
    this.closeDeadHandSeatSelection();
    this.callbacks.onDeadHandClaimPrompt(seat);
  }

  /** Closes the table-level Dead Hand seat selection without creating a claim. */
  private closeDeadHandSeatSelection(): void {
    if (this.deadHandInstructionTimer) {
      clearTimeout(this.deadHandInstructionTimer);
      this.deadHandInstructionTimer = undefined;
    }
    this.deadHandCustomInstruction = undefined;
    this.deadHandSeatSelectionOpen = false;
    this.publishDeadHandSeatSelection();
  }
  /* NEWCODE */
```

---

### 2. `src/app/module/business/game/phaser/component.ts`

#### Snippet A: `onSubmitDeadHandClaim` (~line 1851)
**BEFORE:**
```typescript
  // Submits dead hand claim, plays SFX, emits UI event, and sends WebSocket mutation to backend
  public onSubmitDeadHandClaim(
    targetSeat: Exclude<TableSeat, "bottom">,
    reason: DeadHandReason = GameDeadHandReasonEnum.FALSE_MAHJONG
  ): void {
    this.phaser?.events.emit("ui:dead-hand-claimed");
    this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
    this.setDeadHandPopup(null);

    const mapping = this.gameState.seat_mapping();
    const seats = this.gameState.ordered_seats();
    const targetSeatIndex = mapping[targetSeat];
    const targetSeatObj = seats[targetSeatIndex];
    if (targetSeatObj?.id) {
      void this.gameState.publishDeclareDead(targetSeatObj.id, reason);
    }
  }
```

**AFTER:**
```typescript
  /* OLDCODE
  public onSubmitDeadHandClaim(
    targetSeat: Exclude<TableSeat, "bottom">,
    reason: DeadHandReason = GameDeadHandReasonEnum.FALSE_MAHJONG
  ): void {
    this.phaser?.events.emit("ui:dead-hand-claimed");
    this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
    this.setDeadHandPopup(null);

    const mapping = this.gameState.seat_mapping();
    const seats = this.gameState.ordered_seats();
    const targetSeatIndex = mapping[targetSeat];
    const targetSeatObj = seats[targetSeatIndex];
    if (targetSeatObj?.id) {
      void this.gameState.publishDeclareDead(targetSeatObj.id, reason);
    }
  }
  OLDCODE */
  /* NEWCODE */
  // Submits dead hand claim with exposure guard, plays SFX, and sends WebSocket mutation
  public onSubmitDeadHandClaim(
    targetSeat: Exclude<TableSeat, "bottom">,
    reason: DeadHandReason = GameDeadHandReasonEnum.FALSE_MAHJONG
  ): void {
    const exposures = this.gameState.all_seat_exposures();
    const targetExposures = exposures?.[targetSeat];
    if (!targetExposures || targetExposures.length === 0) {
      console.warn(`[onSubmitDeadHandClaim] Target seat ${targetSeat} has no exposures. Claim aborted.`);
      return;
    }

    this.phaser?.events.emit("ui:dead-hand-claimed");
    this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
    this.setDeadHandPopup(null);

    const mapping = this.gameState.seat_mapping();
    const seats = this.gameState.ordered_seats();
    const targetSeatIndex = mapping[targetSeat];
    const targetSeatObj = seats[targetSeatIndex];
    if (targetSeatObj?.id) {
      void this.gameState.publishDeclareDead(targetSeatObj.id, reason);
    }
  }
  /* NEWCODE */
```

