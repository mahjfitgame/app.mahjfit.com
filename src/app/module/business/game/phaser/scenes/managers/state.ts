// file: src/app/module/business/game/phaser/scenes/managers/state.ts
import Phaser from "phaser";
import type { PassDirection, TileVm } from "../../../model/tile";
import type { TablePhase } from "../../../model/table-phase";
import { TableLayout } from "../../type";
import { TableSeat, TileRuntime } from "../type";

/**
 * Owns mutable table, rack, pass, and interaction state.
 */
export class StateManager {
  layout!: TableLayout;

  wallTileCount = 93;
  pickTargetSeat: TableSeat = "bottom";
  isPickAnimating = false;
  nextMockTileId = 1;

  rackTiles: readonly TileVm[] = [];
  readonly tileMap = new Map<string, TileRuntime>();
  readonly selectedIds = new Set<string>();
  rackOrder: string[] = [];
  readonly discardedTileIds: string[] = [];

  activeDragTile?: TileRuntime;
  dragPointerId?: number;
  readonly dragStartByTileId = new Map<string, { x: number; y: number }>();
  readonly dragThresholdPx = 10;
  readonly suppressTapByTileId = new Set<string>();
  readonly doubleTapMs = 280;
  readonly lastTapAtByTileId = new Map<string, number>();

  passTrayClones: Phaser.GameObjects.Image[] = [];
  passAnimationClones: Phaser.GameObjects.GameObject[] = [];
  passDirection: PassDirection = "across";
  tablePhase: TablePhase = "playing";
  currentPassDestination: TableSeat = "top";
  activeSeat: TableSeat = "bottom";
  readonly passWaitingTileIds: string[] = [];
  readonly passCloseButtons = new Map<string, Phaser.GameObjects.Container>();
  passWaitingAreaGraphics?: Phaser.GameObjects.Graphics;
  isPassAnimating = false;
  readonly passWaitingTileScale = 1.08;
  readonly passCloseButtonScale = 0.145;

  activeRackAtlasKey?: string;
  pendingAtlasRefresh = false;

  constructor() {}
}
