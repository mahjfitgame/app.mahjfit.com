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
} from "@angular/core";
import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";

import { PhaserScene } from "./scenes/scene";
import { DeadHandClaim, DeadHandReason, DeadHandSeatSelectionState, DemoDiscardRequest, HeaderLogoLayoutState, InstructionPanelOverlayState, JoinTableRequest, JoinTableRequestDecision, MahjongWinCelebration, MobileDrawerOverlayState, PlayerAwayNotice, PlayerLabelOverlayKey, PlayerLabelOverlayState, PlayerRemovalRequest, PointsOverlayState, TableOverlayBlockLevel, TableSeat, TileCallDecision, TileCallOffer, WallCountOverlayState } from "./scenes/type";

import { COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY } from "./const";
import { GameHapticType, PassDirection, TileVm } from "../type";
import { GameHeptic } from "../haptics";
import { TablePhase } from "./type";
import { PhaserLayoutDevice } from "./layout/device";

@Component({
  selector: "app-phaser",
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class PhaserComponent implements AfterViewInit {
  @ViewChild("host", { static: true })
  private readonly hostRef!: ElementRef<HTMLDivElement>;

  @ViewChild("headerLogo", { static: true })
  private readonly headerLogoRef!: ElementRef<HTMLImageElement>;

  @ViewChild("safeAreaProbe", { static: true })
  private readonly safeAreaProbeRef!: ElementRef<HTMLDivElement>;

  @ViewChild("wallCountOverlay", { static: true })
  private readonly wallCountOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("wallIconOverlay", { static: true })
  private readonly wallIconOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("pointsOverlay", { static: true })
  private readonly pointsOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("pointsIconOverlay", { static: true })
  private readonly pointsIconOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("mobileDrawerOverlay", { static: true })
  private readonly mobileDrawerOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("instructionPanel", { static: true })
  private readonly instructionPanelRef!: ElementRef<HTMLDivElement>;

  @ViewChild("instructionPanelContent", { static: true })
  private readonly instructionPanelContentRef!: ElementRef<HTMLDivElement>;

  @ViewChild("instructionPanelTitle", { static: true })
  private readonly instructionPanelTitleRef!: ElementRef<HTMLDivElement>;

  @ViewChild("instructionPanelBody", { static: true })
  private readonly instructionPanelBodyRef!: ElementRef<HTMLDivElement>;

  @ViewChild("instructionPanelButton", { static: true })
  private readonly instructionPanelButtonRef!: ElementRef<HTMLButtonElement>;

  @ViewChild("deadHandSeatPicker", { static: true })
  private readonly deadHandSeatPickerRef!: ElementRef<HTMLDivElement>;

  @ViewChild("removePlayerPopup", { static: true })
  private readonly removePlayerPopupRef!: ElementRef<HTMLDivElement>;

  @ViewChild("joinTablePopup", { static: true })
  private readonly joinTablePopupRef!: ElementRef<HTMLDivElement>;

  @ViewChild("deadHandPopup", { static: true })
  private readonly deadHandPopupRef!: ElementRef<HTMLDivElement>;

  @ViewChild("mahjongWinPopup", { static: true })
  private readonly mahjongWinPopupRef!: ElementRef<HTMLDivElement>;

  @ViewChild("topPlayerLabelOverlay", { static: true })
  private readonly topPlayerLabelOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("rightPlayerLabelOverlay", { static: true })
  private readonly rightPlayerLabelOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("leftPlayerLabelOverlay", { static: true })
  private readonly leftPlayerLabelOverlayRef!: ElementRef<HTMLDivElement>;

  @ViewChild("bottomPlayerLabelOverlay", { static: true })
  private readonly bottomPlayerLabelOverlayRef!: ElementRef<HTMLDivElement>;

  readonly rack = input.required<readonly TileVm[]>();
  readonly passDirection = input<PassDirection>("right");
  readonly selectionChanged = output<readonly string[]>();
  readonly passCompleted = output<{ readonly tileIds: readonly string[]; readonly direction: PassDirection }>();
  /** Feed this from the future WebSocket when another player discards a tile. */
  readonly tileCallOffer = input<TileCallOffer | null>(null);
  readonly demoDiscard = input<DemoDiscardRequest | null>(null);
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

  private game?: Phaser.Game;
  private sceneReady = false;
  private safeAreaRefreshTimer?: number;
  private joinTablePopupTimer?: number;
  private mahjongWinPopupTimer?: number;

  private mobileDrawerOpen = false;
  private wallCountOverlayState?: WallCountOverlayState;
  private pointsOverlayState?: PointsOverlayState;
  private playerLabelOverlayStates: readonly PlayerLabelOverlayState[] = [];

  readonly tablePhase = input<TablePhase>("playing");
  private readonly deviceLayout = inject(PhaserLayoutDevice);

  /*constructor() {
    effect(() => {
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("rack:set", this.rack());
    });

     effect(() => {
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("pass:direction", this.passDirection());
    }); 
  } */
  constructor() {
    effect(() => {
      const rack = this.rack();

      if (!this.game || !this.sceneReady) return;

      this.game.events.emit("rack:set", rack);
    });

    effect(() => {
      const direction = this.passDirection();

      if (!this.game || !this.sceneReady) return;

      console.log("[PhaserBoardComponent] emit pass:direction", direction);

      this.game.events.emit("pass:direction", direction);
    });

    effect(() => {
      const tablePhase = this.tablePhase();
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("table:phase", tablePhase);
    });

    effect(() => {
      const offer = this.tileCallOffer();
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("tile-call:offer", offer);
    });

    effect(() => {
      const request = this.demoDiscard();
      if (!request || !this.game || !this.sceneReady) return;
      this.game.events.emit("tile-call:demo-discard", request);
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
      const scene = new PhaserScene({
        onSelectionChanged: (ids) => this.zone.run(() => this.selectionChanged.emit(ids)),
        onPassCompleted: (payload) => this.zone.run(() => this.passCompleted.emit(payload)),
        onHaptic: (type: GameHapticType) => {
          void this.haptics.play(type);
        },
        getDeviceLayout: (width, height) =>
          this.deviceLayout.forViewport(width, height),
        onMobileHeaderChanged: (collapsed) =>
          this.setMobileHeaderCollapsed(collapsed),
        onWallCountOverlay: (state) => this.setWallCountOverlay(state),
        onPlayerLabelOverlay: (states) => this.setPlayerLabelOverlays(states),
        onPointsOverlay: (state) => this.setPointsOverlay(state),
        onMobileDrawerVisibilityChanged: (open) => this.setMobileDrawerOpen(open),
        onMobileDrawerOverlay: (state) => this.setMobileDrawerOverlay(state),
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

      this.game = new Phaser.Game({
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
      const canvas = this.game.canvas;
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }

      // Bound once, outside the Angular zone. The Phaser scene owns whether the
      // action is currently allowed, exactly as the old Phaser button did.
      this.instructionPanelButtonRef.nativeElement.addEventListener(
        "pointerdown",
        (event) => {
          event.stopPropagation();
          this.game?.events.emit("instruction-panel:primary-action");
        },
      );

      this.game.events.once("table:ready", () => {
        this.sceneReady = true;
        // The scene has now registered its resize listener, so apply the
        // initial iOS/Android inset measurement through the normal layout
        // path instead of only storing it for a later resize.
        this.syncGameViewport();
        this.game?.events.emit("rack:set", this.rack());
        this.game?.events.emit("pass:direction", this.passDirection());
        this.game?.events.emit("table:phase", this.tablePhase());
        this.game?.events.emit("tile-call:offer", this.tileCallOffer());
        const request = this.demoDiscard();
        if (request) this.game?.events.emit("tile-call:demo-discard", request);
        const win = this.mahjongWin();
        if (win) this.setMahjongWinPopup(win);
        this.game?.events.on(

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

      this.game?.destroy(true);
      this.game = undefined;
      this.sceneReady = false;
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
    if (!this.game) return;

    const host = this.hostRef.nativeElement;
    const width = Math.max(1, Math.round(host.clientWidth));
    const height = Math.max(1, Math.round(host.clientHeight));

    const safeArea = this.readSafeAreaInsets();
    // Keep DOM header assets aligned with Phaser's resolved iOS fallback inset.
    host.style.setProperty("--game-safe-top", `${safeArea.top}px`);
    this.game.scale.resize(width, height);
    this.game.events.emit("table:safe-area", safeArea);
    this.game.events.emit("table:resize", width, height);
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
    this.wallCountOverlayState = state;
    const element = this.wallCountOverlayRef.nativeElement;
    const icon = this.wallIconOverlayRef.nativeElement;
    const visible = state.visible && !this.mobileDrawerOpen;
    element.style.display = visible ? "block" : "none";
    icon.style.display = visible ? "block" : "none";
    if (!visible) return;

    const fontSize = Math.round(state.fontSize);
    element.textContent = state.text;
    element.style.left = `${Math.round(state.x)}px`;
    // Phaser supplies a centre Y position; line-height is exactly one em.
    element.style.top = `${Math.round(state.y - fontSize / 2)}px`;
    element.style.fontSize = `${fontSize}px`;
    element.style.color = COLOR_BLUE;

    const iconSize = Math.round(state.iconSize);
    icon.style.color = COLOR_BLUE;
    icon.style.left = `${Math.round(state.iconX - iconSize / 2)}px`;
    icon.style.top = `${Math.round(state.iconY - iconSize / 2)}px`;
    icon.style.fontSize = `${iconSize}px`;
  }

  /** Uses native text for the mobile points value; Phaser still draws its icon. */
  private setPointsOverlay(state: PointsOverlayState): void {
    this.pointsOverlayState = state;
    const element = this.pointsOverlayRef.nativeElement;
    const icon = this.pointsIconOverlayRef.nativeElement;
    const visible = state.visible && !this.mobileDrawerOpen;
    element.style.display = visible ? "block" : "none";
    icon.style.display = visible ? "block" : "none";
    if (!visible) return;

    const fontSize = Math.round(state.fontSize);
    element.textContent = state.text;
    element.style.left = `${Math.round(state.x)}px`;
    element.style.top = `${Math.round(state.y - fontSize / 2)}px`;
    element.style.fontSize = `${fontSize}px`;

    const iconSize = Math.round(state.iconSize);
    icon.style.left = `${Math.round(state.iconX - iconSize / 2)}px`;
    icon.style.top = `${Math.round(state.iconY - iconSize / 2)}px`;
    icon.style.fontSize = `${iconSize}px`;
  }

  /**
   * Phaser calculates all seat coordinates while the browser draws the
   * label text sharply at every viewport size.
   */
  private setPlayerLabelOverlays(states: readonly PlayerLabelOverlayState[]): void {
    this.playerLabelOverlayStates = states;
    const elements: Record<PlayerLabelOverlayKey, HTMLDivElement> = {
      top: this.topPlayerLabelOverlayRef.nativeElement,
      right: this.rightPlayerLabelOverlayRef.nativeElement,
      left: this.leftPlayerLabelOverlayRef.nativeElement,
      bottom: this.bottomPlayerLabelOverlayRef.nativeElement,
    };

    for (const state of states) {
      const element = elements[state.key];
      const visible = state.visible && !this.mobileDrawerOpen;
      element.style.display = visible ? "block" : "none";
      if (!visible) continue;

      element.textContent = state.text;
      element.style.fontSize = `${Math.round(state.fontSize)}px`;
      element.style.color = state.color;
      element.style.transform = state.angle === 0 ? "none" : `rotate(${state.angle}deg)`;

      // CSS rotates around the element centre. Its layout box remains
      // unrotated, so all four labels use their native width/height here.
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      element.style.left = `${Math.round(state.x - width / 2)}px`;
      element.style.top = `${Math.round(state.y - height / 2)}px`;
    }
  }

  /**
   * Native text sits above the Phaser canvas to remain sharp. A Phaser drawer
   * therefore explicitly suspends those overlays, then restores their most
   * recent layout state after the drawer closes.
   */
  private setMobileDrawerOpen(open: boolean): void {
    // The native drawer itself now covers the menu region, so sharp labels
    // remain visible outside it and never need a blurry Phaser fallback.
    this.mobileDrawerOpen = false;
    this.hostRef.nativeElement.classList.remove("mobile-drawer-open");
    if (this.wallCountOverlayState) this.setWallCountOverlay(this.wallCountOverlayState);
    if (this.pointsOverlayState) this.setPointsOverlay(this.pointsOverlayState);
    if (this.playerLabelOverlayStates.length > 0) {
      this.setPlayerLabelOverlays(this.playerLabelOverlayStates);
    }
  }


  private setMobileDrawerOverlay(state: MobileDrawerOverlayState): void {
    const panel = this.mobileDrawerOverlayRef.nativeElement;
    panel.style.display = state.visible ? "block" : "none";
    if (!state.visible) return;
    panel.style.left = `${Math.round(state.x)}px`;
    panel.style.top = `${Math.round(state.y)}px`;
    panel.style.width = `${Math.round(state.width)}px`;
    // Phaser supplies the interaction height for rows only. The native
    // drawer also renders a title and CSS padding, so reserve that space here
    // to keep every submenu item visible on tablet and desktop.
    const nativeRowHeight = 29;
    const nativeTitleHeight = state.title ? 38 : 0;
    const nativePaddingHeight = state.title ? 30 : 72;
    const requiredHeight = nativeTitleHeight + nativePaddingHeight + state.items.length * nativeRowHeight;
    panel.style.height = `${Math.max(Math.round(state.height), requiredHeight)}px`;
    panel.style.paddingTop = state.title ? "16px" : "58px";
    panel.style.paddingRight = "18px";
    panel.style.paddingBottom = "14px";
    panel.style.paddingLeft = "18px";
    panel.style.pointerEvents = "auto";
    panel.style.borderRadius = "22px";
    panel.style.background = "#ffffff";
    panel.style.boxShadow = "0 8px 14px rgb(7 20 47 / 28%)";
    panel.replaceChildren();
    const close = document.createElement("div");
    close.className = "mobile-drawer-overlay__close";
    close.textContent = "×";
    close.style.position = "absolute";
    close.style.left = "14px";
    close.style.top = "6px";
    close.style.pointerEvents = "auto";
    close.style.cursor = "pointer";
    close.style.color = COLOR_FUSHIA;
    close.style.fontSize = "40px";
    close.style.fontWeight = "700";
    close.style.lineHeight = "1";
    close.addEventListener("click", () => this.game?.events.emit("mobile-drawer:close"));
    panel.append(close);
    if (state.title) {
      const title = document.createElement("div");
      title.className = "mobile-drawer-overlay__title";
      title.textContent = state.title;
      title.style.marginLeft = "42px";
      title.style.marginBottom = "14px";
      title.style.fontSize = "20px";
      title.style.fontWeight = "700";
      title.style.lineHeight = "1.2";
      title.style.color = COLOR_BLUE;
      panel.append(title);
    }
    for (const item of state.items) {
      const row = document.createElement("div");
      row.className = "mobile-drawer-overlay__item";
      row.style.color = COLOR_FUSHIA;
      row.style.fontSize = "16px";
      row.style.fontWeight = "600";
      row.style.lineHeight = "1.55";
      row.style.whiteSpace = "nowrap";
      row.style.marginBottom = "4px";
      row.textContent = item;
      row.style.pointerEvents = "auto";
      row.style.cursor = "pointer";
      row.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        this.game?.events.emit("hamburger:html-action", item);
      });
      panel.append(row);
    }
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

  private setInstructionPanelOverlay(state: InstructionPanelOverlayState): void {
    const panel = this.instructionPanelRef.nativeElement;
    const content = this.instructionPanelContentRef.nativeElement;
    const title = this.instructionPanelTitleRef.nativeElement;
    const body = this.instructionPanelBodyRef.nativeElement;
    const button = this.instructionPanelButtonRef.nativeElement;

    panel.style.display = state.visible ? "block" : "none";
    if (!state.visible) return;

    // The layout engine reserves the card rect; the border is drawn inside it
    // so the panel never grows past the space the engine set aside for it.
    panel.style.left = `${state.x}px`;
    panel.style.top = `${state.y}px`;
    panel.style.width = `${state.width}px`;
    panel.style.height = `${state.height}px`;
    panel.style.borderWidth = `${state.borderWidth}px`;
    panel.style.borderRadius = `${state.radius}px`;
    panel.style.boxShadow = `0 ${state.shadowY}px ${state.shadowBlur}px rgb(7 20 47 / 30%)`;

    // Children position against the padding box, which starts one border width
    // inside the card rect that the published coordinates are relative to.
    const inset = state.borderWidth;
    content.style.left = `${-inset}px`;
    content.style.width = `${state.width}px`;
    content.style.top = `${state.contentTop - inset}px`;
    content.style.height = `${Math.max(0, state.contentBottom - state.contentTop)}px`;

    title.textContent = state.title;
    title.style.fontSize = `${state.titleFontSize}px`;
    title.style.marginBottom = state.body ? `${state.titleGap}px` : "0px";

    body.textContent = state.body;
    body.style.fontSize = `${state.bodyFontSize}px`;

    const action = state.button;
    button.textContent = action.label;
    button.style.left = `${action.x - inset}px`;
    button.style.top = `${action.y - inset}px`;
    button.style.width = `${action.width}px`;
    button.style.height = `${action.height}px`;
    button.style.borderRadius = `${action.radius}px`;
    button.style.fontSize = `${action.fontSize}px`;
    // Subtle top-down sheen over the flat body, as in the reference design.
    button.style.background =
      `linear-gradient(180deg, rgb(255 255 255 / 12%), rgb(255 255 255 / 0%) 48%), ` +
      (action.enabled ? COLOR_FUSHIA : "#777777");
    button.style.opacity = action.enabled ? "1" : "0.65";
    button.style.boxShadow =
      `0 ${action.shadowY}px ${action.shadowBlur}px rgb(7 20 47 / ${action.enabled ? 34 : 20}%)`;
    button.setAttribute("aria-disabled", String(!action.enabled));
  }

  /**
   * First Dead Hand step. Phaser resolves the exposure boxes from the layout
   * engine, so the highlights stay locked to the table; the browser draws the
   * dimmer, arrows, and copy so the text is sharp at any pixel ratio.
   */
  private setDeadHandSeatSelection(state: DeadHandSeatSelectionState): void {
    const panel = this.deadHandSeatPickerRef.nativeElement;
    panel.style.display = state.visible ? "block" : "none";
    panel.setAttribute("aria-hidden", String(!state.visible));
    panel.replaceChildren();
    if (!state.visible) return;

    for (const option of state.options) {
      // Phaser stroked the highlight centred on the rect path, so grow the
      // border-box by half the stroke to cover the same pixels.
      const inset = state.borderWidth / 2;
      const target = document.createElement("button");
      target.type = "button";
      target.className = "dead-hand-seats__target";
      target.setAttribute("aria-label", `Call the ${option.seat} hand dead`);
      Object.assign(target.style, {
        position: "absolute",
        boxSizing: "border-box",
        margin: "0",
        padding: "0",
        left: `${option.x - inset}px`,
        top: `${option.y - inset}px`,
        width: `${option.width + state.borderWidth}px`,
        height: `${option.height + state.borderWidth}px`,
        border: `${state.borderWidth}px solid #f6c542`,
        background: "rgb(185 42 144 / 22%)",
        cursor: "pointer",
      });

      const arrow = document.createElement("button");
      arrow.type = "button";
      arrow.className = "dead-hand-seats__arrow";
      arrow.tabIndex = -1;
      arrow.textContent = option.arrowIcon;
      arrow.setAttribute("aria-hidden", "true");
      Object.assign(arrow.style, {
        position: "absolute",
        margin: "0",
        padding: "0",
        border: "0",
        background: "none",
        left: `${option.arrowX}px`,
        top: `${option.arrowY}px`,
        transform: "translate(-50%, -50%)",
        color: "#ffffff",
        fontFamily: '"Material Symbols Rounded"',
        fontSize: `${state.arrowFontSize}px`,
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: "1",
        cursor: "pointer",
      });

      for (const element of [target, arrow]) {
        element.addEventListener("pointerdown", (event) => {
          event.stopPropagation();
          this.game?.events.emit("dead-hand:select-seat", option.seat);
        });
      }

      panel.append(target, arrow);
    }

    const instruction = document.createElement("div");
    instruction.className = "dead-hand-seats__instruction";
    instruction.textContent = state.instruction;
    Object.assign(instruction.style, {
      position: "absolute",
      margin: "0",
      left: `${state.centerX}px`,
      top: `${state.centerY}px`,
      transform: "translate(-50%, -50%)",
      textAlign: "center",
      whiteSpace: "pre-line",
      color: "#ffffff",
      fontFamily: "Poppins, Arial, sans-serif",
      fontSize: `${state.instructionFontSize}px`,
      fontWeight: "700",
      lineHeight: "1.25",
      pointerEvents: "none",
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "dead-hand-seats__cancel";
    cancel.textContent = "×";
    cancel.setAttribute("aria-label", "Cancel");
    Object.assign(cancel.style, {
      position: "absolute",
      margin: "0",
      padding: "0",
      border: "0",
      background: "none",
      left: `${state.centerX}px`,
      top: `${state.centerY - 54}px`,
      transform: "translate(-50%, -50%)",
      color: "#ffffff",
      fontFamily: "Poppins, Arial, sans-serif",
      fontSize: "30px",
      fontWeight: "500",
      lineHeight: "1",
      cursor: "pointer",
    });
    cancel.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      this.game?.events.emit("dead-hand:cancel");
    });

    panel.append(instruction, cancel);
  }

  private setRemovePlayerPopup(notice: PlayerAwayNotice | null): void {
    const panel = this.removePlayerPopupRef.nativeElement;
    panel.replaceChildren();
    panel.style.display = notice ? "grid" : "none";
    if (!notice) return;
    panel.style.position = "absolute";
    panel.style.inset = "0";
    panel.style.zIndex = "100";
    panel.style.placeItems = "center";
    panel.style.background = "rgb(7 20 47 / 38%)";
    const limit = notice.removeAfterMs ?? 120000;
    const elapsed = Math.max(0, Date.now() - notice.awaySinceMs);
    const remaining = Math.max(0, limit - elapsed);
    const format = (value: number): string => `${Math.floor(value / 60000)}:${String(Math.floor(value / 1000) % 60).padStart(2, "0")}`;

    // Built with createElement/textContent (never innerHTML) so a malicious
    // player display name can never inject markup into the popup.
    const card = document.createElement("section");
    Object.assign(card.style, { width: "min(420px, calc(100% - 32px))", padding: "24px", boxSizing: "border-box", border: "2px solid #B92A90", borderRadius: "14px", background: "#07142f", color: "#ffffff", textAlign: "center", fontFamily: "Outfit, Arial, sans-serif" });
    const heading = document.createElement("h2");
    heading.textContent = "REMOVE PLAYER?";
    Object.assign(heading.style, { margin: "0 0 12px", fontSize: "22px" });
    const detail = document.createElement("p");
    detail.textContent = `${notice.playerName} has been away for ${format(elapsed)}.`;
    detail.style.margin = "0 0 8px";
    const rule = document.createElement("small");
    rule.textContent = remaining === 0
      ? `The ${format(limit)} away limit has been reached.`
      : `Removal available in ${format(remaining)}.`;
    Object.assign(rule.style, { display: "block", marginBottom: "16px", color: "#f6c542" });
    const remove = document.createElement("button");
    remove.textContent = "REMOVE PLAYER";
    remove.disabled = remaining > 0;
    const keep = document.createElement("button");
    keep.textContent = "KEEP WAITING";
    for (const button of [remove, keep]) {
      Object.assign(button.style, { display: "block", minWidth: "150px", margin: "8px auto 0", padding: "9px 16px", border: "0", borderRadius: "8px", color: "#ffffff", fontFamily: "Outfit, Arial, sans-serif", fontWeight: "600" });
    }
    remove.style.background = COLOR_FUSHIA;
    keep.style.background = COLOR_GRAY;
    remove.addEventListener("click", () => this.zone.run(() => this.playerRemovalRequested.emit({ seat: notice.seat, requestId: notice.requestId })));
    keep.addEventListener("click", () => this.setRemovePlayerPopup(null));
    card.append(heading, detail, rule, remove, keep);
    panel.append(card);
  }

  /**
   * Native join-request popup. Keeping this outside Phaser makes its text and
   * controls sharp, responsive, and above the game table on every device.
   */
  private setJoinTablePopup(request: JoinTableRequest | null): void {
    this.clearJoinTablePopupTimer();
    const panel = this.joinTablePopupRef.nativeElement;
    panel.replaceChildren();
    panel.style.display = request ? "grid" : "none";
    panel.setAttribute("aria-hidden", String(!request));
    if (!request) return;

    Object.assign(panel.style, {
      position: "absolute", inset: "0", zIndex: "100", display: "grid",
      placeItems: "center", background: "rgb(7 20 47 / 38%)",
    });

    const card = document.createElement("section");
    Object.assign(card.style, {
      width: "min(380px, calc(100% - 32px))", padding: "24px",
      boxSizing: "border-box", border: `2px solid ${COLOR_FUSHIA}`,
      borderRadius: "14px", background: "#07142f", color: "#ffffff",
      textAlign: "center", fontFamily: "Outfit, Arial, sans-serif",
    });
    const title = document.createElement("h2");
    title.textContent = "JOIN TABLE REQUEST";
    Object.assign(title.style, { margin: "0 0 12px", fontSize: "22px" });
    const detail = document.createElement("p");
    detail.textContent = `${request.playerName} wants to join.`;
    detail.style.margin = "0 0 8px";
    const countdown = document.createElement("small");
    Object.assign(countdown.style, { display: "block", marginBottom: "16px", color: "#f6c542" });
    const accept = document.createElement("button");
    accept.textContent = "ACCEPT";
    const decline = document.createElement("button");
    decline.textContent = "DECLINE";
    for (const button of [accept, decline]) {
      Object.assign(button.style, {
        display: "block", minWidth: "150px", margin: "8px auto 0",
        padding: "9px 16px", border: "0", borderRadius: "8px", color: "#ffffff",
        fontFamily: "Outfit, Arial, sans-serif", fontWeight: "600", cursor: "pointer",
      });
    }
    accept.style.background = COLOR_FUSHIA;
    decline.style.background = COLOR_GRAY;
    const decide = (action: JoinTableRequestDecision["action"]): void => {
      this.zone.run(() => this.joinTableRequestDecision.emit({ requestId: request.requestId, action }));
      this.setJoinTablePopup(null);
    };
    accept.addEventListener("click", () => decide("accept"));
    decline.addEventListener("click", () => decide("decline"));
    card.append(title, detail, countdown, accept, decline);
    panel.append(card);

    const expiresAt = request.expiresAtMs ?? Date.now() + 15_000;
    const refreshCountdown = (): void => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      countdown.textContent = `${seconds} second${seconds === 1 ? "" : "s"} remaining`;
      if (seconds === 0) this.setJoinTablePopup(null);
    };
    this.joinTablePopupTimer = window.setInterval(refreshCountdown, 250);
    refreshCountdown();
  }

  /** Clears the one active join-request countdown; no render-loop work is used. */
  private clearJoinTablePopupTimer(): void {
    if (this.joinTablePopupTimer === undefined) return;
    window.clearInterval(this.joinTablePopupTimer);
    this.joinTablePopupTimer = undefined;
  }

  /**
   * Native Dead Hand claim dialog. Phaser retains the exposure highlights and
   * seat arrows; this overlay owns the readable reason-selection controls.
   */
  private setDeadHandPopup(targetSeat: Exclude<TableSeat, "bottom"> | null): void {
    const panel = this.deadHandPopupRef.nativeElement;
    panel.replaceChildren();
    panel.style.display = targetSeat ? "grid" : "none";
    panel.setAttribute("aria-hidden", String(!targetSeat));
    if (!targetSeat) return;

    Object.assign(panel.style, {
      position: "absolute", inset: "0", zIndex: "100", display: "grid",
      placeItems: "center", background: "rgb(7 20 47 / 38%)",
    });
    const labels: Record<Exclude<TableSeat, "bottom">, string> = {
      top: "PLAYER 1 (TOP)", right: "PLAYER 2 (RIGHT)", left: "PLAYER 3 (LEFT)",
    };
    const card = document.createElement("section");
    Object.assign(card.style, {
      width: "min(460px, calc(100% - 32px))", padding: "24px",
      boxSizing: "border-box", border: `2px solid ${COLOR_FUSHIA}`,
      borderRadius: "14px", background: "#07142f", color: "#ffffff",
      textAlign: "center", fontFamily: "Outfit, Arial, sans-serif",
    });
    const title = document.createElement("h2");
    title.textContent = `DECLARE ${labels[targetSeat]} DEAD`;
    Object.assign(title.style, { margin: "0 0 10px", fontSize: "22px" });
    const warning = document.createElement("small");
    warning.textContent = "An incorrect claim can make your hand dead.";
    Object.assign(warning.style, { display: "block", marginBottom: "16px", color: "#f6c542" });
    card.append(title, warning);

    let selectedReason: DeadHandReason = "invalid-mahjong";
    const reasonButtons: HTMLButtonElement[] = [];
    const setSelectedReason = (reason: DeadHandReason): void => {
      selectedReason = reason;
      for (const button of reasonButtons) {
        button.style.background = button.dataset["reason"] === reason ? COLOR_FUSHIA : COLOR_GRAY;
      }
    };
    const reasons: readonly { readonly id: DeadHandReason; readonly label: string }[] = [
      { id: "invalid-mahjong", label: "INVALID MAH JONGG" },
      { id: "hand-not-viable", label: "HAND NOT VIABLE" },
      { id: "incorrect-tile-count", label: "INCORRECT TILE COUNT" },
    ];
    for (const reason of reasons) {
      const button = document.createElement("button");
      button.dataset["reason"] = reason.id;
      button.textContent = reason.label;
      reasonButtons.push(button);
      button.addEventListener("click", () => setSelectedReason(reason.id));
      card.append(button);
    }
    const submit = document.createElement("button");
    submit.textContent = "SUBMIT CLAIM";
    const cancel = document.createElement("button");
    cancel.textContent = "CANCEL";
    for (const button of [...reasonButtons, submit, cancel]) {
      Object.assign(button.style, {
        display: "block", minWidth: "190px", margin: "8px auto 0",
        padding: "9px 16px", border: "0", borderRadius: "8px", color: "#ffffff",
        fontFamily: "Outfit, Arial, sans-serif", fontWeight: "600", cursor: "pointer",
      });
    }
    setSelectedReason(selectedReason);
    submit.style.background = COLOR_FUSHIA;
    cancel.style.background = COLOR_GRAY;
    submit.addEventListener("click", () => {
      this.zone.run(() => this.deadHandClaimed.emit({ targetSeat, reason: selectedReason }));
      this.setDeadHandPopup(null);
    });
    cancel.addEventListener("click", () => this.setDeadHandPopup(null));
    card.append(submit, cancel);
    panel.append(card);
  }

  /**
   * Native MAH JONGG win celebration popup. Phaser no longer renders the
   * overlay; the browser paints the card, confetti and all copy so the text
   * stays sharp at any device pixel ratio.
   */
  private setMahjongWinPopup(result: MahjongWinCelebration | null): void {
    this.clearMahjongWinPopupTimer();
    const panel = this.mahjongWinPopupRef.nativeElement;
    panel.replaceChildren();
    panel.style.display = result ? "grid" : "none";
    panel.setAttribute("aria-hidden", String(!result));

    this.setTableOverlayBlocked(result ? "screen" : "none");

    if (!result) return;

    // Tell Phaser so it can clear its call/swap windows if open
    this.game?.events.emit("mahjong:win", result);

    void this.haptics.play("pass-submit" as any);

    // Confetti
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const particleCount = Math.max(36, Math.min(88, Math.round(vw / 13)));
    const colors = ["#f6c542", "#B92A90", "#60a5fa", "#34d399", "#ffffff"];
    for (let i = 0; i < particleCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "mahjong-win-popup__confetti";
      const size = 5 + Math.random() * 5;
      const startX = Math.random() * vw;
      const startY = -(Math.random() * vh * 0.25);
      const startRotate = (Math.random() - 0.5) * 80;
      const endRotate = startRotate + 240 + Math.random() * 300;
      const duration = 1300 + Math.random() * 1100;
      const delay = Math.random() * 450;
      Object.assign(confetti.style, {
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${size}px`,
        height: `${Math.round(size * 0.55)}px`,
        background: colors[i % colors.length],
      });
      panel.append(confetti);

      confetti.animate(
        [
          { transform: `translateY(0px) rotate(${startRotate}deg)` },
          { transform: `translateY(${vh + 24 - startY}px) rotate(${endRotate}deg)` }
        ],
        {
          duration: Math.round(duration),
          delay: Math.round(delay),
          easing: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
          fill: "forwards",
        }
      );
    }

    // Card
    const card = document.createElement("div");
    card.className = "mahjong-win-popup__card";

    const title = document.createElement("div");
    title.className = "mahjong-win-popup__title";
    title.textContent = "MAH JONGG!";

    const winner = document.createElement("div");
    winner.className = "mahjong-win-popup__winner";
    winner.textContent = result.winner === "bottom" ? "YOU WIN!" : `${result.winner.toUpperCase()} WINS!`;

    const dismiss = document.createElement("div");
    dismiss.className = "mahjong-win-popup__dismiss";
    dismiss.textContent = "TAP TO CONTINUE";

    card.append(title, winner, dismiss);
    panel.append(card);

    panel.addEventListener("pointerup", () => this.setMahjongWinPopup(null), { once: true });

    this.mahjongWinPopupTimer = window.setTimeout(() => {
      this.mahjongWinPopupTimer = undefined;
      this.setMahjongWinPopup(null);
    }, 4200);
  }

  private clearMahjongWinPopupTimer(): void {
    if (this.mahjongWinPopupTimer === undefined) return;
    window.clearTimeout(this.mahjongWinPopupTimer);
    this.mahjongWinPopupTimer = undefined;
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
