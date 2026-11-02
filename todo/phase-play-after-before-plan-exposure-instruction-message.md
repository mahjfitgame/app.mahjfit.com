# Before & After Plan: Fix Exposure Instruction Message ("Complete the exposure, then discard a tile")

## 1. Problem Description & Root Cause Analysis

### Identified Problem
When a player claims a tile from an opponent's discard, the turn stage becomes `NEED_EXPOSURE`.
However, the yellow instruction panel above the rack displayed **"Pick a tile"** instead of **"Complete the exposure, then discard a tile"**.

### Root Cause
1. **Root Cause 1 (`scene.ts:7460`)**:
   `getLocalExposureStatus()` had the check:
   ```typescript
   if (this.tablePhase !== GamePhaseEnum.PLAYING || !this.stateManager.isPersonalTurn || !this.canDiscard) {
     return null;
   }
   ```
   When we fixed `canDiscard` so that players cannot discard during `NEED_EXPOSURE`, `this.canDiscard` became `false`.
   Because of `|| !this.canDiscard`, `getLocalExposureStatus()` immediately returned `null` instead of `"building"`!
   Additionally, `if (count === 0) return null;` caused it to return `null` even if the player was in `NEED_EXPOSURE` before dragging tiles.

2. **Root Cause 2 (`ui.ts:2141`)**:
   In `updateInstruction()`, `if (!canDiscard)` was evaluated **before** `effectiveExposureStatus === "building"`:
   ```typescript
   } else if (isPersonalTurn) {
     if (!canDiscard) {
       this.instructionMessage = "Pick a tile";
       this.lastExposureStatus = null;
     } else if (effectiveExposureStatus === "building") {
       this.instructionMessage = "Complete the exposure, then discard a tile";
   ```
   Since `canDiscard` is `false` during `NEED_EXPOSURE`, it entered `if (!canDiscard)` and set the message to `"Pick a tile"`.

---

## 2. Expected Behavior
1. When the player claims a tile and is in `NEED_EXPOSURE`, the instruction panel must display:
   **"Complete the exposure, then discard a tile"**.
2. Once the exposure group is completed ($\ge 3$ tiles), the instruction panel updates to:
   **"Discard a tile"**.
3. During a regular turn before picking from the wall, the instruction panel displays:
   **"Pick a tile"**.

---

## 3. Files to Modify
1. `src/app/module/business/game/phaser/scenes/scene.ts`
2. `src/app/module/business/game/phaser/layout/ui.ts`

---

## 4. Detailed Before & After Code Snippets

---

### File 1: `src/app/module/business/game/phaser/scenes/scene.ts`
**Location**: `getLocalExposureStatus` (around lines 7459–7491)

#### BEFORE:
```typescript
  private getLocalExposureStatus(): "building" | "complete" | null {
    if (this.tablePhase !== GamePhaseEnum.PLAYING || !this.stateManager.isPersonalTurn || !this.canDiscard) {
      return null;
    }
    const isNeedExposure = this.turnStage === GameTurnStageEnum.NEED_EXPOSURE;
    const hasActiveExposureBuild = this.activeExposureBuildTileIds.length > 0;

    if (!isNeedExposure && !hasActiveExposureBuild) {
      return null;
    }

    const count = this.activeExposureBuildTileIds.length;
    if (count === 0) {
      return null;
    }
    // An exposure must have at least 3 tiles (Pung: 3, Kong: 4, Quint: 5)
    if (count < 3) {
      return "building";
    }

    if (count >= 5) {
      return "complete";
    }

    // If there are no other tiles on the rack of the same tile, the exposure can be 3, 4, or 5 and is complete
    const sameTilesOnRack = this.countSameTilesOnRack();
    if (sameTilesOnRack === 0) {
      return "complete";
    }

    return "building";
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private getLocalExposureStatus(): "building" | "complete" | null {
    if (this.tablePhase !== GamePhaseEnum.PLAYING || !this.stateManager.isPersonalTurn || !this.canDiscard) {
      return null;
    }
    const isNeedExposure = this.turnStage === GameTurnStageEnum.NEED_EXPOSURE;
    const hasActiveExposureBuild = this.activeExposureBuildTileIds.length > 0;

    if (!isNeedExposure && !hasActiveExposureBuild) {
      return null;
    }

    const count = this.activeExposureBuildTileIds.length;
    if (count === 0) {
      return null;
    }
    // An exposure must have at least 3 tiles (Pung: 3, Kong: 4, Quint: 5)
    if (count < 3) {
      return "building";
    }

    if (count >= 5) {
      return "complete";
    }

    // If there are no other tiles on the rack of the same tile, the exposure can be 3, 4, or 5 and is complete
    const sameTilesOnRack = this.countSameTilesOnRack();
    if (sameTilesOnRack === 0) {
      return "complete";
    }

    return "building";
  }
  OLDCODE */
  /* NEWCODE */
  private getLocalExposureStatus(): "building" | "complete" | null {
    // Only personal playing phase can have local exposure building
    if (this.tablePhase !== GamePhaseEnum.PLAYING || !this.stateManager.isPersonalTurn) {
      return null;
    }
    const isNeedExposure = this.turnStage === GameTurnStageEnum.NEED_EXPOSURE
      || (this.turnStage as any) === 3
      || (this.turnStage as any) === "3";
    const hasActiveExposureBuild = this.activeExposureBuildTileIds.length > 0;

    if (!isNeedExposure && !hasActiveExposureBuild) {
      return null;
    }

    const count = this.activeExposureBuildTileIds.length;
    // An exposure must have at least 3 tiles (Pung: 3, Kong: 4, Quint: 5)
    if (count < 3) {
      return "building";
    }

    if (count >= 5) {
      return "complete";
    }

    // If there are no other tiles on the rack of the same tile, the exposure can be 3, 4, or 5 and is complete
    const sameTilesOnRack = this.countSameTilesOnRack();
    if (sameTilesOnRack === 0) {
      return "complete";
    }

    return "building";
  }
  /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/layout/ui.ts`
