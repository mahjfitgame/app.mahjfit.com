// file: src/app/module/business/game/phaser/scenes/managers/pass-flow.ts
import type { PassDirection } from "../../../model/tile";
import { TableSeat, TileRuntime } from "../type";
import { AnimationManager } from "./animation";
import { StateManager } from "./state";
import { UiLayoutManager } from "./ui-layout";

/**
 * Scene-owned decisions and external effects used by the future pass flow.
 */
export interface PassFlowCallbacks {
  readonly isPassPhaseAllowed: () => boolean;
  readonly validateSubmission: () => boolean;
  readonly approveSubmission: () => boolean;
  readonly onPassCompleted: (payload: {
    readonly tileIds: readonly string[];
    readonly direction: PassDirection;
  }) => void;
  readonly notifyNetworking: (payload: {
    readonly tileIds: readonly string[];
    readonly direction: PassDirection;
  }) => void;
  readonly emitExternalEvent: (event: string, payload?: unknown) => void;
  readonly requestPassUiUpdate: () => void;
}

export interface PassResultCallbacks {
  readonly onTileRemoved: (runtime: TileRuntime) => void;
  readonly onCloseButtonRemoved: (tileId: string) => void;
  readonly onSelectionChanged: () => void;
  readonly onPassCompleted: (payload: {
    readonly tileIds: readonly string[];
    readonly direction: PassDirection;
  }) => void;
  readonly onLayoutRequested: () => void;
}

/**
 * Coordinates the pass feature without owning state, animations, UI, rules,
 * networking, or external effects.
 */
export class PassFlowManager {
  constructor(
    readonly state: StateManager,
    readonly animations: AnimationManager,
    readonly ui: UiLayoutManager,
    readonly callbacks: PassFlowCallbacks,
  ) {}

  addPassWaitingTile(tileId: string): void {
    this.state.passWaitingTileIds.push(tileId);
  }

  removePassWaitingTile(tileId: string): void {
    const index = this.state.passWaitingTileIds.indexOf(tileId);
    if (index >= 0) this.state.passWaitingTileIds.splice(index, 1);
  }

  hasPassWaitingTile(tileId: string): boolean {
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
      case "right": return "right";
      case "left": return "left";
      case "across": return "top";
    }
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
