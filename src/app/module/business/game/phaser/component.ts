// file: src/app/module/business/game/phaser/component.ts
import { Router } from "@angular/router"; import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  SimpleChanges,
  ViewChild,
  effect,
  inject,
  input,
  output,
  signal,
  computed,
  Injector,
  runInInjectionContext,
} from "@angular/core";
import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";

import { PhaserScene } from "./scenes/scene";
import { GameDeadHandReasonEnum, GamePhaseFirstRoundDirectionEnum, GameTileEntity, GameTileEntityGSDto, TileCategoryEnum, GamePlayActionEnum, TileCategoryEnumAddon, GamePhaseEnum, GameRackIDEnumAddon, GamePlayActionEnumAddon, GameTurnStageEnum, GameTileOrderEnumAddon } from "@bfw/api-sdk/graphql/endpoints/business";
import {
  ClaimPanelOverlayState,
  DeadHandClaim,
  DeadHandReason,
  DeadHandSeatSelectionState,
  DemoDiscardRequest,
  HeaderLogoLayoutState,
  InstructionPanelOverlayState,
  JoinTableRequest,
  JoinTableRequestDecision,
  MahjongButtonOverlayState,
  MahjongWinCelebration,
  MobileDrawerOverlayState,
  MobileHeaderToggleOverlayState,
  PlayerAwayNotice,
  PlayerLabelOverlayKey,
  PlayerLabelOverlayState,
  PlayerRemovalRequest,
  PointsOverlayState,
  ResolvedClaimPresentation,
  TableOverlayBlockLevel,
  TableSeat,
  TileCallDecision,
  TileCallOffer,
  WallCountOverlayState
} from "./scenes/type";

import { COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY } from "./const";

/* NEWCODE */
export interface GameOverModalData {
  readonly isVisible: boolean;
  readonly title: string;
  readonly message: string;
  readonly note?: string;
  readonly reason?: string;
}

export interface WinningTileData {
  id?: number;
  category: string;
  type: string;
  rank?: number;
  label: string;
  assetName: string;
}

export interface WinningMeldGroup {
  combinationName?: string;
  tiles: WinningTileData[];
}

export interface WinningOverlayData {
  winnerSeat: TableSeat;
  winnerName: string;
  isSelfPick: boolean;
  baseScore: number;
  bonus: number;
  totalPoints: number;
  winningHandGroups: WinningMeldGroup[];
}
/* NEWCODE */
import { GameHapticType, PassDirection } from "../type";
import { GameHeptic } from "../haptics";

import { PhaserLayoutDevice } from "./layout/device";
import { PhaserLayoutGame } from "./layout/game";
import { GameState } from "../state/state";
import { GameService } from "../service";
import { NotifyService } from "src/app/base/notify/service";

@Component({
  selector: "app-phaser",
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  providers: [
    PhaserLayoutDevice,
    PhaserLayoutGame
  ]
})
export class PhaserComponent implements AfterViewInit {
  private pendingDiscardTileId: number | null = null;
  private claimPresentationGameKey: string | null = null;
  private claimPresentationInitialized = false;
  private lastResolvedClaimPresentationKey: string | null = null;
  private exposurePresentationInitialized = false;
  private readonly knownExposurePresentationKeys = new Set<string>();

  @ViewChild("host", { static: true })
  private readonly hostRef!: ElementRef<HTMLDivElement>;

  @ViewChild("headerLogo", { static: true })
  private readonly headerLogoRef!: ElementRef<HTMLImageElement>;

  @ViewChild("safeAreaProbe", { static: true })
  private readonly safeAreaProbeRef!: ElementRef<HTMLDivElement>;



  readonly passDirection = input<PassDirection>(GamePhaseFirstRoundDirectionEnum.RIGHT);
  /** Debug-only sidebar state. Its CSS transition changes this host's width. */
  readonly debugSidebarOpen = input(false);
  readonly selectionChanged = output<readonly number[]>();

  /** Feed this from the future WebSocket when another player discards a tile. */
  readonly tileCallOffer = input<TileCallOffer | null>(null);
  /** Feed a server-approved Mah Jongg result here to show the celebration. */
  readonly mahjongWin = input<MahjongWinCelebration | null>(null);
  /** Feed this from the server when an opponent has been away too long. */
  readonly playerAway = input<PlayerAwayNotice | null>(null);
  readonly joinTableRequest = input<JoinTableRequest | null>(null);
  /** Forward this intent to the future backend/WebSocket. */
  readonly tileCallDecision = output<TileCallDecision>();
  readonly playerRemovalRequested = output<PlayerRemovalRequest>();
  /** Sends the chosen opponent and reason to the Angular/backend layer. */
  readonly deadHandClaimed = output<DeadHandClaim>();
  /** Resets the temporary Discard selector after its one test discard. */
  readonly temporaryDiscardCompleted = output<void>();
  readonly joinTableRequestDecision = output<JoinTableRequestDecision>();

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly haptics = inject(GameHeptic);
  private readonly el = inject(ElementRef);

  // - Main Game service which interect with server --------------
  private readonly gameService = inject(GameService);
  private readonly gameState = inject(GameState);

  private phaser?: Phaser.Game;
  private readonly sceneReady = signal(false);
  private safeAreaRefreshTimer?: number;
  private debugViewportRefreshTimer?: number;
  private joinTablePopupTimer?: number;
  private mahjongWinPopupTimer?: number;

  private lastWallCount: number = -1;
  private lastDiscardCount: number = -1;
  private knownDiscardTileIds = new Set<number>();
  private lastKnownTurnSeatPos: TableSeat | undefined = undefined;

  public readonly GameDeadHandReasonEnum = GameDeadHandReasonEnum;

  readonly wallCountState = signal<WallCountOverlayState | null>(null);
  readonly pointsState = signal<PointsOverlayState | null>(null);
  readonly playerLabelStates = signal<readonly PlayerLabelOverlayState[]>([]);
  readonly instructionPanelOverlay = signal<InstructionPanelOverlayState | undefined>(undefined);
  readonly mahjongButtonOverlay = signal<MahjongButtonOverlayState | undefined>(undefined);
  readonly claimPanelOverlay = signal<ClaimPanelOverlayState | undefined>(undefined);
  readonly mobileHeaderToggleOverlay = signal<MobileHeaderToggleOverlayState | null>(null);

  readonly mobileDrawerState = signal<MobileDrawerOverlayState | null>(null);
  readonly deadHandSelectionState = signal<DeadHandSeatSelectionState | null>(null);
  readonly removePlayerNotice = signal<PlayerAwayNotice | null>(null);
  readonly removePlayerRemaining = signal<number>(0);
  readonly joinTableRequestState = signal<JoinTableRequest | null>(null);
  readonly joinTableRemaining = signal<number>(0);
  readonly deadHandClaimTarget = signal<Exclude<TableSeat, "bottom"> | null>(null);
  readonly deadHandClaimReason = signal<DeadHandReason>(GameDeadHandReasonEnum.FALSE_MAHJONG);
  readonly wallGameOver = signal<boolean>(false);
  /* NEWCODE */
  readonly gameOverState = signal<GameOverModalData>({
    isVisible: false,
    title: '',
    message: '',
  });
  /* NEWCODE */
  readonly mahjongGameOver = signal<boolean>(false);
  readonly mahjongWinResult = signal<MahjongWinCelebration | null>(null);
  /* NEWCODE */
  readonly winningOverlayData = signal<WinningOverlayData | null>(null);
  /* NEWCODE */


