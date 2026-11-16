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
/* OLDCODE
import { GameDeadHandReasonEnum, GamePhaseFirstRoundDirectionEnum, GameTileEntity, GameTileEntityGSDto, TileCategoryEnum, GamePlayActionEnum, TileCategoryEnumAddon, GamePhaseEnum, GameRackIDEnumAddon, GamePlayActionEnumAddon, GameTurnStageEnum, GameTileOrderEnumAddon } from "@bfw/api-sdk/graphql/endpoints/business";
OLDCODE */
/* OLDCODE
import { GameDeadHandReasonEnum, GamePhaseFirstRoundDirectionEnum, GameTileEntity, GameTileEntityGSDto, TileCategoryEnum, GamePlayActionEnum, TileCategoryEnumAddon, GamePhaseEnum, GameRackIDEnumAddon, GamePlayActionEnumAddon, GameTurnStageEnum, GameTileOrderEnumAddon, GameCharlestoneStageEnum } from "@bfw/api-sdk/graphql/endpoints/business";
OLDCODE */
/* OLDCODE
import { BotLevelModeEnum, GameDeadHandReasonEnum, GamePhaseFirstRoundDirectionEnum, GameTileEntity, GameTileEntityGSDto, TileCategoryEnum, GamePlayActionEnum, TileCategoryEnumAddon, GamePhaseEnum, GameRackIDEnumAddon, GamePlayActionEnumAddon, GameTurnStageEnum, GameTileOrderEnumAddon, GameCharlestoneStageEnum } from "@bfw/api-sdk/graphql/endpoints/business";
OLDCODE */
/* NEWCODE */
import { BotLevelModeEnum, GameDeadHandReasonEnum, GamePhaseFirstRoundDirectionEnum, GameTileEntity, GameTileEntityGSDto, TileCategoryEnum, GamePlayActionEnum, TileCategoryEnumAddon, TileTypeEnumAddon, GamePhaseEnum, GameRackIDEnumAddon, GamePlayActionEnumAddon, GameTurnStageEnum, GameTileOrderEnumAddon, GameCharlestoneStageEnum } from "@bfw/api-sdk/graphql/endpoints/business";
/* NEWCODE */
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
import { environment } from "../../../../../../env/env";
/* NEWCODE */

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
  /* NEWCODE */
  imageUrl?: string;
  /* NEWCODE */
}

export interface WinningMeldGroup {
  combinationName?: string;
  tiles: WinningTileData[];
  /* NEWCODE */
  exposed?: boolean;
  /* NEWCODE */
}

export interface WinningOverlayData {
  winnerSeat: TableSeat;
  winnerName: string;
  isSelfPick: boolean;
  baseScore: number;
  bonus: number;
  totalPoints: number;
  winningHandGroups: WinningMeldGroup[];
  /* NEWCODE */
  ruleLabel?: string;
  /* NEWCODE */
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
  /* NEWCODE */
  readonly mahjongButtonProcessing = signal<boolean>(false);
  readonly mahjongButtonShaking = signal<boolean>(false);
  private mahjongCheckTimer?: number;
  private mahjongShakeTimer?: number;
  /* NEWCODE */
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
  // Discard area bounds for anchoring the result popup
  readonly discardAreaRect = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  // Toggle visibility of the result popup via the Eye icon
  readonly isResultPopupHidden = signal<boolean>(false);
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
  /* OLDCODE
  private lastProcessedExchange: any = null;
  OLDCODE */
  /* NEWCODE */
  private lastProcessedExchange: any = null;
  private lastSeenJokerSeq: number = -1;
  /* NEWCODE */

  constructor() {
    /* OLDCODE
    (window as any).testMahjongWin = (winnerSeat?: any) => this.testMahjongWin(winnerSeat);
    OLDCODE */
    /* NEWCODE */
    (window as any).testMahjongWin = (winnerSeat?: any) => this.testMahjongWin(winnerSeat);
    (window as any).testWallGame = () => this.testWallGame();
    (window as any).closeWallGame = () => this.closeWallGame();
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

    /* OLDCODE
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
    OLDCODE */
    /* NEWCODE */
    // Process authoritative joker exchanges via play.joker_exchanges and seq pointer
    effect(() => {
      if (!this.phaser || !this.sceneReady()) return;

      const playData = this.gameState.play();
      if (!playData) return;

      const currentSeq = playData.joker_exchange_seq ?? 0;

      // Initial load or reconnect: initialize pointer without triggering animations
      if (this.lastSeenJokerSeq === -1) {
        this.lastSeenJokerSeq = currentSeq;
        return;
      }

      const exchanges: any[] = playData.joker_exchanges || [];

      // If authoritative exchanges array is present
      if (Array.isArray(exchanges) && exchanges.length > 0) {
        const newEntries = exchanges
          .filter((e) => e && typeof e.seq === 'number' && e.seq > this.lastSeenJokerSeq)
          .sort((a, b) => a.seq - b.seq);

        for (const entry of newEntries) {
          const fromSeat = this.gameState.seat_position_by_gseat_id()(entry.from_gseat_id);
          const toSeat = this.gameState.seat_position_by_gseat_id()(entry.to_gseat_id);

          const payload = {
            ...entry,
            from_seat: fromSeat,
            to_seat: toSeat
          };

          this.phaser.events.emit("joker:exchange", payload);

          const seatName = fromSeat === 'bottom' ? 'You' : (fromSeat ? this.getPlayerName(fromSeat) : 'Player');
          this.notify.info(`${seatName} swapped a Joker`);

          this.lastSeenJokerSeq = entry.seq;
        }
      } else {
        // Fallback for legacy state without joker_exchanges
        const exchange = this.gameState.play_last_joker_exchange();
        if (exchange && JSON.stringify(this.lastProcessedExchange) !== JSON.stringify(exchange)) {
          this.lastProcessedExchange = exchange;
          const fromSeat = this.gameState.seat_position_by_gseat_id()(exchange.from_gseat_id);
          const toSeat = this.gameState.seat_position_by_gseat_id()(exchange.to_gseat_id);
          const payload = {
            ...exchange,
            from_seat: fromSeat,
            to_seat: toSeat
          };
          this.phaser.events.emit("joker:exchange", payload);

          const seatName = fromSeat === 'bottom' ? 'You' : (fromSeat ? this.getPlayerName(fromSeat) : 'Player');
          this.notify.info(`${seatName} swapped a Joker`);
        }
      }
    });
    /* NEWCODE */

    effect(() => {
      const err = this.gameState.play_action_error();
      if (!this.phaser || !this.sceneReady() || !err) return;
      /* NEWCODE */
      // Reset any pending discard if an action error occurred on the backend
      this.pendingDiscardTileId = null;
      /* NEWCODE */
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

    /* NEWCODE */
    effect(() => {
      const botLevel = this.gameState.game_botlvl_id();
      if (!this.phaser || !this.sceneReady() || !botLevel) return;
      this.phaser.events.emit("table:bot-level", botLevel);
    });
    /* NEWCODE */

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

    /* NEWCODE */
    effect(() => {
      const stage = this.gameState.play_pass_stage();
      if (stage !== GameCharlestoneStageEnum.SECOND_DECISION) {
        this.hasVotedSecondDecision = false;
        this.confirmStopCharleston.set(false);
      }
    });
    /* NEWCODE */

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

    /* NEWCODE */
    // Send bot hand tiles to Phaser when in debug mode
    effect(() => {
      if (!environment.DEBUG) return;
      const hands = this.gameState.all_seat_rack_hands();
      if (this.phaser && this.sceneReady()) {
        this.phaser.events.emit("debug:opponent-hands", hands);
      }
    });
    /* NEWCODE */

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

      /* OLDCODE
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
      OLDCODE */
      /* NEWCODE */
      let winnerId = (reason === 'MAHJONG' && winnerSeatIds && winnerSeatIds.length > 0) ? winnerSeatIds[0] : null;

      // 1. Check if the local player (bottom seat) won Mahjong
      if (!winnerId && reason === 'MAHJONG') {
        const isPersonalMahjong = this.gameState.personal_seat_rack_first_is_mahjong();
        const isMyTurn = this.gameState.play_current_turn_seat_id() === this.gameState.personal_seat_id();
        if (isPersonalMahjong || isMyTurn) {
          winnerId = this.gameState.personal_seat_id() ?? null;
        }
      }

      // 2. Check if an opponent bot won Mahjong in play_seats()
      if (!winnerId) {
        const seats = this.gameState.play_seats();
        if (seats) {
          for (const seatId of Object.keys(seats)) {
            const seatData = (seats as any)[seatId];
            if (seatData && seatData.racks) {
              for (const rackKey of Object.keys(seatData.racks)) {
                const rack = seatData.racks[rackKey];
                if (rack && rack.is_mahjong) {
                  winnerId = Number(seatId);
                  break;
                }
              }
            }
            if (winnerId) break;
          }
        }
      }
      /* NEWCODE */

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
            /* OLDCODE
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
            OLDCODE */
            /* NEWCODE */
            /* OLDCODE
            const opponentHands: Record<string, number[]> = {};
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const [seatId, seatData] of Object.entries(seats)) {
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));
                if (seatPos && seatPos !== 'bottom' && seatData?.racks) {
                  const tiles: number[] = [];
                  for (const rack of Object.values(seatData.racks)) {
                    // Extract tiles using rack.hand as sent by GraphQL WebSocket
                    if ((rack as any)?.hand && typeof (rack as any).hand === 'object') {
                      const handTiles = Object.values((rack as any).hand)
                        .map((t: any) => t?.tile_id ?? (t as any)?.id)
                        .filter((id): id is number => id != null);
                      tiles.push(...handTiles);
                    }
                  }
                  opponentHands[seatPos] = tiles;
                }
              }
            }
            OLDCODE */
            /* NEWCODE */
            const opponentHands: Record<string, number[]> = {};

            // 1. Primary source: read each opponent's hand from all_seat_rack_hands()
            const allHands = this.gameState.all_seat_rack_hands();
            const opponentSeatList: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];

            /* OLDCODE
            for (const seat of opponentSeatList) {
              const seatHand = allHands[seat];
              const tileIdList: number[] = [];

              if (seatHand && Array.isArray(seatHand)) {
                for (const tileItem of seatHand) {
                  const id = tileItem?.tile_id ?? tileItem?.id;
                  if (typeof id === 'number') {
                    tileIdList.push(id);
                  }
                }
              }

              if (tileIdList.length > 0) {
                opponentHands[seat] = tileIdList;
              }
            }

            // 2. Fallback: if any opponent seat is still empty, check play_seats()
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const seatId of Object.keys(seats)) {
                const seatData = (seats as any)[seatId];
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));

                if (seatPos && seatPos !== 'bottom') {
            OLDCODE */
            /* NEWCODE */
            for (const seat of opponentSeatList) {
              // The winner hand is already shown in the Mahjong popup - do not add winner to exposure
              if (seat === tableSeat) continue;

              const seatHand = allHands[seat];
              const tileIdList: number[] = [];

              if (seatHand && Array.isArray(seatHand)) {
                for (const tileItem of seatHand) {
                  const id = tileItem?.tile_id ?? tileItem?.id;
                  if (typeof id === 'number') {
                    tileIdList.push(id);
                  }
                }
              }

              if (tileIdList.length > 0) {
                opponentHands[seat] = tileIdList;
              }
            }

            // 2. Fallback: if any opponent seat is still empty, check play_seats()
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const seatId of Object.keys(seats)) {
                const seatData = (seats as any)[seatId];
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));

