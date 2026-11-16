# Phase Play: Direct Dead Hand Claim on Seat Selection & WebSocket Call

## Task Summary
Remove Step 3 (the Reason Selection Dialog: Invalid Mah Jongg, Hand Not Viable, Incorrect Tile Count) from the Dead Hand flow. When the user selects an opponent seat (`top`, `left`, or `right`) in the seat selection overlay, immediately execute Step 4 (submitting the claim) and Step 5: backend WebSocket call (`publishDeclareDead(targetSeatId)`).

---

## Files to Modify
1. `src/app/module/business/game/phaser/component.ts`:
   - Route `onDeadHandClaimPrompt(targetSeat)` directly into `onSubmitDeadHandClaim(targetSeat)`.
   - Update `onSubmitDeadHandClaim` to map `targetSeat` to its backend `targetSeatId` and invoke `this.gameState.publishDeclareDead(targetSeatId, reason)`.
2. `src/app/module/business/game/state/state.ts`:
   - Import `GameDeadHandReasonEnum` from `@bfw/api-sdk/graphql/endpoints/business`.
   - Implement `publishDeclareDead(targetSeatId: number, reason?: GameDeadHandReasonEnum)` at line 2097 using `this.api.sdk.graphql.ws.gameEngine?.publishActionCallDeadHand(...)`.

---

## Detailed Before & After Snippets

### 1. `src/app/module/business/game/phaser/component.ts`

#### Snippet A: Phaser callback mapping (around line 1227)
**BEFORE:**
```typescript
          onPlayerRemovalRequested: (request) =>
            this.zone.run(() => this.playerRemovalRequested.emit(request)),
          onDeadHandClaimPrompt: (targetSeat) => this.setDeadHandPopup(targetSeat),
          onTemporaryDiscardCompleted: () =>
            this.zone.run(() => this.temporaryDiscardCompleted.emit()),
```

**AFTER:**
```typescript
          onPlayerRemovalRequested: (request) =>
            this.zone.run(() => this.playerRemovalRequested.emit(request)),
          /* OLDCODE
          onDeadHandClaimPrompt: (targetSeat) => this.setDeadHandPopup(targetSeat),
          OLDCODE */
          /* NEWCODE */
          // Directly submit claim upon seat selection without reason dialog
          onDeadHandClaimPrompt: (targetSeat) =>
            this.onSubmitDeadHandClaim(targetSeat, GameDeadHandReasonEnum.FALSE_MAHJONG),
          /* NEWCODE */
          onTemporaryDiscardCompleted: () =>
            this.zone.run(() => this.temporaryDiscardCompleted.emit()),
```

---

#### Snippet B: `onSubmitDeadHandClaim` method (around line 1840)
**BEFORE:**
```typescript
  /* NEWCODE */
  public onSubmitDeadHandClaim(targetSeat: Exclude<TableSeat, "bottom">, reason: DeadHandReason): void {
    this.phaser?.events.emit("ui:dead-hand-claimed");
    this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
    this.setDeadHandPopup(null);
  }
  /* NEWCODE */
```

**AFTER:**
```typescript
  /* OLDCODE
  public onSubmitDeadHandClaim(targetSeat: Exclude<TableSeat, "bottom">, reason: DeadHandReason): void {
    this.phaser?.events.emit("ui:dead-hand-claimed");
    this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
    this.setDeadHandPopup(null);
  }
  OLDCODE */
  /* NEWCODE */
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
  /* NEWCODE */
```

---

### 2. `src/app/module/business/game/state/state.ts`

#### Snippet A: Import `GameDeadHandReasonEnum` (around line 4)
**BEFORE:**
```typescript
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameBoatProfileEntityGSDto, GameCharlestoneStageEnum, GameCharlestoneStageEnumAddon, GameCreateInputDto, GameCreateOutputDto, GameEngine, GameEngineWs, GameEngineWsToken, GameModeEnum, GamePersonalClaimOutputGSDto, GamePersonalPassOutputGSDto, GamePersonalSeatEntityGSDto, GamePhaseEnum, GamePhaseFirstRoundDirectionEnum, GamePhaseFirstRoundDirectionEnumAddon, GamePhaseSecondRoundDirectionEnum, GamePlayAction, GamePlayActionEnum, GamePlayActionEnumAddon, GamePlayClaimGSOutputDto, GameRackDeadInfoGSOutputDto, GameRackExposuresMeldEntityGSDto, GameRackIDEnum, GameRackIDEnumAddon, GameService, GameStateGameOutputDto, GameStateOutputDto, GameStatePersonalOutputDto, GameStatePlayOutputDto, GameStatePublicStartInputDto, GameTileEntityGSDto, GameTileOrderEnumAddon, GameTileOrderModeEnum, GameTurnStageEnum, TileEntity, TileEntityGSDto, TileStyleFindInputWhereDto, TileStyleFindOutputDto } from "@bfw/api-sdk/graphql/endpoints/business";
```