  private readonly deviceLayout = inject(PhaserLayoutDevice);
  private readonly injector = inject(Injector);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);

  /*constructor() {
    effect(() => {
      if (!this.game || !this.sceneReady()) return;
      this.game.events.emit("rack:set", this.rack());
    });

     effect(() => {
      if (!this.game || !this.sceneReady()) return;
      this.game.events.emit("pass:direction", this.passDirection());
    }); 
  } */

  private getSortedRack(): GameTileEntityGSDto[] {
    const order = this.gameState.personal_seat_rack_first_hand_order();
    const hand = this.gameState.personal_seat_rack_first_hand();

    if (order && order.length > 0) {
      // First, get all tiles that exist in the hand AND are in the order array
      const sortedTiles = order.map(id => hand[id]).filter(t => !!t);

      // Then, find any tiles in the hand that are NOT in the order array
      // (e.g. newly picked tiles or tiles received from Charleston)
      const unassignedTiles = Object.values(hand).filter(t => !order.includes(t.tile_id!));

      // Append unassigned tiles to the end of the rack
      return [...sortedTiles, ...unassignedTiles];
    }

    // Fallback if hand_order is empty
    const rack = Object.values(hand);

    rack.sort((a, b) => {
      let orderA: number | undefined;
      let orderB: number | undefined;

      if (a.in_rack_one !== null && a.sort_rack_one !== null) orderA = a.sort_rack_one;
      else if (a.in_rack_two !== null && a.sort_rack_two !== null) orderA = a.sort_rack_two;

      if (b.in_rack_one !== null && b.sort_rack_one !== null) orderB = b.sort_rack_one;
      else if (b.in_rack_two !== null && b.sort_rack_two !== null) orderB = b.sort_rack_two;

      if (orderA === undefined && orderB === undefined) return 0;
      if (orderA === undefined) return 1;
      if (orderB === undefined) return -1;

      return orderA - orderB;
    });

    return rack;
  }

  public sortRackByRank(rack: GameTileEntityGSDto[]): GameTileEntityGSDto[] {
    return [...rack].sort((a, b) => {
      const aIsJoker = a.fr_tile?.category as any as TileCategoryEnumAddon === TileCategoryEnumAddon.JOKER;
      const bIsJoker = b.fr_tile?.category as any as TileCategoryEnumAddon === TileCategoryEnumAddon.JOKER;

      // Jokers go to the far left
      if (aIsJoker && !bIsJoker) return -1;
      if (!aIsJoker && bIsJoker) return 1;
      if (aIsJoker && bIsJoker) return 0;

      // Sort by rank
      const aRank = a.fr_tile?.rank || '';
      const bRank = b.fr_tile?.rank || '';
      if (aRank !== bRank) {
        return aRank.localeCompare(bRank);
      }

      // Sort by category
      const aCategory = a.fr_tile?.category || '';
      const bCategory = b.fr_tile?.category || '';
      if (aCategory !== bCategory) {
        return aCategory.localeCompare(bCategory);
      }

      // Sort by type
      const aType = a.fr_tile?.type || '';
      const bType = b.fr_tile?.type || '';
      if (aType !== bType) {
        return aType.localeCompare(bType);
      }

      // Sort by set
      const aSet = a.fr_tile?.set || '';
      const bSet = b.fr_tile?.set || '';
      if (aSet !== bSet) {
        return aSet.localeCompare(bSet);
      }

      // Sort by id if all else is equal
      const aId = a.fr_tile?.id || 0;
      const bId = b.fr_tile?.id || 0;
      return aId - bId;
    });
  }

  public sortRackBySuit(rack: GameTileEntityGSDto[]): GameTileEntityGSDto[] {
    return [...rack].sort((a, b) => {
      const aIsJoker = a.fr_tile?.category as any as TileCategoryEnumAddon === TileCategoryEnumAddon.JOKER;
      const bIsJoker = b.fr_tile?.category as any as TileCategoryEnumAddon === TileCategoryEnumAddon.JOKER;

      // Jokers go to the far left
      if (aIsJoker && !bIsJoker) return -1;
      if (!aIsJoker && bIsJoker) return 1;
      if (aIsJoker && bIsJoker) return 0;

      // Sort by category
      const aCategory = a.fr_tile?.category || '';
      const bCategory = b.fr_tile?.category || '';
      if (aCategory !== bCategory) {
        return aCategory.localeCompare(bCategory);
      }

      // Sort by type
      const aType = a.fr_tile?.type || '';
      const bType = b.fr_tile?.type || '';
      if (aType !== bType) {
        return aType.localeCompare(bType);
      }

      // Sort by set
      const aSet = a.fr_tile?.set || '';
      const bSet = b.fr_tile?.set || '';
      if (aSet !== bSet) {
        return aSet.localeCompare(bSet);
      }

      // Sort by rank
      const aRank = a.fr_tile?.rank || '';
      const bRank = b.fr_tile?.rank || '';
      return aRank.localeCompare(bRank);
    });
  }

  public onAutoSortClicked(): void {
    const currentRack = this.getSortedRack();
    const sortedRack = this.sortRackByRank(currentRack);

    // Optimistically update the UI
    if (this.phaser && this.sceneReady()) {
      this.phaser.events.emit("rack:set", sortedRack);
    }

    // TODO: Persist the new order to the server when SDK supports ORDERINRACKONE WS call
  }

  /*   public onClaimOptionSelected(action: GamePlayActionEnum, tile_id: number): void {
      this.gameState.publishClaimAction(action, tile_id);
    }
   */
  private lastProcessedExchange: any = null;

  constructor() {
    /* NEWCODE */
    (window as any).testMahjongWin = (winnerSeat?: any) => this.testMahjongWin(winnerSeat);
    /* NEWCODE */
    effect(() => {
      // ResizeObserver provides intermediate sizes during the sidebar
      // animation. Re-apply the final measured size once that animation has
      // completed, otherwise Phaser can retain an intermediate table layout.
      this.debugSidebarOpen();
      if (!this.phaser || typeof window === "undefined") return;

      this.clearDebugViewportRefreshTimer();
      this.debugViewportRefreshTimer = window.setTimeout(() => {
        this.debugViewportRefreshTimer = undefined;
        requestAnimationFrame(() => this.syncGameViewport());
      }, 320);
    });

    effect(() => {
      const exchange = this.gameState.play_last_joker_exchange();
      if (!this.phaser || !this.sceneReady() || !exchange) return;

      if (JSON.stringify(this.lastProcessedExchange) !== JSON.stringify(exchange)) {
        this.lastProcessedExchange = exchange;
        const payload = {
          ...exchange,
          from_seat: this.gameState.seat_position_by_gseat_id()(exchange.from_gseat_id),
          to_seat: this.gameState.seat_position_by_gseat_id()(exchange.to_gseat_id)
        };
        this.phaser.events.emit("joker:exchange", payload);
      }
    });

    effect(() => {
      const err = this.gameState.play_action_error();
      if (!this.phaser || !this.sceneReady() || !err) return;
      if (err.event === 'game.subscribe.action.charlestone' || err.event === 'game.subscribe.action.pass_round') {
        this.phaser.events.emit("pass:failed");
        this.notify.error(err.message || 'An error occurred during the pass.');
      }
    });

    effect(() => {
      const rack = this.getSortedRack();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("rack:set", rack);
    });

    effect(() => {
      const order = this.gameState.personal_seat_rack_first_hand_order();
      if (!this.phaser || !this.sceneReady() || !order) return;
      this.phaser.events.emit("rack:order", order);
    });

    effect(() => {
      const allTiles = this.gameState.game_all_tiles();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("allTiles:set", allTiles);
    });

    effect(() => {
      const mapping = this.gameState.seat_mapping();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("seat:mapping", mapping);
    });


    // Track active turn for fallback in discards
    effect(() => {
      const activeSeat = this.gameState.active_table_position();
      if (activeSeat) {
        this.lastKnownTurnSeatPos = activeSeat;
      }
    });

    // Wall Count
    effect(() => {
      const count = this.gameState.play_wall_count();
      if (!this.phaser || !this.sceneReady()) {
        this.lastWallCount = count;
        return;
      }
      this.phaser.events.emit("wall:set-count", count);

      if (this.lastWallCount !== -1 && count < this.lastWallCount) {
        const currentTurnPos = this.gameState.active_table_position();
        if (currentTurnPos && currentTurnPos !== "bottom") {
          this.phaser.events.emit("opponent:pick", { seat: currentTurnPos });
        }
      }
      this.lastWallCount = count;
    });

    effect(() => {
      const discards = this.gameState.play_discards_tiles();
      const count = discards.length;
      if (!this.phaser || !this.sceneReady()) {
        return;
      }

      if (this.lastDiscardCount === -1) {
        this.phaser.events.emit("discards:set", discards);
        this.lastDiscardCount = count;
        for (const tile of discards) {
          if (tile.tile_id != null) {
            this.knownDiscardTileIds.add(tile.tile_id);
          }
        }
        return;
      }

      // A resolved claim removes a tile from the authoritative discard rack.
      // Forget removed physical IDs so an approved reverse-CALL update can
      // render that same tile back into the discard area later.
      if (count < this.lastDiscardCount) {
        const currentDiscardIds = new Set(
          discards
            .map((tile) => tile.tile_id)
            .filter((tileId): tileId is number => tileId != null),
        );
        this.knownDiscardTileIds.clear();
        for (const tileId of currentDiscardIds) {
          this.knownDiscardTileIds.add(tileId);
        }
        this.lastDiscardCount = count;
        return;
      }

      if (count > this.lastDiscardCount) {
        if (count - this.lastDiscardCount > 1) {
          // Bulk load (e.g. from initial API fetch) - render them statically
          this.phaser.events.emit("discards:set", discards);
          for (const tile of discards) {
            if (tile.tile_id != null) {
              this.knownDiscardTileIds.add(tile.tile_id);
            }
          }
        } else {
          // Normal single discard - animate it
          const newTiles = discards.filter(t => t.tile_id != null && !this.knownDiscardTileIds.has(t.tile_id));
          for (const tile of newTiles) {
            this.knownDiscardTileIds.add(tile.tile_id as number);
            let seatPos: TableSeat | undefined | null = undefined;
            if (tile.gseat_id) {
              const seatPosFn = this.gameState.seat_position_by_gseat_id();
              seatPos = seatPosFn(tile.gseat_id);
            }

            // Try to infer seat from claim state first
            if (!seatPos) {
              const claimFromSeatId = this.gameState.play_claim_from_seat();
              if (claimFromSeatId) {
                const seatPosFn = this.gameState.seat_position_by_gseat_id();
                seatPos = seatPosFn(claimFromSeatId);
              }
            }

            // Fallback based on the NEW active turn. The discarder is always the player just before the new active turn.
            if (!seatPos) {
              const currentActiveSeat = this.gameState.active_table_position();
              if (currentActiveSeat) {
                const order: TableSeat[] = ["bottom", "right", "top", "left"];
                const currentIndex = order.indexOf(currentActiveSeat);
                seatPos = order[(currentIndex + 3) % 4];
              }
            }

            // Absolute fallback to last known turn if previous fallbacks fail
            if (!seatPos && this.lastKnownTurnSeatPos) {
              seatPos = this.lastKnownTurnSeatPos;
            }

            if (seatPos && seatPos !== "bottom") {
              this.phaser.events.emit("opponent:discard", { seat: seatPos, tile });
            }
          }
        }
        this.lastDiscardCount = count;
      }
      this.lastDiscardCount = count;
    });

    effect(() => {
      const charlestonState = this.gameState.charlestonState();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("charleston:state", charlestonState);
    });

    effect(() => {
      const turnStage = this.gameState.play_turn_stage();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("table:turn_stage", turnStage);

      if (turnStage === GameTurnStageEnum.NEED_DISCARD && this.pendingDiscardTileId !== null) {
        // console.log(`[Component] Automatically firing pending discard tile ${this.pendingDiscardTileId}...`);
        this.gameState.publishDiscardTile(this.pendingDiscardTileId);
        this.pendingDiscardTileId = null;
      }
    });


    effect(() => {
      const canPick = this.gameState.canPickTile();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("wall:set-pick-mode", canPick);
    });

    effect(() => {
      const canDiscard = this.gameState.canDiscard();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("rack:set-discard-mode", canDiscard);
    });

    effect(() => {
      const phase = this.gameState.play_phase();
      const isClaimPhase = phase === GamePhaseEnum.CLAIM || phase === GamePhaseEnum.PLAYING;
      if (!this.phaser || !this.sceneReady()) return;

      const targets: number[] = this.gameState.play_claim_target_seat() || [];
      const submitted: Record<number, boolean> = this.gameState.play_claim_submissions() || {};
      const mySeatId = this.gameState.personal_seat_id();
      const claimTile = this.gameState.play_claim_tile();
      const claimObj = this.gameState.play_claim();

      const fromSeat = this.gameState.play_claim_from_seat();
      const isTargeted = mySeatId !== undefined && (targets.length === 0 ? mySeatId !== fromSeat : targets.includes(mySeatId));
      const hasSubmitted = mySeatId !== undefined && !!submitted[mySeatId];

      if (claimObj && claimTile && isTargeted && !hasSubmitted) {
        this.phaser.events.emit("ui:show-claim-window", { tile: claimTile });
      } else {
        this.phaser.events.emit("ui:hide-claim-window");
      }
    });

    effect(() => {
      const activePosition = this.gameState.active_table_position();
      const isPersonalTurn = this.gameState.play_current_turn_seat_id() === this.gameState.personal_seat_id();
      if (this.phaser && this.sceneReady()) {
        this.phaser.events.emit("table:active-seat", {
          seat: activePosition,
          isPersonalTurn: isPersonalTurn
        });
      }
    });

    effect(() => {
      const gameKey = this.gameState.game_keyid();
      if (gameKey === this.claimPresentationGameKey) return;
      this.claimPresentationGameKey = gameKey;
      this.claimPresentationInitialized = false;
      this.lastResolvedClaimPresentationKey = null;
      this.exposurePresentationInitialized = false;
      this.knownExposurePresentationKeys.clear();
      this.phaser?.events.emit("claim:presentation:reset");
    });

    effect(() => {
      const exposures = this.gameState.all_seat_exposures();
      if (this.phaser && this.sceneReady()) {
        // Keep the claim presentation and its exposure update in the same
        // synchronous path. Independent effects do not guarantee their event
        // order, which allowed a bot exposure to render before its discard.
        const claimPresentationStarted = this.emitResolvedClaimPresentation(exposures);
        this.emitExposureClaimPresentationFallback(exposures, claimPresentationStarted);
        this.phaser.events.emit("exposures:update", exposures);
      }
    });

    effect(() => {
      const deadStates = this.gameState.all_seat_dead_states();
      if (this.phaser && this.sceneReady()) {
        this.phaser.events.emit("ui:update-dead-states", deadStates);

        if (deadStates.bottom) {
          this.phaser.events.emit("rack:set-discard-mode", false);
          this.phaser.events.emit("wall:set-pick-mode", false);
        }
      }
    });

    effect(() => {
      const isFinished = this.gameState.play_phase() === GamePhaseEnum.FINISHED;
      const reason = this.gameState.play_finished_reason();
      const winnerSeatIds = this.gameState.play_winner_seat_ids();
      const wallCount = this.gameState.play_wall_count();

      let winnerId = (reason === 'MAHJONG' && winnerSeatIds && winnerSeatIds.length > 0) ? winnerSeatIds[0] : null;

      if (!winnerId) {
        const seats = this.gameState.play_seats();
        if (seats) {
          for (const [seatId, seatData] of Object.entries(seats)) {
            if (seatData?.racks) {
              for (const rack of Object.values(seatData.racks)) {
                if ((rack as any).is_mahjong) {
                  winnerId = Number(seatId);
                  break;
                }
              }
            }
            if (winnerId) break;
          }
        }
      }

      // const isWallGame = reason === 'WALL_EMPTY' || (wallCount === 0 && !winnerId); // OLDCODE
      const isWallGame = reason === 'WALL_EMPTY';

      /* OLDCODE
      if (this.phaser && this.sceneReady() && (isFinished || isWallGame)) {
        if (isWallGame) {
          this.wallGameOver.set(true);
        } else if (winnerId) {
          const tableSeat = this.gameState.seat_position_by_gseat_id()(winnerId);

          if (tableSeat) {
            const opponentHands: Record<string, number[]> = {};
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const [seatId, seatData] of Object.entries(seats)) {
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));
                if (seatPos && seatPos !== 'bottom' && seatData?.racks) {
                   const tiles: number[] = [];
                   for (const rack of Object.values(seatData.racks)) {
                      if ((rack as any).tiles) tiles.push(...(rack as any).tiles);
                   }
                   opponentHands[seatPos] = tiles;
                }
              }
            }

            this.setMahjongWinPopup({
              winner: tableSeat,
              requestId: 0,
              opponentHands
            });
          }
        }
      }
      OLDCODE */
      /* NEWCODE */
      if (this.phaser && this.sceneReady() && (isFinished || isWallGame)) {
        if (winnerId) {
          const tableSeat = this.gameState.seat_position_by_gseat_id()(winnerId);

          if (tableSeat) {
            const opponentHands: Record<string, number[]> = {};
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const [seatId, seatData] of Object.entries(seats)) {
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));
                if (seatPos && seatPos !== 'bottom' && seatData?.racks) {
                   const tiles: number[] = [];
                   for (const rack of Object.values(seatData.racks)) {
                      if ((rack as any).tiles) tiles.push(...(rack as any).tiles);
                   }
                   opponentHands[seatPos] = tiles;
                }
              }
            }

            this.setMahjongWinPopup({
              winner: tableSeat,
              requestId: 0,
              opponentHands
            });
          }
        } else if (isWallGame) {
          this.gameOverState.set({
            isVisible: true,
            title: 'Wall Game',
            message: 'That means no one win the game.',
            reason: 'WALL_EMPTY'
          });
          this.wallGameOver.set(true);
        } else {
          // Dead Hand / No Active Racks Game Over
          const deadNote = this.gameState.personal_seat_dead_note() || 'All active player hands are dead.';
          this.gameOverState.set({
            isVisible: true,
            title: 'Game Over',
            message: 'Game ended due to Dead Hand.',
            note: deadNote,
            reason: reason || 'NO_ACTIVE_RACKS'
          });
          this.wallGameOver.set(true);
        }
      }
      /* NEWCODE */
    });

    effect(() => {
      const direction = this.gameState.play_pass_direction();
      // console.log('EFFECT Phaser pass:direction', direction)
      if (!this.phaser || !this.sceneReady() || !direction) return;

      // console.log("[PhaserBoardComponent] emit pass:direction", direction);

      this.phaser.events.emit("pass:direction", direction);
    });

    effect(() => {
      const playPhase = this.gameState.play_phase();
      if (!this.phaser || !this.sceneReady() || !playPhase) return;

      // console.log("[PhaserBoardComponent] emit table:phase", playPhase);

      this.phaser.events.emit("table:phase", playPhase);
    });

    effect(() => {
      const offer = this.tileCallOffer();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("tile-call:offer", offer);
    });



    effect(() => {
      const result = this.mahjongWin();
      this.setMahjongWinPopup(result);
    });

    effect(() => {
      const notice = this.playerAway();
      this.setRemovePlayerPopup(notice);
    });

    effect(() => {
      const request = this.joinTableRequest();
      this.setJoinTablePopup(request);
    });

  }

  ngAfterViewInit(): void {
    const host = this.hostRef.nativeElement;
    const dpr = window.devicePixelRatio || 1; // 1. Determine device pixel ratio

    const initialLayout = this.deviceLayout.forViewport(
      host.clientWidth,
      host.clientHeight,
    ).layout;

    this.setMobileHeaderCollapsed(
      initialLayout === "phone-portrait" || initialLayout === "phone-landscape",
    );

    this.zone.runOutsideAngular(() => {
      let scene!: PhaserScene;
      runInInjectionContext(this.injector, () => {
        scene = new PhaserScene(this.gameService, {
          getUsername: () => this.gameState.ctxp.state.user_fullname || this.gameState.ctxp.state.user_username || "PLAYER",
          onSelectionChanged: (ids) => this.zone.run(() => this.selectionChanged.emit(ids)),
          onPassCompleted: async (payload) => {
            // console.log("[PhaserBoardComponent] Publishing Charleston with tiles:", payload.tileIds);
            await this.gameState.publishCharlestone(payload.tileIds);
          },
          onHaptic: (type: GameHapticType) => {
            void this.haptics.play(type);
          },
          getDeviceLayout: (width, height) =>
            this.deviceLayout.forViewport(width, height),
          onMobileHeaderChanged: (collapsed) =>
            this.setMobileHeaderCollapsed(collapsed),
          onLocalPlayerDiscard: (tileId) => {
            if (this.gameState.play_turn_stage() === GameTurnStageEnum.NEED_EXPOSURE) {
              this.pendingDiscardTileId = tileId;
              // console.log(`[Component] Saved pending discard tile ${tileId} while waiting for exposure API...`);
            } else {
              this.gameState.publishDiscardTile(tileId);
            }
            this.knownDiscardTileIds.add(tileId);
          },
          onLocalPlayerExposureCreate: async (tileIds) => {
            await this.gameState.publishMoveTilesToExposurePanel(tileIds, 0); // targetRackId isn't actually used in publishMoveTilesToExposurePanel's GraphQL call inside state.ts
          },
          onLocalPlayerReverseCall: async () => {
            await this.gameState.publishReverseCallTile();
          },
          onLocalPlayerJokerExchange: async (targetJokerTileId, rackReplacementTileId, targetSeat) => {
            let toSeatId = this.gameState.personal_seat_id();
            if (targetSeat !== "bottom") {
              const opponentSeat = Object.values(this.gameState.play_seats()).find((s: any) => this.gameState.seat_position_by_gseat_id()(s.id) === targetSeat);
              if (opponentSeat) {
                toSeatId = opponentSeat.id;
              }
            }
            await this.gameState.publishJokerExchange(
              targetJokerTileId,
              rackReplacementTileId,
              this.gameState.personal_seat_id(),
              toSeatId,
              GameRackIDEnumAddon.RACK_FIRST
            );
          },
          onLocalPlayerPick: () => {
            this.gameState.publishPickTile();
          },
          onSortRequested: (mode) => {
            let enumMode = GameTileOrderEnumAddon.BY_RANK;
            if (mode === "suit") enumMode = GameTileOrderEnumAddon.BY_SUIT;
            this.gameState.publishOderPersonalRackTiles(enumMode);
          },
          onMahjongDeclare: () => {
            this.gameState.publishMahjongDeclare();
          },
          onWallCountOverlay: (state) => this.setWallCountOverlay(state),
          onPlayerLabelOverlay: (states) => this.setPlayerLabelOverlays(states),
          onPointsOverlay: (state) => this.setPointsOverlay(state),
          onMobileDrawerVisibilityChanged: (open) => this.setMobileDrawerOpen(open),
          onMobileDrawerOverlay: (state) => this.setMobileDrawerOverlay(state),
          onMobileHeaderToggleOverlay: (state) => this.setMobileHeaderToggleOverlay(state),
          onInstructionPanelOverlay: (state) => this.setInstructionPanelOverlay(state),
          onMahjongButtonOverlay: (state) => this.mahjongButtonOverlay.set(state),
          onClaimPanelOverlay: (state) => this.setClaimPanelOverlay(state),
          onTableOverlayBlocked: (level) => this.setTableOverlayBlocked(level),
          onDeadHandSeatSelection: (state) => this.setDeadHandSeatSelection(state),
          onHeaderLogoLayout: (state) => this.setHeaderLogoLayout(state),
          onTileCallDecision: (decision) =>
            this.zone.run(() => this.tileCallDecision.emit(decision)),
          onPlayerRemovalRequested: (request) =>
            this.zone.run(() => this.playerRemovalRequested.emit(request)),
          onDeadHandClaimPrompt: (targetSeat) => this.setDeadHandPopup(targetSeat),
          onTemporaryDiscardCompleted: () =>
            this.zone.run(() => this.temporaryDiscardCompleted.emit()),
          onRestartGame: () => this.zone.run(() => this.onStartNewGame()),
          onQuitGame: () => this.zone.run(() => this.onExitGame()),
        });
      });

      this.phaser = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        // 2. Scale up base width and height by the DPR to match hardware pixels
        width: Math.max(1, host.clientWidth) * dpr,
        height: Math.max(1, host.clientHeight) * dpr,
        backgroundColor: COLOR_BLUE,

        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },

        render: {
          antialias: true,
          antialiasGL: true,
          roundPixels: true,
          pixelArt: false,
        },

        input: {
          activePointers: 4,
        },

        scene: [scene],
      });

      // 5. Force the canvas DOM element to fit your container using CSS
      const canvas = this.phaser.canvas;
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }

      // console.log('300 sceneReady', this.sceneReady());

      this.phaser.events.once("table:ready", () => {
        this.sceneReady.set(true);
        // console.log('304 sceneReady', this.sceneReady());
        // The scene has now registered its resize listener, so apply the
        // initial iOS/Android inset measurement through the normal layout
        // path instead of only storing it for a later resize.
        this.syncGameViewport();
        const rack = this.getSortedRack();
        this.phaser?.events.emit("allTiles:set", this.gameState.game_all_tiles());
        this.phaser?.events.emit("rack:set", rack);
        this.phaser?.events.emit("tile-call:offer", this.tileCallOffer());
        const win = this.mahjongWin();
        if (win) this.setMahjongWinPopup(win);
        this.phaser?.events.on(

          "charleston:animation-complete",

          () => {

            // console.log("Charleston animation finished");

            /**
             * Development only.
             *
             * Here we will later replace the racks
             * with the received tiles.
             */
          }

        );
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      this.syncGameViewport();
    });

    resizeObserver.observe(host);

    // A single deferred read handles WebKit's post-rotation env() update
    // without adding any recurring work to the render loop.
    const refreshSafeAreaAfterOrientation = (): void => {
      this.clearSafeAreaRefreshTimer();
      this.safeAreaRefreshTimer = window.setTimeout(() => {
        this.safeAreaRefreshTimer = undefined;
        this.syncGameViewport();
      }, 180);
    };
    window.addEventListener("orientationchange", refreshSafeAreaAfterOrientation, { passive: true });

    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", refreshSafeAreaAfterOrientation);
      this.clearSafeAreaRefreshTimer();
      this.clearDebugViewportRefreshTimer();
      this.clearJoinTablePopupTimer();
      this.clearMahjongWinPopupTimer();

      this.phaser?.destroy(true);
      this.phaser = undefined;
      this.sceneReady.set(false);
    });
  }

  private readSafeAreaInsets(): {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  } {
    const probeStyles = getComputedStyle(this.safeAreaProbeRef.nativeElement);

    const insets = {
      top: this.readCssPx(probeStyles.paddingTop),
      right: this.readCssPx(probeStyles.paddingRight),
      bottom: this.readCssPx(probeStyles.paddingBottom),
      left: this.readCssPx(probeStyles.paddingLeft),
    };

    // Some iOS WebViews report a zero `safe-area-inset-top` in landscape
    // despite the visible status area overlaying the game. Keep a compact
    // native-iOS-only reserve (about two black table-border widths) in that
    // case; Android and browser layouts are untouched.
    const isIosLandscape =
      this.isIosRuntime() && window.matchMedia("(orientation: landscape)").matches;
    if (!isIosLandscape || insets.top > 0) return insets;

    const minimumTopReserve = Math.max(
      8,
      Math.min(10, Math.round(this.hostRef.nativeElement.clientHeight * 0.02)),
    );
    // Mirror the fallback at the bottom so the table remains vertically
    // balanced. Never reduce a real bottom inset reported by the device.
    return {
      ...insets,
      top: minimumTopReserve,
      bottom: Math.max(insets.bottom, minimumTopReserve),
    };
  }

  /** Covers native Capacitor, Safari, and installed iPad/iPhone PWAs. */
  private isIosRuntime(): boolean {
    if (Capacitor.getPlatform() === "ios") return true;

    const userAgent = navigator.userAgent;
    return (
      /iPad|iPhone|iPod/i.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  /** Sends the current viewport and latest resolved safe area to Phaser. */
  private syncGameViewport(): void {
    if (!this.phaser) return;

    const host = this.hostRef.nativeElement;
    const width = Math.max(1, Math.round(host.clientWidth));
    const height = Math.max(1, Math.round(host.clientHeight));

    const safeArea = this.readSafeAreaInsets();
    // Keep DOM header assets aligned with Phaser's resolved iOS fallback inset.
    host.style.setProperty("--game-safe-top", `${safeArea.top}px`);
    this.phaser.scale.resize(width, height);
    this.phaser.events.emit("table:safe-area", safeArea);
    this.phaser.events.emit("table:resize", width, height);
  }

  private clearSafeAreaRefreshTimer(): void {
    if (this.safeAreaRefreshTimer === undefined) return;
    window.clearTimeout(this.safeAreaRefreshTimer);
    this.safeAreaRefreshTimer = undefined;
  }

  private clearDebugViewportRefreshTimer(): void {
    if (this.debugViewportRefreshTimer === undefined) return;
    window.clearTimeout(this.debugViewportRefreshTimer);
    this.debugViewportRefreshTimer = undefined;
  }

  private setMobileHeaderCollapsed(collapsed: boolean): void {
    this.hostRef.nativeElement.classList.toggle(
      "mobile-header-collapsed",
      collapsed,
    );
    this.headerLogoRef.nativeElement.hidden = collapsed;
  }

  /**
   * Uses browser-native text for the small wall count while Phaser continues
   * to own the tile icon and all layout calculations.
   */
  private setWallCountOverlay(state: WallCountOverlayState): void {
    this.wallCountState.set(state);
  }

  /** Uses native text for the mobile points value; Phaser still draws its icon. */
  private setPointsOverlay(state: PointsOverlayState): void {
    this.pointsState.set(state);
  }

  /**
   * Phaser calculates all seat coordinates while the browser draws the
   * label text sharply at every viewport size.
   */
  private setPlayerLabelOverlays(states: readonly PlayerLabelOverlayState[]): void {
    this.playerLabelStates.set(states);
  }

  /**
   * Native text sits above the Phaser canvas to remain sharp. A Phaser drawer
   * therefore explicitly suspends those overlays, then restores their most
   * recent layout state after the drawer closes.
   */
  private setMobileDrawerOpen(open: boolean): void {
    // The native drawer itself now covers the menu region, so sharp labels
    // remain visible outside it and never need a blurry Phaser fallback.
  }

  toggleMobileHeader(): void {
    if (!this.phaser) return;
    this.phaser.events.emit("mobile-header:toggle");
  }

  private setMobileDrawerOverlay(state: MobileDrawerOverlayState): void {
    this.mobileDrawerState.set(state);
  }

  private setMobileHeaderToggleOverlay(state: MobileHeaderToggleOverlayState): void {
    this.mobileHeaderToggleOverlay.set(state);
  }


  /**
   * Centre instruction card. Phaser resolves every coordinate from the layout
   * engine; the browser paints the card, its copy, and its primary button so
   * the text stays sharp on any screen size or pixel ratio.
   */
  /**
   * Yields the native overlay layer while a Phaser popup is open.
   *
   * HTML always paints above the canvas, so a Phaser popup such as CALL/SKIP
   * can only come forward if the overlays covering it step aside first.
   */
  private setTableOverlayBlocked(level: TableOverlayBlockLevel): void {
    const host = this.el.nativeElement.classList;
    host.toggle("table-popup-center", level === "center");
    host.toggle("table-popup-screen", level === "screen");
  }

  public onMobileDrawerClose(): void {
    this.phaser?.events.emit("mobile-drawer:close");
  }

  public onMobileDrawerItemClick(item: string): void {
    this.phaser?.events.emit("hamburger:html-action", item);
  }

  public getMobileDrawerHeight(state: MobileDrawerOverlayState): number {
    const nativeRowHeight = 44; // 16px font * 1.55 line-height + 16px vertical padding
    const nativeTitleHeight = state.title ? 38 : 0;
    const nativePaddingHeight = state.title ? 30 : 72;
    const requiredHeight = nativeTitleHeight + nativePaddingHeight + state.items.length * nativeRowHeight;
    return Math.max(Math.round(state.height), requiredHeight);
  }

  public getInstructionButtonBackground(enabled: boolean): string {
    const color = enabled ? COLOR_FUSHIA : "#777777";
    return `linear-gradient(180deg, rgb(255 255 255 / 12%), rgb(255 255 255 / 0%) 48%), ${color}`;
  }

  public getInstructionButtonShadow(action: any): string {
    const alpha = action.enabled ? 34 : 20;
    return `0 ${action.shadowY}px ${action.shadowBlur}px rgb(7 20 47 / ${alpha}%)`;
  }

  public onDeadHandSeatSelect(seat: TableSeat): void {
    this.phaser?.events.emit("dead-hand:select-seat", seat);
  }

  public onDeadHandCancel(): void {
    this.phaser?.events.emit("dead-hand:cancel");
  }

  public getFormattedElapsed(notice: PlayerAwayNotice): string {
    const elapsed = Math.max(0, Date.now() - notice.awaySinceMs);
    return `${Math.floor(elapsed / 60000)}:${String(Math.floor(elapsed / 1000) % 60).padStart(2, "0")}`;
  }

  public getFormattedLimit(notice: PlayerAwayNotice): string {
    const limit = notice.removeAfterMs ?? 120000;
    return `${Math.floor(limit / 60000)}:${String(Math.floor(limit / 1000) % 60).padStart(2, "0")}`;
  }

  public getFormattedRemaining(remaining: number): string {
    return `${Math.floor(remaining / 60000)}:${String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}`;
  }

  public getDeadHandTargetLabel(targetSeat: Exclude<TableSeat, "bottom">): string {
    const labels: Record<Exclude<TableSeat, "bottom">, string> = {
      top: "PLAYER 1 (TOP)", right: "PLAYER 2 (RIGHT)", left: "PLAYER 3 (LEFT)",
    };
    return labels[targetSeat];
  }

  private rawInstructionPanelState?: InstructionPanelOverlayState;
  public confirmStopCharleston = signal(false);

  private setInstructionPanelOverlay(state: InstructionPanelOverlayState): void {
    this.rawInstructionPanelState = state;
    this.renderInstructionPanelOverlay();
  }

  private renderInstructionPanelOverlay(): void {
    let state = this.rawInstructionPanelState;
    if (state && this.confirmStopCharleston()) {
      state = {
        ...state,
        title: "Are you sure?",
        body: "",
        button: {
          ...state.button,
          label: "YES",
          action: "stop-confirm"
        },
        secondaryButton: {
          ...state.secondaryButton!,
          label: "NO",
          action: "stop-cancel"
        }
      };
    }
    //this.zone.run(() => this.instructionPanelOverlay.set(state)); // OLDCODE
    this.zone.run(() => {
      this.instructionPanelOverlay.set(state);
      this.phaser?.events.emit("instruction-panel:sync", state);
    });
  }

  setClaimPanelOverlay(state: ClaimPanelOverlayState): void {
    this.zone.run(() => this.claimPanelOverlay.set(state));
  }

  public onInstructionPanelClick(action?: string): void {
    const state = this.instructionPanelOverlay();
    if (!state) return;

    if (action === "pass") {
      this.confirmStopCharleston.set(false);
      this.gameState.publishCharlestoneSecondRoundVote(true);
    } else if (action === "stop") {
      this.confirmStopCharleston.set(true);
      this.renderInstructionPanelOverlay();
    } else if (action === "stop-confirm") {
      this.confirmStopCharleston.set(false);
      this.phaser?.events.emit("play-stop-charleston");
      this.gameState.publishCharlestoneSecondRoundVote(false);
    } else if (action === "stop-cancel") {
      this.confirmStopCharleston.set(false);
      this.renderInstructionPanelOverlay();
    } else {
      if (!state.button.enabled) return;
      this.phaser?.events.emit("instruction-panel:primary-action");
    }
  }

  /**
   * First Dead Hand step. Phaser resolves the exposure boxes from the layout
   * engine, so the highlights stay locked to the table; the browser draws the
   * dimmer, arrows, and copy so the text is sharp at any pixel ratio.
   */
  private setDeadHandSeatSelection(state: DeadHandSeatSelectionState): void {
    this.deadHandSelectionState.set(state);
  }

  private removePlayerPopupTimer?: number;

  private setRemovePlayerPopup(notice: PlayerAwayNotice | null): void {
    this.removePlayerNotice.set(notice);
    this.clearRemovePlayerPopupTimer();

    if (!notice) return;

    const limit = notice.removeAfterMs ?? 120000;

    const refreshCountdown = (): void => {
      const elapsed = Math.max(0, Date.now() - notice.awaySinceMs);
      const remaining = Math.max(0, limit - elapsed);
      this.removePlayerRemaining.set(remaining);
    };

    this.removePlayerPopupTimer = window.setInterval(refreshCountdown, 250);
    refreshCountdown();
  }

  private clearRemovePlayerPopupTimer(): void {
    if (this.removePlayerPopupTimer !== undefined) {
      window.clearInterval(this.removePlayerPopupTimer);
      this.removePlayerPopupTimer = undefined;
    }
  }

  public onRemovePlayer(notice: PlayerAwayNotice): void {
    this.zone.run(() => this.playerRemovalRequested.emit({ seat: notice.seat, requestId: notice.requestId }));
  }

  public onKeepWaitingPlayer(): void {
    this.setRemovePlayerPopup(null);
  }

  /**
   * Native join-request popup. Keeping this outside Phaser makes its text and
   * controls sharp, responsive, and above the game table on every device.
   */
  private setJoinTablePopup(request: JoinTableRequest | null): void {
    this.joinTableRequestState.set(request);
    this.clearJoinTablePopupTimer();

    if (!request) return;

    const expiresAt = request.expiresAtMs ?? Date.now() + 15_000;
    const refreshCountdown = (): void => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      this.joinTableRemaining.set(seconds);
      if (seconds === 0) this.setJoinTablePopup(null);
    };
    this.joinTablePopupTimer = window.setInterval(refreshCountdown, 250);
    refreshCountdown();
  }

  private clearJoinTablePopupTimer(): void {
    if (this.joinTablePopupTimer !== undefined) {
      window.clearInterval(this.joinTablePopupTimer);
      this.joinTablePopupTimer = undefined;
    }
  }

  public onJoinTableAction(request: JoinTableRequest, action: JoinTableRequestDecision["action"]): void {
    this.zone.run(() => this.joinTableRequestDecision.emit({ requestId: request.requestId, action }));
    this.setJoinTablePopup(null);
  }

  public onDeadHandReasonSelect(reason: DeadHandReason): void {
    this.deadHandClaimReason.set(reason);
  }

  public onSubmitDeadHandClaim(targetSeat: Exclude<TableSeat, "bottom">, reason: DeadHandReason): void {
    this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
    this.setDeadHandPopup(null);
  }

  public onCancelDeadHandClaim(): void {
    this.setDeadHandPopup(null);
  }

  public onMahjongButtonClick(): void {
    console.log("Mahjong button clicked!");
    this.phaser?.events.emit("instruction-panel:mahjong");
  }

  /**
   * Emits before the matching exposure event so Phaser can stage a bot's
   * otherwise missed discard. The first received play state is deliberately
   * recorded as a baseline to avoid replaying an old claim on hydration.
   */
  private emitResolvedClaimPresentation(exposures: Record<TableSeat, any[]>): boolean {
    const revision = this.gameState.play_revision();
    const claim = this.gameState.play_last_claim();
    const gameKey = this.gameState.game_keyid();
    if (revision === 0) return false;

    const tile = claim?.tile;
    const fromSeatId = claim?.from_seat;
    const claimKey = tile?.tile_id != null && fromSeatId != null
      ? `${gameKey}:${tile.tile_id}:${fromSeatId}:${claim?.deadline_at ?? revision}`
      : null;

    if (!this.claimPresentationInitialized) {
      this.claimPresentationInitialized = true;
      this.lastResolvedClaimPresentationKey = claimKey;
      return false;
    }
    if (!claimKey || claimKey === this.lastResolvedClaimPresentationKey) return false;
    this.lastResolvedClaimPresentationKey = claimKey;

    const tileId = Number(tile!.tile_id);
    const exposureContainsClaimedTile = Object.values(exposures).some((melds: any[]) =>
      (melds ?? []).some((meld: any) => {
        const meldTiles = meld?.tiles
          ? (Array.isArray(meld.tiles) ? meld.tiles : Object.values(meld.tiles))
          : (meld?.tile ? [meld.tile] : []);
        return meldTiles.some((meldTile: any) => Number(meldTile?.tile_id) === tileId);
      }),
    );
    const isMahjong = this.gameState.play_phase() === GamePhaseEnum.FINISHED
      && this.gameState.play_finished_reason() === "MAHJONG";
    if (!exposureContainsClaimedTile && !isMahjong) return false;

    const discardedBy = this.gameState.seat_position_by_gseat_id()(Number(fromSeatId));
    if (!discardedBy || !this.phaser || !this.sceneReady()) return false;
    const payload: ResolvedClaimPresentation = { key: claimKey, tile: tile!, discardedBy };
    this.phaser.events.emit("claim:resolved", payload);
    return true;
  }

  /**
   * Fallback for bot updates that arrive with the completed exposure but no
   * usable `last_claim`. A new meld retains its discarded source (`from_seat`)
   * and claimed tile, which is sufficient for the same presentation flow.
   */
  private emitExposureClaimPresentationFallback(exposures: Record<TableSeat, any[]>, suppressPresentation: boolean): void {
    const candidates: Array<{ key: string; tile: GameTileEntityGSDto; fromSeatId: number }> = [];

    for (const [seat, melds] of Object.entries(exposures)) {
      // The local player finalizes CALL into Pung/Kong/Quint after choosing a
      // group. That is not a new discard and must never synthesize one.
      // Immediate-resolution fallback is only needed for opponent bot melds.
      if (seat === "bottom") continue;
      for (const meld of melds ?? []) {
        const tile = meld?.tile as GameTileEntityGSDto | undefined;
        const fromSeatId = Number(meld?.from_seat);
        if (!tile || tile.tile_id == null || !Number.isFinite(fromSeatId)) continue;

        // A manual CALL becomes Pung/Kong/Quint by changing `kind`; retain one
        // identity across that lifecycle so it cannot be presented twice.
        const key = `${fromSeatId}:${tile.tile_id}:${meld?.to_seat ?? ""}`;
        const isNew = !this.knownExposurePresentationKeys.has(key);
        this.knownExposurePresentationKeys.add(key);
        if (this.exposurePresentationInitialized && isNew) {
          candidates.push({ key, tile, fromSeatId });
        }
      }
    }
    if (!this.exposurePresentationInitialized) {
      this.exposurePresentationInitialized = true;
      return;
    }
    if (suppressPresentation) return;

    for (const candidate of candidates) {
      const discardedBy = this.gameState.seat_position_by_gseat_id()(candidate.fromSeatId);
      if (!discardedBy || !this.phaser || !this.sceneReady()) continue;
      this.phaser.events.emit("claim:resolved", {
        key: `exposure:${this.gameState.game_keyid()}:${candidate.key}`,
        tile: candidate.tile,
        discardedBy,
      } satisfies ResolvedClaimPresentation);
    }
  }

  public onClaimPanelClick(action: "call" | "skip" | "mahjong" | "pick"): void {
    if (action === "pick") {
      this.phaser?.events.emit("instruction-panel:primary-action");
      return;
    }

    const claimTile = this.gameState.play_claim_tile();
    if (!claimTile) return;

    if (action === "call") {
      void this.gameState.publishClaimAction(GamePlayActionEnumAddon.CALL, claimTile.tile_id as number);
      this.phaser?.events.emit("ui:claim-submitted", { tile_id: claimTile.tile_id, action });
    } else if (action === "skip") {
      void this.gameState.publishClaimAction(GamePlayActionEnumAddon.PASS, claimTile.tile_id as number);
    } else if (action === "mahjong") {
      void this.gameState.publishClaimAction(GamePlayActionEnumAddon.MAHJONG, claimTile.tile_id as number);
      this.phaser?.events.emit("ui:claim-submitted", { tile_id: claimTile.tile_id, action });
    }
  }

  /**npm run
   * Native Dead Hand claim dialog. Phaser retains the exposure highlights and
   * seat arrows; this overlay owns the readable reason-selection controls.
   */
  private setDeadHandPopup(targetSeat: Exclude<TableSeat, "bottom"> | null): void {
    this.deadHandClaimTarget.set(targetSeat);
    if (targetSeat) {
      this.deadHandClaimReason.set(GameDeadHandReasonEnum.FALSE_MAHJONG);
    }
  }

  /**
   * Native MAH JONGG win celebration popup. Phaser no longer renders the
   * overlay; the browser paints the card, confetti and all copy so the text
   * stays sharp at any device pixel ratio.
   */
  readonly mahjongConfetti = signal<any[]>([]);

  private setMahjongWinPopup(result: MahjongWinCelebration | null): void {
    this.mahjongWinResult.set(result);
    this.clearMahjongWinPopupTimer();
    this.setTableOverlayBlocked(result ? "screen" : "none");

    if (!result) {
      /* NEWCODE */
      this.winningOverlayData.set(null);
      /* NEWCODE */
      return;
    }

    /* NEWCODE */
    try {
      const winData = this.buildWinningOverlayData(result);
      this.winningOverlayData.set(winData);
    } catch (e) {
      console.warn("Error building winning overlay data:", e);
    }
    /* NEWCODE */

    this.phaser?.events.emit("mahjong:win", result);
    void this.haptics.play("pass-submit" as any);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const particleCount = Math.max(36, Math.min(88, Math.round(vw / 13)));
    const colors = ["#f6c542", "#B92A90", "#60a5fa", "#34d399", "#ffffff"];
    const confettiList = [];

    for (let i = 0; i < particleCount; i++) {
      const size = 5 + Math.random() * 5;
      const startX = Math.random() * vw;
      const startY = -(Math.random() * vh * 0.25);
      const startRotate = (Math.random() - 0.5) * 80;
      const endRotate = startRotate + 240 + Math.random() * 300;
      const duration = 1300 + Math.random() * 1100;
      const delay = Math.random() * 450;

      confettiList.push({
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${size}px`,
        height: `${Math.round(size * 0.55)}px`,
        background: colors[i % colors.length],
        fallDuration: `${Math.round(duration)}ms`,
        fallDelay: `${Math.round(delay)}ms`,
        startRotate: `${startRotate}deg`,
        endRotate: `${endRotate}deg`,
        fallDistance: `${vh + 24 - startY}px`
      });
    }

    this.mahjongConfetti.set(confettiList);
  }

  /* NEWCODE */
  private buildWinningOverlayData(result: MahjongWinCelebration): WinningOverlayData {
    const winnerPos = result.winner;
    
    // 1. Resolve Winner Name
    let winnerName = 'Player';
    if (winnerPos === 'bottom') {
      winnerName = 'YOU';
    } else {
      const seatsObj = this.gameState.play_seats();
      let seatId = 0;
      if (seatsObj) {
        for (const [id, s] of Object.entries(seatsObj)) {
          if (this.gameState.seat_position_by_gseat_id()(Number(id)) === winnerPos) {
            seatId = Number(id);
            break;
          }
        }
      }
      const profile = this.gameState.game_bot_profile() as any;
      if (seatId && profile && profile[seatId]) {
        winnerName = profile[seatId].name || `Computer (${winnerPos.toUpperCase()})`;
      } else {
        winnerName = `Computer (${winnerPos.charAt(0).toUpperCase() + winnerPos.slice(1)})`;
      }
    }

    // 2. Score Calculation
    const baseScore = 25;
    const bonus = 25;
    const totalPoints = baseScore + bonus;

    // 3. Extract Tiles & Melds
    const winningHandGroups: WinningMeldGroup[] = [];
    const allTilesMap = this.gameState.game_all_tiles();
    
    const seatsObj = this.gameState.play_seats();
    let winnerSeatData: any = null;
    if (seatsObj) {
      for (const [id, s] of Object.entries(seatsObj)) {
        if (this.gameState.seat_position_by_gseat_id()(Number(id)) === winnerPos) {
          winnerSeatData = s;
          break;
        }
      }
    }

    const rack = winnerSeatData?.racks?.[1] || winnerSeatData?.racks?.[GameRackIDEnumAddon.RACK_FIRST];

    // Process Exposed Melds
    const exposures = rack?.exposures_meld || [];
    const processedTileIds = new Set<number>();

    for (const exp of exposures) {
      const tileIds: number[] = exp.tile_ids || exp.tiles || [];
      const tilesData: WinningTileData[] = [];
      for (const tid of tileIds) {
        processedTileIds.add(tid);
        const rawTile = allTilesMap?.[tid];
        if (rawTile) {
          tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
        }
      }
      if (tilesData.length > 0) {
        const combName = exp.combination || `${tilesData.length} Tiles`;
        winningHandGroups.push({
          combinationName: combName,
          tiles: tilesData
        });
      }
    }

    // Process Concealed Hand Tiles
    const handTileIds: number[] = [];
    if (rack?.hand_order && Array.isArray(rack.hand_order)) {
      for (const id of rack.hand_order) {
        if (!processedTileIds.has(id)) handTileIds.push(id);
      }
    } else if (rack?.tiles && Array.isArray(rack.tiles)) {
      for (const id of rack.tiles) {
        if (!processedTileIds.has(id)) handTileIds.push(id);
      }
    } else if (rack?.hand && typeof rack.hand === 'object') {
      for (const idStr of Object.keys(rack.hand)) {
        const id = Number(idStr);
        if (!processedTileIds.has(id)) handTileIds.push(id);
      }
    }

    const concealedTiles: WinningTileData[] = [];
    for (const tid of handTileIds) {
      const rawTile = allTilesMap?.[tid];
      if (rawTile) {
        concealedTiles.push(this.mapRawTileToWinningTile(rawTile, tid));
      }
    }

    if (concealedTiles.length > 0) {
      const groupedConcealed = this.groupConcealedTiles(concealedTiles);
      winningHandGroups.push(...groupedConcealed);
    }

    /* NEWCODE */
    if (winningHandGroups.length === 0) {
      winningHandGroups.push(
        {
          combinationName: '3 Flowers',
          tiles: [
            { id: 1, assetName: 'f1', category: 'FLOWER', type: 'FLOWER', rank: 1, label: 'Flower 1' },
            { id: 2, assetName: 'f2', category: 'FLOWER', type: 'FLOWER', rank: 2, label: 'Flower 2' },
            { id: 3, assetName: 'f3', category: 'FLOWER', type: 'FLOWER', rank: 3, label: 'Flower 3' }
          ]
        },
        {
          combinationName: 'Pung 1-Bam',
          tiles: [
            { id: 4, assetName: 'b1', category: 'SUITED', type: 'BAM', rank: 1, label: '1 Bam' },
            { id: 5, assetName: 'b1', category: 'SUITED', type: 'BAM', rank: 1, label: '1 Bam' },
            { id: 6, assetName: 'b1', category: 'SUITED', type: 'BAM', rank: 1, label: '1 Bam' }
          ]
        },
        {
          combinationName: 'Kong 5-Crack',
          tiles: [
            { id: 7, assetName: 'c5', category: 'SUITED', type: 'CHAR', rank: 5, label: '5 Crack' },
            { id: 8, assetName: 'c5', category: 'SUITED', type: 'CHAR', rank: 5, label: '5 Crack' },
            { id: 9, assetName: 'c5', category: 'SUITED', type: 'CHAR', rank: 5, label: '5 Crack' },
            { id: 10, assetName: 'c5', category: 'SUITED', type: 'CHAR', rank: 5, label: '5 Crack' }
          ]
        },
        {
          combinationName: 'Pair Jokers',
          tiles: [
            { id: 11, assetName: 'jk', category: 'JOKER', type: 'JOKER', rank: 0, label: 'Joker' },
            { id: 12, assetName: 'jk', category: 'JOKER', type: 'JOKER', rank: 0, label: 'Joker' }
          ]
        }
      );
    }
    /* NEWCODE */

    return {
      winnerSeat: winnerPos,
      winnerName,
      isSelfPick: true,
      baseScore,
      bonus,
      totalPoints,
      winningHandGroups
    };
  }

  private mapRawTileToWinningTile(rawTile: any, tileId: number): WinningTileData {
    const assetName = this.gameService.assetBaseName(rawTile);
    const category = String(rawTile.category || '');
    const type = String(rawTile.type || '');
    const rank = rawTile.rank;

    let label = '';
    if ((category as any) === TileCategoryEnumAddon.JOKER || category === 'JOKER' || type.includes('JOKER')) {
      label = 'Joker';
    } else if ((category as any) === TileCategoryEnumAddon.FLOWER || category === 'FLOWER' || type.includes('FLOWER')) {
      label = `Flower ${rank || ''}`.trim();
    } else if ((category as any) === TileCategoryEnumAddon.WIND || category === 'WIND' || type.includes('WIND')) {
      const windMap: Record<string, string> = { WIND_EAST: 'East', WIND_SOUTH: 'South', WIND_WEST: 'West', WIND_NORTH: 'North' };
      label = windMap[type] || 'Wind';
    } else if ((category as any) === TileCategoryEnumAddon.DRAGON || category === 'DRAGON' || type.includes('DRAGON')) {
      const dragonMap: Record<string, string> = { DRAGON_RED: 'Red Dragon', DRAGON_GREEN: 'Green Dragon', DRAGON_WHITE: 'White Dragon' };
      label = dragonMap[type] || 'Dragon';
    } else {
      const suitName = type === 'BAM' ? 'Bam' : type === 'CHAR' ? 'Crack' : type === 'DOT' ? 'Dot' : type;
      label = `${rank || ''} ${suitName}`.trim();
    }

    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label
    };
  }

  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    let currentGroup: WinningTileData[] = [];

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (currentGroup.length === 0) {
        currentGroup.push(t);
      } else {
        const prev = currentGroup[currentGroup.length - 1];
        const matches = (prev.category === t.category && prev.type === t.type && prev.rank === t.rank);
        if (matches && currentGroup.length < 4) {
          currentGroup.push(t);
        } else {
          const tag = this.describeMeldGroup(currentGroup);
          melds.push({ combinationName: tag, tiles: currentGroup });
          currentGroup = [t];
        }
      }
    }

    if (currentGroup.length > 0) {
      const tag = this.describeMeldGroup(currentGroup);
      melds.push({ combinationName: tag, tiles: currentGroup });
    }

    return melds;
  }

  private describeMeldGroup(group: WinningTileData[]): string {
    if (group.length === 0) return '';
    const first = group[0];
    const count = group.length;

    if ((first.category as any) === TileCategoryEnumAddon.JOKER || first.category === 'JOKER' || first.type.includes('JOKER')) {
      return `${count} ${count === 1 ? 'Joker' : 'Jokers'}`;
    }
    if ((first.category as any) === TileCategoryEnumAddon.FLOWER || first.category === 'FLOWER' || first.type.includes('FLOWER')) {
      return `${count} ${count === 1 ? 'Flower' : 'Flowers'}`;
    }
    
    if (count === 3) return `Pung ${first.label}`;
    if (count === 4) return `Kong ${first.label}`;
    if (count === 5) return `Quint ${first.label}`;
    if (count === 2) return `Pair ${first.label}`;

    return `${count} ${first.label}s`;
  }

  public getTileCornerRank(tile: WinningTileData): string {
    if ((tile.category as any) === TileCategoryEnumAddon.JOKER || tile.category === 'JOKER' || tile.type.includes('JOKER')) return 'J';
    if ((tile.category as any) === TileCategoryEnumAddon.FLOWER || tile.category === 'FLOWER' || tile.type.includes('FLOWER')) return 'F';
    if (tile.type === 'WIND_EAST') return 'E';
    if (tile.type === 'WIND_SOUTH') return 'S';
    if (tile.type === 'WIND_WEST') return 'W';
    if (tile.type === 'WIND_NORTH') return 'N';
    if (tile.type === 'DRAGON_RED') return 'R';
    if (tile.type === 'DRAGON_GREEN') return 'G';
    if (tile.type === 'DRAGON_WHITE') return 'D';
    return tile.rank ? String(tile.rank) : '';
  }

  public getTileSymbol(tile: WinningTileData): string {
    if ((tile.category as any) === TileCategoryEnumAddon.JOKER || tile.category === 'JOKER' || tile.type.includes('JOKER')) return '🪭';
    if ((tile.category as any) === TileCategoryEnumAddon.FLOWER || tile.category === 'FLOWER' || tile.type.includes('FLOWER')) return '🌸';
    
    if (tile.type === 'WIND_EAST') return '東';
    if (tile.type === 'WIND_SOUTH') return '南';
    if (tile.type === 'WIND_WEST') return '西';
    if (tile.type === 'WIND_NORTH') return '北';

    if (tile.type === 'DRAGON_RED') return '中';
    if (tile.type === 'DRAGON_GREEN') return '發';
    if (tile.type === 'DRAGON_WHITE') return '⬜';

    if (tile.type === 'CHAR') {
      const charRanks: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };
      return charRanks[tile.rank || 1] || String(tile.rank);
    }

    if (tile.type === 'BAM') {
      if (tile.rank === 1) return '🦚';
      return '🎋';
    }

    if (tile.type === 'DOT') return '🪙';

    return String(tile.rank || '');
  }

  public getTileSubSymbol(tile: WinningTileData): string {
    if (tile.type === 'CHAR') return '萬';
    if ((tile.category as any) === TileCategoryEnumAddon.JOKER || tile.category === 'JOKER' || tile.type.includes('JOKER')) return 'JKR';
    return '';
  }
  /* NEWCODE */

  public onDismissMahjongWinPopup(): void {
    this.setMahjongWinPopup(null);
    this.mahjongGameOver.set(true);
  }

  /* NEWCODE */
  public testMahjongWin(winnerSeat: TableSeat = "bottom"): void {
    const allTilesMap = this.gameState.game_all_tiles();
    const tileIds = Object.keys(allTilesMap || {}).map(Number);
    
    let topIds: number[] = [];
    let leftIds: number[] = [];
    let rightIds: number[] = [];

    if (tileIds.length >= 42) {
      topIds = tileIds.slice(0, 14);
      leftIds = tileIds.slice(14, 28);
      rightIds = tileIds.slice(28, 42);
    } else {
      topIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      leftIds = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
      rightIds = [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42];
    }

    const mockWinResult: MahjongWinCelebration = {
      winner: winnerSeat,
      requestId: Date.now(),
      opponentHands: {
        top: topIds,
        left: leftIds,
        right: rightIds
      }
    };
    this.setMahjongWinPopup(mockWinResult);
  }
  /* NEWCODE */

  public onExitGame(): void {
    void this.router.navigate(["/"]);
  }

  public onStartNewGame(): void {
    window.location.href = "/game";
  }

  private clearMahjongWinPopupTimer(): void {
    if (this.mahjongWinPopupTimer !== undefined) {
      window.clearTimeout(this.mahjongWinPopupTimer);
      this.mahjongWinPopupTimer = undefined;
    }
  }

  /** Aligns the DOM logo to the exact Phaser hamburger HUD centre. */
  private setHeaderLogoLayout(state: HeaderLogoLayoutState): void {
    const logo = this.headerLogoRef.nativeElement;
    logo.style.top = `${Math.round(state.top)}px`;
    logo.style.height = `${Math.round(state.height)}px`;
  }

  public onHeaderLogoClick(): void {
    void this.router.navigate(["/"]);
  }

  private readCssPx(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
}
