// file: src/app/module/business/game/phaser/scenes/managers/pass-flow.ts
import { PassDirection, PassFlowCallbacks, PassResultCallbacks } from "./type";
import { GamePhaseFirstRoundDirectionEnum, GamePhaseSecondRoundDirectionEnum } from "@bfw/api-sdk/graphql/endpoints/business";
import { TableSeat, TileRuntime } from "./scenes/type";
import { PhaserAnimation } from "./animation";
import { PhaserState } from "./state";
import { PhaserLayoutUi } from "./layout/ui";


/**
 * Coordinates the pass feature without owning state, animations, UI, rules,
 * networking, or external effects.
 */
export class PhaserFlow {
  constructor(
    readonly state: PhaserState,
    readonly animations: PhaserAnimation,
    readonly ui: PhaserLayoutUi,
    readonly callbacks: PassFlowCallbacks,
  ) { }

  addPassWaitingTile(tileId: number): void {
    this.state.passWaitingTileIds.push(tileId);
  }

  removePassWaitingTile(tileId: number): void {
    const index = this.state.passWaitingTileIds.indexOf(tileId);
    if (index >= 0) this.state.passWaitingTileIds.splice(index, 1);
  }

  hasPassWaitingTile(tileId: number): boolean {
    return this.state.passWaitingTileIds.includes(tileId);
  }

  get passWaitingTileCount(): number {
    return this.state.passWaitingTileIds.length;
  }

  setPassDirection(direction: PassDirection): TableSeat {
    this.state.passDirection = direction;
    this.state.currentPassDestination = this.destinationForDirection(direction);
    return this.state.currentPassDestination;
  }

  destinationForDirection(direction: PassDirection): TableSeat {
    switch (direction) {
      case GamePhaseFirstRoundDirectionEnum.RIGHT:
      case GamePhaseSecondRoundDirectionEnum.RIGHT:
        return "right";
      case GamePhaseFirstRoundDirectionEnum.LEFT:
      case GamePhaseSecondRoundDirectionEnum.LEFT:
        return "left";
      case GamePhaseFirstRoundDirectionEnum.ACROSS:
      case GamePhaseSecondRoundDirectionEnum.ACROSS:
        return "top";
    }
    return "right";
  }

  isPassingPhase(): boolean {
    return this.callbacks.isPassPhaseAllowed();
  }

  canSubmitPassWaitingTiles(): boolean {
    return this.isPassingPhase() && this.passWaitingTileCount === 3;
  }

  beginSubmission(): boolean {
    if (!this.canSubmitPassWaitingTiles()) return false;
    if (this.state.isPassAnimating) return false;

    this.state.isPassAnimating = true;
    return true;
  }

  requestSubmissionUiUpdate(): void {
    this.callbacks.requestPassUiUpdate();
  }

  applyPassWaitingResult(
    ids: readonly number[],
    callbacks: PassResultCallbacks,
  ): void {
    ids.forEach((id) => {
      this.state.optimisticPassTileIds.push(id);
      
      const runtime = this.state.tileMap.get(id);
      if (runtime) {
        callbacks.onTileRemoved(runtime);
      }
    });

    this.state.passWaitingTileIds.length = 0;
    this.state.selectedIds.clear();
    this.state.rackTiles = this.state.rackTiles.filter((tile) => !ids.includes(tile.tile_id!));

    callbacks.onSelectionChanged();
    callbacks.onPassCompleted({ tileIds: ids, direction: this.state.passDirection });

    this.state.isPassAnimating = false;
    callbacks.onLayoutRequested();
  }
}