**AFTER:**
```typescript
/* OLDCODE
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameBoatProfileEntityGSDto, GameCharlestoneStageEnum, GameCharlestoneStageEnumAddon, GameCreateInputDto, GameCreateOutputDto, GameEngine, GameEngineWs, GameEngineWsToken, GameModeEnum, GamePersonalClaimOutputGSDto, GamePersonalPassOutputGSDto, GamePersonalSeatEntityGSDto, GamePhaseEnum, GamePhaseFirstRoundDirectionEnum, GamePhaseFirstRoundDirectionEnumAddon, GamePhaseSecondRoundDirectionEnum, GamePlayAction, GamePlayActionEnum, GamePlayActionEnumAddon, GamePlayClaimGSOutputDto, GameRackDeadInfoGSOutputDto, GameRackExposuresMeldEntityGSDto, GameRackIDEnum, GameRackIDEnumAddon, GameService, GameStateGameOutputDto, GameStateOutputDto, GameStatePersonalOutputDto, GameStatePlayOutputDto, GameStatePublicStartInputDto, GameTileEntityGSDto, GameTileOrderEnumAddon, GameTileOrderModeEnum, GameTurnStageEnum, TileEntity, TileEntityGSDto, TileStyleFindInputWhereDto, TileStyleFindOutputDto } from "@bfw/api-sdk/graphql/endpoints/business";
OLDCODE */
/* NEWCODE */
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameBoatProfileEntityGSDto, GameCharlestoneStageEnum, GameCharlestoneStageEnumAddon, GameCreateInputDto, GameCreateOutputDto, GameDeadHandReasonEnum, GameEngine, GameEngineWs, GameEngineWsToken, GameModeEnum, GamePersonalClaimOutputGSDto, GamePersonalPassOutputGSDto, GamePersonalSeatEntityGSDto, GamePhaseEnum, GamePhaseFirstRoundDirectionEnum, GamePhaseFirstRoundDirectionEnumAddon, GamePhaseSecondRoundDirectionEnum, GamePlayAction, GamePlayActionEnum, GamePlayActionEnumAddon, GamePlayClaimGSOutputDto, GameRackDeadInfoGSOutputDto, GameRackExposuresMeldEntityGSDto, GameRackIDEnum, GameRackIDEnumAddon, GameService, GameStateGameOutputDto, GameStateOutputDto, GameStatePersonalOutputDto, GameStatePlayOutputDto, GameStatePublicStartInputDto, GameTileEntityGSDto, GameTileOrderEnumAddon, GameTileOrderModeEnum, GameTurnStageEnum, TileEntity, TileEntityGSDto, TileStyleFindInputWhereDto, TileStyleFindOutputDto } from "@bfw/api-sdk/graphql/endpoints/business";
/* NEWCODE */
```

---

#### Snippet B: `publishDeclareDead` implementation (around line 2097)
**BEFORE:**
```typescript
    // ████ WEB SOCKET CALL PUBLISH DEAD ████████████████████████████████████████████
    public async publishDeclareDead(targetSeatId: number): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) return;

        // TODO: Wait for API SDK support for DECLAIRDEAD or use a generic action
        // await this.api.sdk.graphql.ws.gameEngine?.publishAction...
    }
```

**AFTER:**
```typescript
    // ████ WEB SOCKET CALL PUBLISH DEAD ████████████████████████████████████████████
    /* OLDCODE
    public async publishDeclareDead(targetSeatId: number): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) return;

        // TODO: Wait for API SDK support for DECLAIRDEAD or use a generic action
        // await this.api.sdk.graphql.ws.gameEngine?.publishAction...
    }
    OLDCODE */
    /* NEWCODE */
    // Sends dead hand action call to backend server via GraphQL WebSocket
    public async publishDeclareDead(
        targetSeatId: number,
        reason: GameDeadHandReasonEnum = GameDeadHandReasonEnum.FALSE_MAHJONG
    ): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) return;

        const targetSeat = this.ordered_seats().find(s => s.id === targetSeatId);
        const targetRackId = targetSeat?.racks ? Number(Object.keys(targetSeat.racks)[0]) || GameRackIDEnumAddon.RACK_FIRST : GameRackIDEnumAddon.RACK_FIRST;

        await this.api.sdk.graphql.ws.gameEngine?.publishActionCallDeadHand({
            input: {
                keyid: game_keyid,
                gpaction_id: GamePlayActionEnumAddon.DEAD_HAND_CALL as unknown as GamePlayActionEnum,
                game_id: this.game_id(),
                u_id: this.personal_seat_u_id(),
                id: this.personal_seat_id(),
                from_gseat_id: this.personal_seat_id(),
                to_gseat_id: targetSeatId,
                to_rack_id: (targetRackId || GameRackIDEnumAddon.RACK_FIRST) as unknown as GameRackIDEnum,
                reason: reason,
            },
            selections: this.commonSelectionFields,
        });
    }
    /* NEWCODE */
```