                // Skip bottom player and skip the winner seat
                if (seatPos && seatPos !== 'bottom' && seatPos !== tableSeat) {
                  /* NEWCODE */
                  const alreadyHasTiles = opponentHands[seatPos] && opponentHands[seatPos].length > 0;
                  if (!alreadyHasTiles && seatData && seatData.racks) {
                    const fallbackTileIds: number[] = [];

                    for (const rackKey of Object.keys(seatData.racks)) {
                      const rack = seatData.racks[rackKey];
                      if (rack && rack.hand && typeof rack.hand === 'object') {
                        for (const handKey of Object.keys(rack.hand)) {
                          const tileObj = rack.hand[handKey];
                          const id = tileObj?.tile_id ?? tileObj?.id;
                          if (typeof id === 'number') {
                            fallbackTileIds.push(id);
                          }
                        }
                      }
                    }

                    if (fallbackTileIds.length > 0) {
                      opponentHands[seatPos] = fallbackTileIds;
                    }
                  }
                }
              }
            }
            /* NEWCODE */
            /* NEWCODE */

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
          /* OLDCODE
          // Reveal all seats' hands to exposures on wall game
          const seats = this.gameState.play_seats();
          this.phaser?.events.emit("table:wall-game", seats);
          OLDCODE */
          /* NEWCODE */
          // Map play.seats key-by-value directly to table positions (top, left, right)
          const seats = this.gameState.play_seats();
          const getSeatPos = this.gameState.seat_position_by_gseat_id();
          const opponentHands: Record<string, number[]> = {};

          if (seats && typeof seats === 'object') {
            for (const seat of Object.values(seats) as any[]) {
              const seatPos = getSeatPos(seat?.id);
              // Only reveal opponent seats (bottom is already visible on the player's rack)
              if (seatPos && seatPos !== 'bottom') {
                const rack = seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST] || seat?.racks?.["1"];
                const tileIds: number[] = rack?.hand_order && Array.isArray(rack.hand_order)
                  ? rack.hand_order
                  : rack?.hand && typeof rack.hand === 'object'
                    ? Object.keys(rack.hand).map(Number)
                    : [];
                if (tileIds.length > 0) {
                  opponentHands[seatPos] = tileIds;
                }
              }
            }
          }
          /* OLDCODE
          this.phaser?.events.emit("table:wall-game", opponentHands);
          OLDCODE */
          /* NEWCODE */
          this.phaser?.events.emit("ui:wall-game-sound");
          this.phaser?.events.emit("table:wall-game", opponentHands);
          /* NEWCODE */
          /* NEWCODE */
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
          /* OLDCODE
                    getUsername: () => this.gameState.ctxp.state.user_fullname || this.gameState.ctxp.state.user_username || "PLAYER",
          OLDCODE */
          /* NEWCODE */
          getUsername: () => this.gameState.ctxp.state.user_fullname || this.gameState.ctxp.state.user_username || "PLAYER",
          getPlayerName: (seat: TableSeat) => this.getPlayerName(seat),
          /* NEWCODE */
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
          /* OLDCODE
                    onMahjongDeclare: () => {
                      this.gameState.publishMahjongDeclare();
                    },
          OLDCODE */
          /* NEWCODE */
          onMahjongDeclare: () => {
            this.gameState.publishMahjongDeclare().catch((err) => {
              console.warn("publishMahjongDeclare failed:", err);
              this.handleMahjongFailure();
            });
          },
          /* NEWCODE */
          onWallCountOverlay: (state) => this.setWallCountOverlay(state),
          onPlayerLabelOverlay: (states) => this.setPlayerLabelOverlays(states),
          onPointsOverlay: (state) => this.setPointsOverlay(state),
          onMobileDrawerVisibilityChanged: (open) => this.setMobileDrawerOpen(open),
          onMobileDrawerOverlay: (state) => this.setMobileDrawerOverlay(state),
          onMobileHeaderToggleOverlay: (state) => this.setMobileHeaderToggleOverlay(state),
          onInstructionPanelOverlay: (state) => this.setInstructionPanelOverlay(state),
          /* NEWCODE */
          onDiscardAreaOverlay: (rect) => this.discardAreaRect.set(rect),
          /* NEWCODE */
          onMahjongButtonOverlay: (state) => this.mahjongButtonOverlay.set(state),
          onClaimPanelOverlay: (state) => this.setClaimPanelOverlay(state),
          onTableOverlayBlocked: (level) => this.setTableOverlayBlocked(level),
          onDeadHandSeatSelection: (state) => this.setDeadHandSeatSelection(state),
          onHeaderLogoLayout: (state) => this.setHeaderLogoLayout(state),
          onTileCallDecision: (decision) =>
            this.zone.run(() => this.tileCallDecision.emit(decision)),
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
        /* OLDCODE
                const rack = this.getSortedRack();
                this.phaser?.events.emit("allTiles:set", this.gameState.game_all_tiles());
                this.phaser?.events.emit("rack:set", rack);
                this.phaser?.events.emit("tile-call:offer", this.tileCallOffer());
        OLDCODE */
        /* NEWCODE */
        const rack = this.getSortedRack();
        this.phaser?.events.emit("allTiles:set", this.gameState.game_all_tiles());
        this.phaser?.events.emit("rack:set", rack);
        this.phaser?.events.emit("tile-call:offer", this.tileCallOffer());
        this.phaser?.events.emit("wall:set-pick-mode", this.gameState.canPickTile());
        this.phaser?.events.emit("rack:set-discard-mode", this.gameState.canDiscard());
        /* NEWCODE */
        const initialBotLevel = this.gameState.game_botlvl_id();
        if (initialBotLevel) {
          this.phaser?.events.emit("table:bot-level", initialBotLevel);
        }
        /* NEWCODE */
        /* NEWCODE */
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
      /* NEWCODE */
      this.clearMahjongCheckTimer();
      this.clearMahjongShakeTimer();
      /* NEWCODE */

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

  /* OLDCODE
    public getDeadHandTargetLabel(targetSeat: Exclude<TableSeat, "bottom">): string {
      const labels: Record<Exclude<TableSeat, "bottom">, string> = {
        top: "PLAYER 1 (TOP)", right: "PLAYER 2 (RIGHT)", left: "PLAYER 3 (LEFT)",
      };
      return labels[targetSeat];
    }
  OLDCODE */
  /* NEWCODE */
  public getPlayerName(seat: TableSeat): string {
    if (seat === "bottom") {
      return this.gameState.ctxp.state.user_fullname || this.gameState.ctxp.state.user_username || "You";
    }

    const defaultNames: Record<Exclude<TableSeat, "bottom">, string> = {
      right: "Player 1",
      top: "Player 2",
      left: "Player 3",
    };

    const seatsObj = this.gameState.play_seats();
    if (seatsObj) {
      for (const [id, s] of Object.entries(seatsObj)) {
        if (this.gameState.seat_position_by_gseat_id()(Number(id)) === seat) {
          // If real user (u_id is present and valid number > 0)
          if (s?.u_id) {
            const userObj = s?.user || s?.fr_user;
            const fullName = s?.user_fullname || (userObj?.fname ? `${userObj.fname} ${userObj.lname ?? ""}`.trim() : null) || s?.fullname;
            const candidate = fullName || s?.user_username || s?.username || s?.fname || s?.name || userObj?.username;
            if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
              return candidate.trim();
            }
          }
          // If bot profile has a specific name
          const profile = this.gameState.game_bot_profile() as any;
          if (profile && profile[Number(id)]?.name) {
            return profile[Number(id)].name;
          }
          break;
        }
      }
    }

    return defaultNames[seat];
  }

  public getDeadHandTargetLabel(targetSeat: Exclude<TableSeat, "bottom">): string {
    const name = this.getPlayerName(targetSeat).toUpperCase();
    const seatSuffix = targetSeat === "top" ? "TOP" : targetSeat === "right" ? "RIGHT" : "LEFT";
    return `${name} (${seatSuffix})`;
  }
  /* NEWCODE */

  /* OLDCODE
  private rawInstructionPanelState?: InstructionPanelOverlayState;
  public confirmStopCharleston = signal(false);

  private setInstructionPanelOverlay(state: InstructionPanelOverlayState): void {
    this.rawInstructionPanelState = state;
    this.renderInstructionPanelOverlay();
  }
  OLDCODE */
  /* NEWCODE */
  private rawInstructionPanelState?: InstructionPanelOverlayState;
  public confirmStopCharleston = signal(false);
  private hasVotedSecondDecision = false;

  private setInstructionPanelOverlay(state: InstructionPanelOverlayState): void {
    const isSecondDecision = this.gameState.play_pass_stage() === GameCharlestoneStageEnum.SECOND_DECISION;
    // Suppress re-triggering while in SECOND_DECISION if already voted
    if (isSecondDecision && this.hasVotedSecondDecision) {
      this.instructionPanelOverlay.set(undefined);
      this.phaser?.events.emit("instruction-panel:sync", { visible: false });
      return;
    }
    this.rawInstructionPanelState = state;
    this.renderInstructionPanelOverlay();
  }
  /* NEWCODE */

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

  /* OLDCODE
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
  OLDCODE */
  /* NEWCODE */
  /* OLDCODE
  public onInstructionPanelClick(action?: string): void {
    const state = this.instructionPanelOverlay();
    if (!state) return;

    const isSecondDecision = this.gameState.play_pass_stage() === GameCharlestoneStageEnum.SECOND_DECISION;

    if (isSecondDecision && action === "pass") {
      this.confirmStopCharleston.set(false);
      this.rawInstructionPanelState = undefined;
      this.instructionPanelOverlay.set(undefined);
      this.gameState.publishCharlestoneSecondRoundVote(true);
    } else if (action === "stop") {
      this.confirmStopCharleston.set(true);
      this.renderInstructionPanelOverlay();
    } else if (action === "stop-confirm") {
      this.confirmStopCharleston.set(false);
      this.rawInstructionPanelState = undefined;
      this.instructionPanelOverlay.set(undefined);
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
  OLDCODE */
  /* NEWCODE */
  public onInstructionPanelClick(action?: string): void {
    const state = this.instructionPanelOverlay();
    if (!state) return;

    const isSecondDecision = this.gameState.play_pass_stage() === GameCharlestoneStageEnum.SECOND_DECISION;

    if (isSecondDecision && action === "pass") {
      // Chose NO: hide immediately and send vote
      this.hasVotedSecondDecision = true;
      this.confirmStopCharleston.set(false);
      this.rawInstructionPanelState = undefined;
      this.instructionPanelOverlay.set(undefined);
      this.phaser?.events.emit("instruction-panel:sync", { visible: false });
      this.gameState.publishCharlestoneSecondRoundVote(true);
    } else if (action === "stop") {
      // Chose YES: switch to confirmation popup ("Are you sure?")
      this.confirmStopCharleston.set(true);
      this.renderInstructionPanelOverlay();
    } else if (action === "stop-confirm") {
      // Confirmed YES: hide completely and send vote (will NOT re-open 1st popup)
      this.hasVotedSecondDecision = true;
      this.confirmStopCharleston.set(false);
      this.rawInstructionPanelState = undefined;
      this.instructionPanelOverlay.set(undefined);
      this.phaser?.events.emit("instruction-panel:sync", { visible: false });
      this.phaser?.events.emit("play-stop-charleston");
      this.gameState.publishCharlestoneSecondRoundVote(false);
    } else if (action === "stop-cancel") {
      // Cancelled on "Are you sure?": revert back to first popup
      this.confirmStopCharleston.set(false);
      this.renderInstructionPanelOverlay();
    } else {
      if (!state.button.enabled) return;
      this.phaser?.events.emit("instruction-panel:primary-action");
    }
  }
  /* NEWCODE */
  /* NEWCODE */

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

  /* OLDCODE
  // public onSubmitDeadHandClaim(targetSeat: Exclude<TableSeat, "bottom">, reason: DeadHandReason): void {
  //   this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
  //   this.setDeadHandPopup(null);
  // }
  // public onSubmitDeadHandClaim(targetSeat: Exclude<TableSeat, "bottom">, reason: DeadHandReason): void {
  //   this.phaser?.events.emit("ui:dead-hand-claimed");
  //   this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason }));
  //   this.setDeadHandPopup(null);
  // }
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

  public onCancelDeadHandClaim(): void {
    this.setDeadHandPopup(null);
  }

  /* OLDCODE
    public onMahjongButtonClick(): void {
      console.log("Mahjong button clicked!");
      this.phaser?.events.emit("instruction-panel:mahjong");
    }
  OLDCODE */
  /* NEWCODE */
  public onMahjongButtonClick(): void {
    console.log("Mahjong button clicked!");
    if (this.mahjongButtonProcessing()) return;

    this.mahjongButtonProcessing.set(true);
    this.mahjongButtonShaking.set(false);
    this.clearMahjongCheckTimer();

    this.phaser?.events.emit("instruction-panel:mahjong");

    // Give backend time to evaluate and declare mahjong if valid.
    // If no mahjong win is confirmed within timeout, trigger shake and error sound.
    this.mahjongCheckTimer = window.setTimeout(() => {
      const isFinished = this.gameState.play_phase() === GamePhaseEnum.FINISHED;
      const isMahjong = this.gameState.play_finished_reason() === "MAHJONG"
        || Boolean(this.mahjongWinResult())
        || this.gameState.personal_seat_rack_first_is_mahjong();
      if (!isFinished && !isMahjong) {
        this.handleMahjongFailure();
      } else {
        this.mahjongButtonProcessing.set(false);
      }
    }, 1200);
  }
  /* NEWCODE */

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

    /* OLDCODE
        const discardedBy = this.gameState.seat_position_by_gseat_id()(Number(fromSeatId));
        if (!discardedBy || !this.phaser || !this.sceneReady()) return false;
        const payload: ResolvedClaimPresentation = { key: claimKey, tile: tile!, discardedBy };
        this.phaser.events.emit("claim:resolved", payload);
        return true;
    OLDCODE */
    /* NEWCODE */
    const discardedBy = this.gameState.seat_position_by_gseat_id()(Number(fromSeatId));
    if (!discardedBy || !this.phaser || !this.sceneReady()) return false;
    let calledBy: TableSeat | undefined = undefined;
    for (const [seat, melds] of Object.entries(exposures)) {
      const match = (melds ?? []).some((meld: any) => {
        const meldTiles = meld?.tiles
          ? (Array.isArray(meld.tiles) ? meld.tiles : Object.values(meld.tiles))
          : (meld?.tile ? [meld.tile] : []);
        return meldTiles.some((meldTile: any) => Number(meldTile?.tile_id) === tileId);
      });
      if (match) {
        calledBy = seat as TableSeat;
        break;
      }
    }
    const payload: ResolvedClaimPresentation = { key: claimKey, tile: tile!, discardedBy, calledBy };
    this.phaser.events.emit("claim:resolved", payload);
    return true;
    /* NEWCODE */
  }

  /**
   * Fallback for bot updates that arrive with the completed exposure but no
   * usable `last_claim`. A new meld retains its discarded source (`from_seat`)
   * and claimed tile, which is sufficient for the same presentation flow.
   */
  private emitExposureClaimPresentationFallback(exposures: Record<TableSeat, any[]>, suppressPresentation: boolean): void {
    /* OLDCODE
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
    OLDCODE */
    /* NEWCODE */
    const candidates: Array<{ key: string; tile: GameTileEntityGSDto; fromSeatId: number; calledBy: TableSeat }> = [];

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
          candidates.push({ key, tile, fromSeatId, calledBy: seat as TableSeat });
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
        calledBy: candidate.calledBy,
      } satisfies ResolvedClaimPresentation);
    }
    /* NEWCODE */
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
      /* OLDCODE
      } else if (action === "skip") {
        void this.gameState.publishClaimAction(GamePlayActionEnumAddon.PASS, claimTile.tile_id as number);
      }
      OLDCODE */
      /* NEWCODE */
    } else if (action === "skip") {
      this.phaser?.events.emit("ui:skip-clicked");
      void this.gameState.publishClaimAction(GamePlayActionEnumAddon.PASS, claimTile.tile_id as number);
    }
    /* NEWCODE */ else if (action === "mahjong") {
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
    /* NEWCODE */
    if (result) {
      this.clearMahjongCheckTimer();
      this.mahjongButtonProcessing.set(false);
      this.mahjongButtonShaking.set(false);
    }
    /* NEWCODE */
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

    /* OLDCODE
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
    OLDCODE */
    /* NEWCODE */
    // 1. Resolve Winner Name (Matching the player label on the table, or real player username)
    let winnerName = '';
    const labelState = this.playerLabelStates()?.find(s => s.key === winnerPos);
    if (labelState && labelState.text && labelState.text.trim().length > 0) {
      winnerName = labelState.text.trim();
    } else {
      winnerName = this.getPlayerName(winnerPos);
    }
    /* NEWCODE */

    /* OLDCODE
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

    /* OLDCODE
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
    OLDCODE * /
    /* NEWCODE * /
    // Helper function to extract tile IDs from exposure meld using clean loops
    const extractTileIdsFromExp = (exp: any): number[] => {
      const resultIds: number[] = [];
      if (!exp) return resultIds;

      // Case 1: exp.tile_ids is an array of numbers
      if (Array.isArray(exp.tile_ids)) {
        for (const item of exp.tile_ids) {
          if (typeof item === 'number') {
            resultIds.push(item);
          }
        }
        return resultIds;
      }

      // Case 2: exp.tiles is an array of tile objects
      if (Array.isArray(exp.tiles)) {
        for (const item of exp.tiles) {
          if (typeof item === 'number') {
            resultIds.push(item);
          } else if (item && typeof item === 'object') {
            const id = item.tile_id ?? item.id;
            if (typeof id === 'number') {
              resultIds.push(id);
            }
          }
        }
        return resultIds;
      }

      // Case 3: exp.tiles is an object dictionary
      if (exp.tiles && typeof exp.tiles === 'object') {
        for (const key of Object.keys(exp.tiles)) {
          const item = exp.tiles[key];
          if (typeof item === 'number') {
            resultIds.push(item);
          } else if (item && typeof item === 'object') {
            const id = item.tile_id ?? item.id;
            if (typeof id === 'number') {
              resultIds.push(id);
            }
          }
        }
        return resultIds;
      }

      return resultIds;
    };

    for (const exp of exposures) {
      const tileIds = extractTileIdsFromExp(exp);
      const tilesData: WinningTileData[] = [];

      for (const tid of tileIds) {
        processedTileIds.add(tid);
        const rawTile = allTilesMap?.[tid];
        if (rawTile) {
          tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
        }
      }

      if (tilesData.length > 0) {
        const combName = exp.combination || this.describeMeldGroup(tilesData);
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
        if (!processedTileIds.has(id)) {
          handTileIds.push(id);
        }
      }
    } else if (rack?.tiles && Array.isArray(rack.tiles)) {
      for (const id of rack.tiles) {
        if (!processedTileIds.has(id)) {
          handTileIds.push(id);
        }
      }
    } else if (rack?.hand && typeof rack.hand === 'object') {
      for (const idStr of Object.keys(rack.hand)) {
        const handObj = rack.hand[idStr];
        const id = typeof handObj === 'number' ? handObj : handObj?.tile_id ?? handObj?.id ?? Number(idStr);
        if (typeof id === 'number' && !processedTileIds.has(id)) {
          handTileIds.push(id);
        }
      }
    }

    // Fallback: If handTileIds is still empty, check all_seat_rack_hands()
    if (handTileIds.length === 0) {
      const seatHand = this.gameState.all_seat_rack_hands()?.[winnerPos] || [];
      for (const t of seatHand) {
        const tid = t?.tile_id ?? t?.id;
        if (typeof tid === 'number' && !processedTileIds.has(tid)) {
          handTileIds.push(tid);
        }
      }
    }
    /* NEWCODE * /

    const concealedTiles: WinningTileData[] = [];
    for (const tid of handTileIds) {
      const rawTile = allTilesMap?.[tid];
      if (rawTile) {
        concealedTiles.push(this.mapRawTileToWinningTile(rawTile, tid));
      }
    }

    /* OLDCODE
    if (concealedTiles.length > 0) {
      const groupedConcealed = this.groupConcealedTiles(concealedTiles);
      winningHandGroups.push(...groupedConcealed);
    }
    OLDCODE * /
    /* NEWCODE * /
    if (concealedTiles.length > 0) {
      const groupedConcealed = this.groupConcealedTiles(concealedTiles);
      winningHandGroups.push(...groupedConcealed);
    }

    // Sort all winning hand groups as per canonical Mahjong card rule order:
    // Flowers (FFF) -> Ascending suited ranks (55, 77, 999) -> Winds (NEWS) -> Dragons (DDDD)
    winningHandGroups.sort((a, b) => {
      const orderA = this.getWinningGroupSortOrder(a);
      const orderB = this.getWinningGroupSortOrder(b);
      return orderA - orderB;
    });
    /* NEWCODE * /

    /* NEWCODE * /
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
    /* NEWCODE * /

    return {
      winnerSeat: winnerPos,
      winnerName,
      isSelfPick: true,
      baseScore,
      bonus,
      totalPoints,
      winningHandGroups
    };
    OLDCODE */
    /* NEWCODE */
    // 2. Locate the Winner's Authoritative Winning Hand Data from Backend (state.play.winning_hands)
    let winnerSeatId = 0;
    const seatsObj = this.gameState.play_seats();
    if (seatsObj) {
      for (const [id, s] of Object.entries(seatsObj)) {
        if (this.gameState.seat_position_by_gseat_id()(Number(id)) === winnerPos) {
          winnerSeatId = Number(id);
          break;
        }
      }
    }

    /* OLDCODE
    const isSiamese = this.gameState.game_mode() === 'TWO_PLAYERS_SIAMESE' || this.gameState.game_mode() === 'SIAMESE';
    OLDCODE */
    /* NEWCODE */
    const isSiamese = (this.gameState.game_mode() as any) === 'TWO_PLAYERS_SIAMESE' || (this.gameState.game_mode() as any) === 'SIAMESE';
    /* NEWCODE */
    const winningHands: any[] = this.gameState.play()?.winning_hands || (this.gameState as any).play_winning_hands?.() || [];
    const winningHand = winningHands.find(
      (entry: any) => Number(entry.seat_id) === winnerSeatId && (!isSiamese || entry.rack_id === 1)
    );

    // Score & Rule Description
    const baseScore = winningHand?.value_mult != null ? Number(winningHand.value_mult) : 25;
    const bonus = 25;
    const totalPoints = baseScore + bonus;
    const ruleLabel = winningHand?.label || undefined;

    // 3. Extract Tiles & Melds
    const winningHandGroups: WinningMeldGroup[] = [];
    const allTilesMap = this.gameState.game_all_tiles();

    // Check if Authoritative Server Layout is available (no guessing needed!)
    if (winningHand && Array.isArray(winningHand.groups) && winningHand.groups.length > 0) {
      // Sort groups by server index in exact card order
      const sortedGroups = [...winningHand.groups].sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));
      for (const grp of sortedGroups) {
        const tileIds: number[] = grp.tile_ids || [];
        const tilesData: WinningTileData[] = [];
        for (const tid of tileIds) {
          const rawTile = allTilesMap?.[tid];
          if (rawTile) {
            tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
          }
        }
        if (tilesData.length > 0) {
          winningHandGroups.push({
            combinationName: grp.title || `${tilesData.length} Tiles`,
            tiles: tilesData,
            exposed: grp.exposed === true
          });
        }
      }
    } else {
      // Fallback: Legacy recorded game or test helper without server winning_hands
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
      const exposures = rack?.exposures_meld || [];
      const processedTileIds = new Set<number>();

      const extractTileIdsFromExp = (exp: any): number[] => {
        const resultIds: number[] = [];
        if (!exp) return resultIds;

        if (Array.isArray(exp.tile_ids)) {
          for (const item of exp.tile_ids) {
            if (typeof item === 'number') resultIds.push(item);
          }
          return resultIds;
        }

        if (Array.isArray(exp.tiles)) {
          for (const item of exp.tiles) {
            if (typeof item === 'number') {
              resultIds.push(item);
            } else if (item && typeof item === 'object') {
              const id = item.tile_id ?? item.id;
              if (typeof id === 'number') resultIds.push(id);
            }
          }
          return resultIds;
        }

        if (exp.tiles && typeof exp.tiles === 'object') {
          for (const key of Object.keys(exp.tiles)) {
            const item = exp.tiles[key];
            if (typeof item === 'number') {
              resultIds.push(item);
            } else if (item && typeof item === 'object') {
              const id = item.tile_id ?? item.id;
              if (typeof id === 'number') resultIds.push(id);
            }
          }
          return resultIds;
        }

        return resultIds;
      };

      for (const exp of exposures) {
        const tileIds = extractTileIdsFromExp(exp);
        const tilesData: WinningTileData[] = [];

        for (const tid of tileIds) {
          processedTileIds.add(tid);
          const rawTile = allTilesMap?.[tid];
          if (rawTile) {
            tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
          }
        }

        if (tilesData.length > 0) {
          const combName = exp.combination || this.describeMeldGroup(tilesData);
          winningHandGroups.push({
            combinationName: combName,
            tiles: tilesData,
            exposed: true
          });
        }
      }

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
          const handObj = rack.hand[idStr];
          const id = typeof handObj === 'number' ? handObj : handObj?.tile_id ?? handObj?.id ?? Number(idStr);
          if (typeof id === 'number' && !processedTileIds.has(id)) {
            handTileIds.push(id);
          }
        }
      }

      if (handTileIds.length === 0) {
        const seatHand = this.gameState.all_seat_rack_hands()?.[winnerPos] || [];
        for (const t of seatHand) {
          const tid = t?.tile_id ?? t?.id;
          if (typeof tid === 'number' && !processedTileIds.has(tid)) {
            handTileIds.push(tid);
          }
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

      winningHandGroups.sort((a, b) => {
        const orderA = this.getWinningGroupSortOrder(a);
        const orderB = this.getWinningGroupSortOrder(b);
        return orderA - orderB;
      });

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
    }

    return {
      winnerSeat: winnerPos,
      winnerName,
      isSelfPick: true,
      baseScore,
      bonus,
      totalPoints,
      winningHandGroups,
      ruleLabel
    };
    /* NEWCODE */
  }

  private mapRawTileToWinningTile(rawTile: any, tileId: number): WinningTileData {
    const assetName = this.gameService.assetBaseName(rawTile);
    const category = String(rawTile.category || '');
    const type = String(rawTile.type || '');
    const rank = rawTile.rank;

    /* OLDCODE
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
    OLDCODE */
    /* NEWCODE */
    const isJoker = (category as any) === TileCategoryEnumAddon.JOKER || category === 'JOKER' || type.includes('JOKER') || (type as any) === TileTypeEnumAddon.JOKER || (type as any) === 15 || (type as any) === '15';
    const isFlower = (category as any) === TileCategoryEnumAddon.FLOWER || category === 'FLOWER' || type.includes('FLOWER') || ((type as any) >= 11 && (type as any) <= 14);
    const isWind = (category as any) === TileCategoryEnumAddon.WIND || category === 'WIND' || type.includes('WIND') || ((type as any) >= 4 && (type as any) <= 7);
    const isDragon = (category as any) === TileCategoryEnumAddon.DRAGON || category === 'DRAGON' || type.includes('DRAGON') || ((type as any) >= 8 && (type as any) <= 10);

    let label = '';
    if (isJoker) {
      label = 'Joker';
    } else if (isFlower) {
      const flowerRank = rank ? ` ${rank}` : '';
      label = `Flower${flowerRank}`;
    } else if (isWind) {
      if (type === 'WIND_EAST' || (type as any) === 4 || (type as any) === '4') label = 'East';
      else if (type === 'WIND_SOUTH' || (type as any) === 5 || (type as any) === '5') label = 'South';
      else if (type === 'WIND_WEST' || (type as any) === 6 || (type as any) === '6') label = 'West';
      else if (type === 'WIND_NORTH' || (type as any) === 7 || (type as any) === '7') label = 'North';
      else label = 'Wind';
    } else if (isDragon) {
      if (type === 'DRAGON_RED' || (type as any) === 8 || (type as any) === '8') label = 'Red Dragon';
      else if (type === 'DRAGON_GREEN' || (type as any) === 9 || (type as any) === '9') label = 'Green Dragon';
      else if (type === 'DRAGON_WHITE' || (type as any) === 10 || (type as any) === '10') label = 'White Dragon';
      else label = 'Dragon';
    } else {
      let suitName = 'Crack';
      if (type === 'BAM' || (type as any) === 1 || (type as any) === '1') {
        suitName = 'Bam';
      } else if (type === 'CHAR' || (type as any) === 2 || (type as any) === '2') {
        suitName = 'Crack';
      } else if (type === 'DOT' || (type as any) === 3 || (type as any) === '3') {
        suitName = 'Dot';
      }
      const rankText = rank ? `${rank} ` : '';
      label = `${rankText}${suitName}`;
    }
    /* NEWCODE */

    /* OLDCODE
    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label
    };
    OLDCODE */
    /* OLDCODE
    let imageUrl: string | undefined;
    const scene = this.phaser?.scene?.getScene("PhaserScene") as any;
    if (scene && typeof scene.getTileDataUrl === 'function') {
      imageUrl = scene.getTileDataUrl(rawTile);
    }

    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label,
      imageUrl
    };
    OLDCODE */
    /* NEWCODE */
    let imageUrl: string | undefined;
    // The Phaser scene is registered under the key "table-scene"
    const scene = (this.phaser?.scene?.getScene("table-scene") || this.phaser?.scene?.scenes?.[0]) as any;
    if (scene && typeof scene.getTileDataUrl === 'function') {
      const tileIdentifier = tileId ?? rawTile?.tile_id ?? rawTile?.id ?? rawTile;
      imageUrl = scene.getTileDataUrl(tileIdentifier);
    }

    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label,
      imageUrl
    };
    /* NEWCODE */
  }

  /* OLDCODE
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
  OLDCODE */
  /* OLDCODE
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    if (!tiles || tiles.length === 0) return melds;

    const crackTiles: WinningTileData[] = [];
    const bamTiles: WinningTileData[] = [];
    const dotTiles: WinningTileData[] = [];
    const honorTiles: WinningTileData[] = [];

    // Separate tiles into suits and honors
    for (const tile of tiles) {
      const label = tile.label || '';
      if (label.includes('Crack')) {
        crackTiles.push(tile);
      } else if (label.includes('Bam')) {
        bamTiles.push(tile);
      } else if (label.includes('Dot')) {
        dotTiles.push(tile);
      } else {
        honorTiles.push(tile);
      }
    }

    // Helper to build a suited meld group (e.g. 2488 Crack)
    const addSuitedGroup = (list: WinningTileData[], suitName: string) => {
      if (list.length === 0) return;
      list.sort((a, b) => (a.rank || 0) - (b.rank || 0));

      let ranksText = '';
      for (const t of list) {
        if (t.rank != null) {
          ranksText += String(t.rank);
        }
      }
      melds.push({
        combinationName: ranksText ? `${ranksText} ${suitName}` : suitName,
        tiles: list
      });
    };

    addSuitedGroup(crackTiles, 'Crack');
    addSuitedGroup(bamTiles, 'Bam');
    addSuitedGroup(dotTiles, 'Dot');

    // Add honor tiles (Green Dragon, White Dragon, etc.) as individual groups
    for (const honor of honorTiles) {
      melds.push({
        combinationName: honor.label,
        tiles: [honor]
      });
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
  OLDCODE */
  /* NEWCODE */
  /* OLDCODE
  // Group concealed tiles into proper rule combinations (Flowers, Pairs, Pungs, Kongs)
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    if (!tiles || tiles.length === 0) return melds;

    const flowerTiles: WinningTileData[] = [];
    const jokerTiles: WinningTileData[] = [];
    const naturalTiles: WinningTileData[] = [];

    // 1. Separate into flowers, jokers, and natural tiles
    for (const tile of tiles) {
      const label = tile.label || '';
      if (tile.category === 'FLOWER' || label.includes('Flower')) {
        flowerTiles.push(tile);
      } else if (label.includes('Joker')) {
        jokerTiles.push(tile);
      } else {
        naturalTiles.push(tile);
      }
    }

    // 2. All Flowers group together as FFF
    if (flowerTiles.length > 0) {
      const count = flowerTiles.length;
      const countLabel = count === 1 ? '1 Flower' : `${count} Flowers`;
      melds.push({
        combinationName: countLabel,
        tiles: flowerTiles
      });
    }

    // 3. Group identical natural tiles into combinations (Pairs, Pungs, Kongs)
    const naturalGroupsMap = new Map<string, WinningTileData[]>();
    for (const tile of naturalTiles) {
      const key = `${tile.type}_${tile.rank ?? ''}_${tile.label ?? ''}`;
      const existing = naturalGroupsMap.get(key);
      if (existing) {
        existing.push(tile);
      } else {
        naturalGroupsMap.set(key, [tile]);
      }
    }

    const groupedLists: WinningTileData[][] = [];
    for (const list of naturalGroupsMap.values()) {
      groupedLists.push(list);
    }

    // 4. Attach Jokers to incomplete melds (Pungs/Kongs that need Jokers)
    for (const list of groupedLists) {
      if (jokerTiles.length === 0) break;
      if (list.length === 2 && jokerTiles.length >= 1) {
        list.push(jokerTiles.pop()!);
      } else if (list.length === 3 && jokerTiles.length >= 1) {
        list.push(jokerTiles.pop()!);
      }
    }

    // 5. Add each natural combination with its descriptive name
    for (const list of groupedLists) {
      const combName = this.describeMeldGroup(list);
      melds.push({
        combinationName: combName,
        tiles: list
      });
    }

    // 6. Any remaining Jokers form their own group
    if (jokerTiles.length > 0) {
      const count = jokerTiles.length;
      melds.push({
        combinationName: count === 1 ? '1 Joker' : `${count} Jokers`,
        tiles: jokerTiles
      });
    }

    return melds;
  }

  private describeMeldGroup(group: WinningTileData[]): string {
    if (group.length === 0) return '';

    // Pick a natural tile as representative if Jokers are present
    let rep = group[0];
    for (const t of group) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const count = group.length;
    if (rep.category === 'FLOWER' || rep.label?.includes('Flower')) {
      return count === 1 ? '1 Flower' : `${count} Flowers`;
    }
    if (rep.label?.includes('Joker')) {
      return count === 1 ? '1 Joker' : `${count} Jokers`;
    }

    if (count === 2) return `Pair of ${rep.label}`;
    if (count === 3) return `Pung of ${rep.label}`;
    if (count === 4) return `Kong of ${rep.label}`;
    if (count === 5) return `Quint of ${rep.label}`;
    if (count === 6) return `Sextet of ${rep.label}`;

    return `${count} ${rep.label}`;
  }

  // Canonical Mahjong rule sort order: Flowers (100) -> Suited Numbers (200 + rank * 10) -> Winds (400) -> Dragons (500)
  private getWinningGroupSortOrder(group: WinningMeldGroup): number {
    if (!group.tiles || group.tiles.length === 0) return 999;

    let rep = group.tiles[0];
    for (const t of group.tiles) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const label = rep.label || '';
    const type = String(rep.type || '');
    const rank = rep.rank || 0;

    // 1. Flowers always first
    if (rep.category === 'FLOWER' || label.includes('Flower')) {
      return 100;
    }

    // 2. Numbered suited tiles (sorted by rank: 5s before 7s before 9s)
    if (rank >= 1 && rank <= 9) {
      let suitOffset = 0;
      if (label.includes('Crack') || type === 'CHAR') suitOffset = 0;
      else if (label.includes('Bam') || type === 'BAM') suitOffset = 1;
      else if (label.includes('Dot') || type === 'DOT') suitOffset = 2;
      return 200 + rank * 10 + suitOffset;
    }

    // 3. Winds (East, South, West, North)
    if (label.includes('East') || type === 'WIND_EAST') return 410;
    if (label.includes('South') || type === 'WIND_SOUTH') return 420;
    if (label.includes('West') || type === 'WIND_WEST') return 430;
    if (label.includes('North') || type === 'WIND_NORTH') return 440;

    // 4. Dragons (Red Dragon, Green Dragon, White Dragon)
    if (label.includes('Red Dragon') || type === 'DRAGON_RED') return 510;
    if (label.includes('Green Dragon') || type === 'DRAGON_GREEN') return 520;
    if (label.includes('White Dragon') || type === 'DRAGON_WHITE') return 530;

    // 5. Jokers
    if (label.includes('Joker')) return 600;

    return 700;
  }
  OLDCODE */
  /* NEWCODE */
  // Group winning hand tiles cleanly according to American Mahjongg card rules
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    if (!tiles || tiles.length === 0) return melds;

    // Separate tiles into buckets
    const flowerTiles: WinningTileData[] = [];
    const jokerTiles: WinningTileData[] = [];
    const naturalTiles: WinningTileData[] = [];

    for (const tile of tiles) {
      const label = tile.label || '';
      if (tile.category === 'FLOWER' || label.includes('Flower')) {
        flowerTiles.push(tile);
      } else if (label.includes('Joker') || tile.category === 'JOKER' || tile.type.includes('JOKER')) {
        jokerTiles.push(tile);
      } else {
        naturalTiles.push(tile);
      }
    }

    // 1. Group Flowers (FF, FFFF)
    if (flowerTiles.length > 0) {
      const count = flowerTiles.length;
      melds.push({
        combinationName: count === 1 ? '1 Flower' : `${count} Flowers`,
        tiles: flowerTiles
      });
    }

    // 2. Check for NEWS Winds combination (1 East, 1 South, 1 West, 1 North)
    const eastIdx = naturalTiles.findIndex(t => t.type === 'WIND_EAST' || t.label === 'East');
    const southIdx = naturalTiles.findIndex(t => t.type === 'WIND_SOUTH' || t.label === 'South');
    const westIdx = naturalTiles.findIndex(t => t.type === 'WIND_WEST' || t.label === 'West');
    const northIdx = naturalTiles.findIndex(t => t.type === 'WIND_NORTH' || t.label === 'North');

    if (eastIdx !== -1 && southIdx !== -1 && westIdx !== -1 && northIdx !== -1) {
      // Remove the 4 wind tiles in reverse order so indexes stay correct
      const newsIndices = [eastIdx, southIdx, westIdx, northIdx].sort((a, b) => b - a);
      const newsTiles: WinningTileData[] = [];
      for (const idx of newsIndices) {
        newsTiles.unshift(naturalTiles.splice(idx, 1)[0]);
      }
      // Sort in clean East, South, West, North order
      newsTiles.sort((a, b) => {
        const order: Record<string, number> = { East: 1, South: 2, West: 3, North: 4 };
        return (order[a.label || ''] || 0) - (order[b.label || ''] || 0);
      });
      melds.push({
        combinationName: 'NEWS',
        tiles: newsTiles
      });
    }

    // 3. Check for White Dragon pairs (used as '00' in year hands like 2026)
    const whiteDragonTiles = naturalTiles.filter(t => t.type === 'DRAGON_WHITE' || t.label?.includes('White Dragon'));
    if (whiteDragonTiles.length === 2) {
      // Remove both White Dragons from the pool
      for (const wd of whiteDragonTiles) {
        const idx = naturalTiles.indexOf(wd);
        if (idx !== -1) naturalTiles.splice(idx, 1);
      }
      melds.push({
        combinationName: 'Pair of White Dragon',
        tiles: whiteDragonTiles
      });
    }

    // 4. Check for Suited Runs / Sequences (e.g. 113579, 246, 135)
    // In American Mahjongg, runs and pairs cannot contain Jokers
    const suits = ['Crack', 'Bam', 'Dot'];
    for (const suit of suits) {
      const suitTiles = naturalTiles.filter(t => (t.label || '').includes(suit));
      if (suitTiles.length === 0) continue;

      // Group tiles by their number rank in this suit
      const rankCounts = new Map<number, WinningTileData[]>();
      for (const t of suitTiles) {
        const rank = t.rank || 0;
        if (!rankCounts.has(rank)) rankCounts.set(rank, []);
        rankCounts.get(rank)!.push(t);
      }

      // Pattern 4A: 113579 (Odd run with a pair: e.g. 1, 1, 3, 5, 7, 9)
      const hasOddSingles = [3, 5, 7, 9].every(r => (rankCounts.get(r)?.length || 0) >= 1);
      const pairRank = [1, 3, 5, 7, 9].find(r => (rankCounts.get(r)?.length || 0) >= 2);
      if (hasOddSingles && pairRank !== undefined) {
        const runTiles: WinningTileData[] = [];
        // Take the pair
        runTiles.push(...rankCounts.get(pairRank)!.splice(0, 2));
        // Take one of each other odd rank
        for (const r of [1, 3, 5, 7, 9]) {
          if (r !== pairRank) {
            runTiles.push(rankCounts.get(r)!.splice(0, 1)[0]);
          }
        }
        // Remove from naturalTiles
        for (const t of runTiles) {
          const idx = naturalTiles.indexOf(t);
          if (idx !== -1) naturalTiles.splice(idx, 1);
        }
        runTiles.sort((a, b) => (a.rank || 0) - (b.rank || 0));
        melds.push({
          combinationName: `113579 ${suit}`,
          tiles: runTiles
        });
        continue;
      }

      // Pattern 4B: 246 Even Run (single 2, single 4, single 6)
      const has246 = (rankCounts.get(2)?.length === 1) &&
        (rankCounts.get(4)?.length === 1) &&
        (rankCounts.get(6)?.length === 1);
      if (has246) {
        const runTiles: WinningTileData[] = [
          rankCounts.get(2)!.splice(0, 1)[0],
          rankCounts.get(4)!.splice(0, 1)[0],
          rankCounts.get(6)!.splice(0, 1)[0]
        ];
        for (const t of runTiles) {
          const idx = naturalTiles.indexOf(t);
          if (idx !== -1) naturalTiles.splice(idx, 1);
        }
        melds.push({
          combinationName: `246 ${suit}`,
          tiles: runTiles
        });
        continue;
      }

      // Pattern 4C: 135 Odd Run (single 1, single 3, single 5)
      const has135 = (rankCounts.get(1)?.length === 1) &&
        (rankCounts.get(3)?.length === 1) &&
        (rankCounts.get(5)?.length === 1);
      if (has135) {
        const runTiles: WinningTileData[] = [
          rankCounts.get(1)!.splice(0, 1)[0],
          rankCounts.get(3)!.splice(0, 1)[0],
          rankCounts.get(5)!.splice(0, 1)[0]
        ];
        for (const t of runTiles) {
          const idx = naturalTiles.indexOf(t);
          if (idx !== -1) naturalTiles.splice(idx, 1);
        }
        melds.push({
          combinationName: `135 ${suit}`,
          tiles: runTiles
        });
        continue;
      }
    }

    // 5. Group remaining identical natural tiles into combinations
    const naturalGroupsMap = new Map<string, WinningTileData[]>();
    for (const tile of naturalTiles) {
      const key = `${tile.type}_${tile.rank ?? ''}_${tile.label ?? ''}`;
      if (!naturalGroupsMap.has(key)) {
        naturalGroupsMap.set(key, []);
      }
      naturalGroupsMap.get(key)!.push(tile);
    }

    const groupedLists: WinningTileData[][] = Array.from(naturalGroupsMap.values());

    // 6. Assign Jokers to incomplete melds:
    // Jokers can only be used in Pungs (3), Kongs (4), Quints (5).
    // Pairs must never receive a Joker.

    // Case A: 3 natural tiles + 1 Joker -> Kong of 4 tiles (e.g. 111J)
    for (const list of groupedLists) {
      if (jokerTiles.length > 0 && list.length === 3) {
        list.push(jokerTiles.pop()!);
      }
    }

    // Case B: 1 natural tile + 2 Jokers -> Pung of 3 tiles (e.g. 6JJ)
    for (const list of groupedLists) {
      if (jokerTiles.length >= 2 && list.length === 1) {
        list.push(jokerTiles.pop()!);
        list.push(jokerTiles.pop()!);
      }
    }

    // Case C: 2 natural tiles + 1 Joker -> Pung of 3 tiles (e.g. 88J)
    for (const list of groupedLists) {
      if (jokerTiles.length >= 1 && list.length === 2) {
        list.push(jokerTiles.pop()!);
      }
    }

    // 7. Add grouped identical combinations with clear names
    for (const list of groupedLists) {
      const combName = this.describeMeldGroup(list);
      melds.push({
        combinationName: combName,
        tiles: list
      });
    }

    // 8. Any remaining Jokers (fallback)
    if (jokerTiles.length > 0) {
      const count = jokerTiles.length;
      melds.push({
        combinationName: count === 1 ? '1 Joker' : `${count} Jokers`,
        tiles: jokerTiles
      });
    }

    return melds;
  }

  // Label the group in simple plain English
  private describeMeldGroup(group: WinningTileData[]): string {
    if (group.length === 0) return '';

    // Find the first natural tile to get the name
    let rep = group[0];
    for (const t of group) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const count = group.length;
    if (rep.category === 'FLOWER' || rep.label?.includes('Flower')) {
      return count === 1 ? '1 Flower' : `${count} Flowers`;
    }
    if (rep.label?.includes('Joker')) {
      return count === 1 ? '1 Joker' : `${count} Jokers`;
    }

    if (count === 2) return `Pair of ${rep.label}`;
    if (count === 3) return `Pung of ${rep.label}`;
    if (count === 4) return `Kong of ${rep.label}`;
    if (count === 5) return `Quint of ${rep.label}`;
    if (count === 6) return `Sextet of ${rep.label}`;

    return `${count} ${rep.label}`;
  }

  // Card sort order: Flowers (100) -> Suited Units (200 + suit) -> Dragons (400) -> Winds (500)
  private getWinningGroupSortOrder(group: WinningMeldGroup): number {
    if (!group.tiles || group.tiles.length === 0) return 999;

    const combName = group.combinationName || '';

    // 1. Flowers first
    if (combName.includes('Flower')) return 100;

    // 2. NEWS winds
    if (combName === 'NEWS') return 500;

    // 3. White Dragon / Dragons
    if (combName.includes('White Dragon') || combName.includes('Dragon')) return 400;

    // 4. Suited combinations: Keep suit and run together
    let rep = group.tiles[0];
    for (const t of group.tiles) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const label = rep.label || combName;
    let suitOffset = 0;
    if (label.includes('Crack')) suitOffset = 10;
    else if (label.includes('Dot')) suitOffset = 20;
    else if (label.includes('Bam')) suitOffset = 30;

    const minRank = Math.min(...group.tiles.map(t => t.rank || 9));
    return 200 + suitOffset * 5 + minRank;
  }
  /* NEWCODE */
  /* NEWCODE */

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

  // Dummy Wall Game test helper - callable via console: testWallGame()
  public testWallGame(): void {
    this.gameOverState.set({
      isVisible: true,
      title: 'Wall Game',
      message: 'That means no one win the game.',
      reason: 'WALL_EMPTY'
    });
    this.isResultPopupHidden.set(false);
    this.wallGameOver.set(true);

    // Fallback discard area rect if not yet computed by Phaser layout
    if (!this.discardAreaRect()) {
      const host = this.hostRef?.nativeElement;
      const width = host?.clientWidth || 800;
      const height = host?.clientHeight || 600;
      this.discardAreaRect.set({
        x: Math.round(width * 0.2),
        y: Math.round(height * 0.25),
        width: Math.round(width * 0.6),
        height: Math.round(height * 0.5)
      });
    }

    const allTilesMap = this.gameState.game_all_tiles();
    const tileIds = Object.keys(allTilesMap || {}).map(Number);

    // 1. Check if real seats are present in active state
    const seats = this.gameState.play_seats();
    const getSeatPos = this.gameState.seat_position_by_gseat_id();
    const opponentHands: Record<string, number[]> = {};

    if (seats && typeof seats === 'object') {
      for (const seat of Object.values(seats) as any[]) {
        const seatPos = getSeatPos(seat?.id);
        if (seatPos && seatPos !== 'bottom') {
          const rack = seat?.racks?.[1] || seat?.racks?.["1"];
          const ids: number[] = rack?.hand_order && Array.isArray(rack.hand_order)
            ? rack.hand_order
            : rack?.hand && typeof rack.hand === 'object'
              ? Object.keys(rack.hand).map(Number)
              : [];
          if (ids.length > 0) {
            opponentHands[seatPos] = ids;
          }
        }
      }
    }

    // 2. Fallback to sample mock tiles if empty so user can test anytime
    if (!opponentHands['top'] || opponentHands['top'].length === 0) {
      opponentHands['top'] = tileIds.length >= 42
        ? tileIds.slice(0, 14)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    }
    if (!opponentHands['left'] || opponentHands['left'].length === 0) {
      opponentHands['left'] = tileIds.length >= 42
        ? tileIds.slice(14, 28)
        : [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
    }
    if (!opponentHands['right'] || opponentHands['right'].length === 0) {
      opponentHands['right'] = tileIds.length >= 42
        ? tileIds.slice(28, 42)
        : [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42];
    }

    this.phaser?.events.emit("table:wall-game", opponentHands);
  }

  public closeWallGame(): void {
    this.wallGameOver.set(false);
    this.isResultPopupHidden.set(false);
  }
  /* NEWCODE */

  /* OLDCODE
  public onExitGame(): void {
    void this.router.navigate(["/"]);
  }

  public onStartNewGame(): void {
    window.location.href = "/game";
  }
  OLDCODE */
  /* NEWCODE */
  public onExitGame(): void {
    // Redirect to home route
    void this.router.navigate(["/home"]);
  }

  public onStartNewGame(): void {
    // Start a new game on /game route
    window.location.href = "/game";
  }
  /* NEWCODE */

  private clearMahjongWinPopupTimer(): void {
    if (this.mahjongWinPopupTimer !== undefined) {
      window.clearTimeout(this.mahjongWinPopupTimer);
      this.mahjongWinPopupTimer = undefined;
    }
  }

  /* NEWCODE */
  private clearMahjongCheckTimer(): void {
    if (this.mahjongCheckTimer !== undefined) {
      window.clearTimeout(this.mahjongCheckTimer);
      this.mahjongCheckTimer = undefined;
    }
  }

  private clearMahjongShakeTimer(): void {
    if (this.mahjongShakeTimer !== undefined) {
      window.clearTimeout(this.mahjongShakeTimer);
      this.mahjongShakeTimer = undefined;
    }
  }

  private handleMahjongFailure(): void {
    this.clearMahjongCheckTimer();
    this.mahjongButtonProcessing.set(false);
    this.mahjongButtonShaking.set(true);

    /* OLDCODE
    try {
      const audio = new Audio("assets/sounds/error_01.wav");
      void audio.play().catch((err) => {
        console.warn("Could not play error_01.wav sound:", err);
      });
    } catch (e) {
      console.warn("Error playing error_01.wav:", e);
    }
    OLDCODE */
    /* NEWCODE */
    this.phaser?.events.emit("ui:error-sound");
    /* NEWCODE */

    this.clearMahjongShakeTimer();
    this.mahjongShakeTimer = window.setTimeout(() => {
      this.mahjongButtonShaking.set(false);
      this.mahjongShakeTimer = undefined;
    }, 600);
  }
  /* NEWCODE */

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
