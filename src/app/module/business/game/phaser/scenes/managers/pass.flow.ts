// file: src/app/module/business/game/phaser/scenes/managers/pass-flow.ts
import { PassDirection } from "../../type";
import { PassFlowCallbacks, PassResultCallbacks, TableSeat, TileRuntime } from "../type";
import { StateManager } from "./state";
import { UiLayoutManager } from "./ui.layout";


/**
 * Coordinates the pass feature without owning state, animations, UI, rules,
 * networking, or external effects.
 */
export class PassFlowManager {
  constructor(
    readonly state: StateManager,
    readonly ui: UiLayoutManager,
    readonly callbacks: PassFlowCallbacks,
  ) { }

  public addPassWaitingTile(tileId: string): void {
    this.state.passWaitingTileIds.push(tileId);
  }

  public removePassWaitingTile(tileId: string): void {
    const index = this.state.passWaitingTileIds.indexOf(tileId);
    if (index >= 0) this.state.passWaitingTileIds.splice(index, 1);
  }

  public hasPassWaitingTile(tileId: string): boolean {
    return this.state.passWaitingTileIds.includes(tileId);
  }

  get passWaitingTileCount(): number {
    return this.state.passWaitingTileIds.length;
  }

  public setPassDirection(direction: PassDirection): TableSeat {
    this.state.passDirection = direction;
    this.state.currentPassDestination = this.destinationForDirection(direction);
    return this.state.currentPassDestination;
  }

  public destinationForDirection(direction: PassDirection): TableSeat {
    switch (direction) {
      case "right": return "right";
      case "left": return "left";
      case "across": return "top";
    }
  }

  public isPassingPhase(): boolean {
    return this.callbacks.isPassPhaseAllowed();
  }

  public canSubmitPassWaitingTiles(): boolean {
    return this.isPassingPhase() && this.passWaitingTileCount === 3;
  }

  public beginSubmission(): boolean {
    if (!this.canSubmitPassWaitingTiles()) return false;
    if (this.state.isPassAnimating) return false;

    this.state.isPassAnimating = true;
    return true;
  }

  public requestSubmissionUiUpdate(): void {
    this.callbacks.requestPassUiUpdate();
  }

  public applyPassWaitingResult(
    ids: readonly string[],
    callbacks: PassResultCallbacks,
  ): void {
    ids.forEach((id) => {
      const runtime = this.state.tileMap.get(id);
      if (!runtime) return;

      callbacks.onTileRemoved(runtime);
      this.state.tileMap.delete(id);
      callbacks.onCloseButtonRemoved(id);
      this.state.passCloseButtons.delete(id);
    });

    this.state.passWaitingTileIds.length = 0;
    this.state.selectedIds.clear();
    this.state.rackTiles = this.state.rackTiles.filter((tile) => !ids.includes(tile.id));

    callbacks.onSelectionChanged();
    callbacks.onPassCompleted({ tileIds: ids, direction: this.state.passDirection });

    this.state.isPassAnimating = false;
    callbacks.onLayoutRequested();
  }
}