**Location**: `updateInstruction` (around lines 2132–2155)

#### BEFORE:
```typescript
    if (phase !== GamePhaseEnum.PASSING && phase !== GamePhaseEnum.LOBBY) {
      const isGameplay = phase === GamePhaseEnum.PLAYING || phase === GamePhaseEnum.CLAIM;
      if (isGameplay) {
        if (effectiveCalledSeat && effectiveCalledSeat !== "bottom") {
          const callerName = this.getPlayerName(effectiveCalledSeat);
          this.instructionMessage = `${callerName} Called`;
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        } else if (isPersonalTurn) {
          if (!canDiscard) {
            this.instructionMessage = "Pick a tile";
            this.lastExposureStatus = null;
          } else if (effectiveExposureStatus === "building") {
            this.instructionMessage = "Complete the exposure, then discard a tile";
          } else if (effectiveExposureStatus === "complete") {
            this.instructionMessage = "Discard a tile";
          } else {
            this.instructionMessage = "Discard a tile";
          }
          this.isCurrentTurnSeat = true;
```

#### AFTER:
```typescript
    /* OLDCODE
    if (phase !== GamePhaseEnum.PASSING && phase !== GamePhaseEnum.LOBBY) {
      const isGameplay = phase === GamePhaseEnum.PLAYING || phase === GamePhaseEnum.CLAIM;
      if (isGameplay) {
        if (effectiveCalledSeat && effectiveCalledSeat !== "bottom") {
          const callerName = this.getPlayerName(effectiveCalledSeat);
          this.instructionMessage = `${callerName} Called`;
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        } else if (isPersonalTurn) {
          if (!canDiscard) {
            this.instructionMessage = "Pick a tile";
            this.lastExposureStatus = null;
          } else if (effectiveExposureStatus === "building") {
            this.instructionMessage = "Complete the exposure, then discard a tile";
          } else if (effectiveExposureStatus === "complete") {
            this.instructionMessage = "Discard a tile";
          } else {
            this.instructionMessage = "Discard a tile";
          }
          this.isCurrentTurnSeat = true;
        } else if (effectiveActiveSeat && effectiveActiveSeat !== "bottom") {
          const playerName = this.getPlayerName(effectiveActiveSeat);
          this.instructionMessage = `${playerName}’s Turn`;
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        } else {
          this.instructionMessage = "";
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        }
      } else {
        this.instructionMessage = "";
        this.isCurrentTurnSeat = false;
      }
      this.publishInstructionPanel();
      return;
    }
    OLDCODE */
    /* NEWCODE */
    if (phase !== GamePhaseEnum.PASSING && phase !== GamePhaseEnum.LOBBY) {
      const isGameplay = phase === GamePhaseEnum.PLAYING || phase === GamePhaseEnum.CLAIM;
      if (isGameplay) {
        if (effectiveCalledSeat && effectiveCalledSeat !== "bottom") {
          const callerName = this.getPlayerName(effectiveCalledSeat);
          this.instructionMessage = `${callerName} Called`;
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        } else if (isPersonalTurn) {
          // Check exposure status first, since canDiscard is false during exposure building
          if (effectiveExposureStatus === "building") {
            this.instructionMessage = "Complete the exposure, then discard a tile";
          } else if (effectiveExposureStatus === "complete") {
            this.instructionMessage = "Discard a tile";
          } else if (!canDiscard) {
            this.instructionMessage = "Pick a tile";
            this.lastExposureStatus = null;
          } else {
            this.instructionMessage = "Discard a tile";
          }
          this.isCurrentTurnSeat = true;
        } else if (effectiveActiveSeat && effectiveActiveSeat !== "bottom") {
          const playerName = this.getPlayerName(effectiveActiveSeat);
          this.instructionMessage = `${playerName}’s Turn`;
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        } else {
          this.instructionMessage = "";
          this.isCurrentTurnSeat = false;
          this.lastExposureStatus = null;
        }
      } else {
        this.instructionMessage = "";
        this.isCurrentTurnSeat = false;
      }
      this.publishInstructionPanel();
      return;
    }
    /* NEWCODE */
```

---

## 5. Verification Plan
1. **Compilation Check**: `npx tsc -p tsconfig.app.json --noEmit` must exit with 0 errors.
2. **Behavior Verification**:
   - During `NEED_EXPOSURE`, the instruction panel displays: `"Complete the exposure, then discard a tile"`.
   - Once exposure is complete ($\ge 3$ tiles), the instruction panel displays: `"Discard a tile"`.
   - During regular turn before picking: `"Pick a tile"`.
   - Strict `OLDCODE` / `NEWCODE` pattern with 0 code deletions.

