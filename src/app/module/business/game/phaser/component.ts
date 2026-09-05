// file: src/app/module/business/game/phaser/component.ts
import {
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
import { GameDeadHandReasonEnum, GamePhaseFirstRoundDirectionEnum, GameTileEntity, GameTileEntityGSDto, TileCategoryEnum, GamePlayActionEnum, TileCategoryEnumAddon, GamePhaseEnum, GameRackIDEnumAddon } from "@bfw/api-sdk/graphql/endpoints/business";
import {
  DeadHandClaim,
  DeadHandReason,
  DeadHandSeatSelectionState,
  DemoDiscardRequest,
  HeaderLogoLayoutState,
  InstructionPanelOverlayState,
  JoinTableRequest,
  JoinTableRequestDecision,
  MahjongWinCelebration,
  MobileDrawerOverlayState,
  MobileHeaderToggleOverlayState,
  PlayerAwayNotice,
  PlayerLabelOverlayKey,
  PlayerLabelOverlayState,
  PlayerRemovalRequest,
  PointsOverlayState,
  TableOverlayBlockLevel,
  TableSeat,
  TileCallDecision,
  TileCallOffer,
  WallCountOverlayState
} from "./scenes/type";

import { COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY } from "./const";
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
  @ViewChild("host", { static: true })
  private readonly hostRef!: ElementRef<HTMLDivElement>;

  @ViewChild("headerLogo", { static: true })
  private readonly headerLogoRef!: ElementRef<HTMLImageElement>;

  @ViewChild("safeAreaProbe", { static: true })
  private readonly safeAreaProbeRef!: ElementRef<HTMLDivElement>;



  readonly passDirection = input<PassDirection>(GamePhaseFirstRoundDirectionEnum.RIGHT);
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
  readonly restartGame = output<void>();
  readonly quitGame = output<void>();

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
  private joinTablePopupTimer?: number;
  private mahjongWinPopupTimer?: number;

  private lastWallCount = -1;
  private lastDiscardCount = -1;

  public readonly GameDeadHandReasonEnum = GameDeadHandReasonEnum;

  readonly wallCountState = signal<WallCountOverlayState | null>(null);
  readonly pointsState = signal<PointsOverlayState | null>(null);
  readonly playerLabelStates = signal<readonly PlayerLabelOverlayState[]>([]);
  readonly instructionPanelState = signal<InstructionPanelOverlayState | null>(null);
  readonly mobileHeaderToggleOverlay = signal<MobileHeaderToggleOverlayState | null>(null);

  readonly mobileDrawerState = signal<MobileDrawerOverlayState | null>(null);
  readonly deadHandSelectionState = signal<DeadHandSeatSelectionState | null>(null);
  readonly removePlayerNotice = signal<PlayerAwayNotice | null>(null);
  readonly removePlayerRemaining = signal<number>(0);
  readonly joinTableRequestState = signal<JoinTableRequest | null>(null);
  readonly joinTableRemaining = signal<number>(0);
  readonly deadHandClaimTarget = signal<Exclude<TableSeat, "bottom"> | null>(null);
  readonly deadHandClaimReason = signal<DeadHandReason>(GameDeadHandReasonEnum.FALSE_MAHJONG);
  readonly mahjongWinResult = signal<MahjongWinCelebration | null>(null);


  private readonly deviceLayout = inject(PhaserLayoutDevice);
  private readonly injector = inject(Injector);
  private readonly notify = inject(NotifyService);

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

    // Map the IDs to the actual GameTileEntityGSDto items
    const rack = order.length > 0
      ? order.map(id => hand[id]).filter(t => !!t)
      : Object.values(hand);

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

  public onClaimOptionSelected(action: GamePlayActionEnum, tile_id: number): void {
    this.gameState.publishClaimAction(action, tile_id);
  }

  constructor() {
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

      console.log('this.phaser', this.phaser, this.sceneReady());


      if (!this.phaser || !this.sceneReady()) return;

      this.phaser.events.emit("rack:set", rack);
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
        this.lastDiscardCount = count;
        return;
      }

      if (this.lastDiscardCount !== -1 && count > this.lastDiscardCount) {
        const newTiles = discards.slice(this.lastDiscardCount);
        for (const tile of newTiles) {
          if (tile.gseat_id) {
            const seatPosFn = this.gameState.seat_position_by_gseat_id();
            const seatPos = seatPosFn(tile.gseat_id);
            if (seatPos && seatPos !== "bottom") {
              this.phaser.events.emit("opponent:discard", { seat: seatPos, tile });
            }
          }
        }
      }
      this.lastDiscardCount = count;
    });

    effect(() => {
      const charlestonState = this.gameState.charlestonState();
      if (!this.phaser || !this.sceneReady()) return;
      this.phaser.events.emit("charleston:state", charlestonState);
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
      const claim = this.gameState.active_claim();
      if (!this.phaser || !this.sceneReady()) return;

      if (claim) {
        this.phaser.events.emit("ui:show-claim-window", claim);
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
      const exposures = this.gameState.all_seat_exposures();
      if (this.phaser && this.sceneReady()) {
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
      const seats = this.gameState.ordered_seats();
      if (this.phaser && this.sceneReady() && isFinished) {
        const winner = seats.find(s => s.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.is_mahjong);
        this.phaser.events.emit("ui:game-finished", {
          winnerSeatId: winner?.id,
          winnerUid: winner?.u_id
        });
      }
    });

    effect(() => {
      const direction = this.gameState.play_pass_direction();
      console.log('EFFECT Phaser pass:direction', direction)
      if (!this.phaser || !this.sceneReady() || !direction) return;

      console.log("[PhaserBoardComponent] emit pass:direction", direction);

      this.phaser.events.emit("pass:direction", direction);
    });

    effect(() => {
      const playPhase = this.gameState.play_phase();
      if (!this.phaser || !this.sceneReady() || !playPhase) return;

      console.log("[PhaserBoardComponent] emit table:phase", playPhase);

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
          onSelectionChanged: (ids) => this.zone.run(() => this.selectionChanged.emit(ids)),
          onPassCompleted: async (payload) => {
            console.log("[PhaserBoardComponent] Publishing Charleston with tiles:", payload.tileIds);
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
            this.gameState.publishDiscardTile(tileId);
          },
          onWallCountOverlay: (state) => this.setWallCountOverlay(state),
          onPlayerLabelOverlay: (states) => this.setPlayerLabelOverlays(states),
          onPointsOverlay: (state) => this.setPointsOverlay(state),
          onMobileDrawerVisibilityChanged: (open) => this.setMobileDrawerOpen(open),
          onMobileDrawerOverlay: (state) => this.setMobileDrawerOverlay(state),
          onMobileHeaderToggleOverlay: (state) => this.setMobileHeaderToggleOverlay(state),
          onInstructionPanelOverlay: (state) => this.setInstructionPanelOverlay(state),
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
          onRestartGame: () => this.zone.run(() => this.restartGame.emit()),
          onQuitGame: () => this.zone.run(() => this.quitGame.emit()),
        });
      });

      this.phaser = new Phaser.Game({
        type: Phaser.WEBGL,
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

      console.log('300 sceneReady', this.sceneReady());

      this.phaser.events.once("table:ready", () => {
        this.sceneReady.set(true);
        console.log('304 sceneReady', this.sceneReady());
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

            console.log("Charleston animation finished");

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

  private setInstructionPanelOverlay(state: InstructionPanelOverlayState): void {
    this.instructionPanelState.set(state);
  }

  public onInstructionPanelClick(action?: string): void {
    const state = this.instructionPanelState();
    if (!state) return;

    if (action === "second-pass") {
      this.gameState.publishCharlestoneSecondRoundVote(true);
    } else if (action === "second-stop") {
      this.gameState.publishCharlestoneSecondRoundVote(false);
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

  /**
   * Native Dead Hand claim dialog. Phaser retains the exposure highlights and
   * seat arrows; this overlay owns the readable reason-selection controls.
   */
  private setDeadHandPopup(targetSeat: Exclude<TableSeat, "bottom"> | null): void {
    this.deadHandClaimTarget.set(targetSeat);
    if (targetSeat) {
      this.deadHandClaimReason.set(GameDeadHandReasonEnum.FALSE_MAHJONG);
    }
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

    if (!result) return;

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

    this.mahjongWinPopupTimer = window.setTimeout(() => {
      this.mahjongWinPopupTimer = undefined;
      this.setMahjongWinPopup(null);
    }, 4200);
  }

  public onDismissMahjongWinPopup(): void {
    if (this.mahjongWinPopupTimer !== undefined) {
      this.setMahjongWinPopup(null);
    }
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

  private readCssPx(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
}
