// file: src/app/module/business/game/phaser/scenes/managers/state.ts
import Phaser from "phaser";
import { PassDirection, TableLayout } from "./type";
import { GamePhaseEnum } from "@bfw/api-sdk/graphql/endpoints/business";
import { TableSeat, TileRuntime } from "./scenes/type";
import { GameTileEntity, TileEntityGSDto, GamePhaseFirstRoundDirectionEnum } from "@bfw/api-sdk/graphql/endpoints/business";

/**
 * Owns mutable table, rack, pass, and interaction state.
 */
export class PhaserState {
  layout!: TableLayout;

  wallTileCount = 93;
  pickTargetSeat: TableSeat = "bottom";
  isPersonalTurn: boolean = false;
  isPickAnimating = false;
  nextMockTileId = 1;

  allTiles: Record<number, TileEntityGSDto> = {};

  rackTiles: readonly GameTileEntity[] = [];
  readonly tileMap = new Map<number, TileRuntime>();
  readonly selectedIds = new Set<number>();
  rackOrder: number[] = [];
  readonly discardedTileIds: number[] = [];

  activeDragTile?: TileRuntime;
  dragPointerId?: number;
  readonly dragStartByTileId = new Map<number, { x: number; y: number }>();
  readonly dragThresholdPx = 35;
  readonly suppressTapByTileId = new Set<number>();
  readonly doubleTapMs = 280;
  readonly lastTapAtByTileId = new Map<number, number>();

  passTrayClones: Phaser.GameObjects.Image[] = [];
  canDiscard = false;
  passAnimationClones: Phaser.GameObjects.GameObject[] = [];
  passDirection: PassDirection = GamePhaseFirstRoundDirectionEnum.ACROSS;
  currentPassDestination: TableSeat = "top";
  activeSeat: TableSeat = "bottom";
  readonly passWaitingTileIds: number[] = [];
  readonly optimisticPassTileIds: number[] = [];
  readonly passCloseButtons = new Map<number, Phaser.GameObjects.Container>();
  passWaitingAreaGraphics?: Phaser.GameObjects.Graphics;
  isPassAnimating = false;
  readonly passWaitingTileScale = 1.08;
  readonly passCloseButtonScale = 0.145;

  activeRackAtlasKey?: string;
  pendingAtlasRefresh = false;

  constructor() { }
}
