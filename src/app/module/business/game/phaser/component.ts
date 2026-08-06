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
import { TileVm, PassDirection } from "../model/tile";
import { TableScene } from "./scenes/scene";
import { DeadHandClaim, DeadHandReason, DemoDiscardRequest, HeaderLogoLayoutState, JoinTableRequest, JoinTableRequestDecision, MahjongWinCelebration, MobileDrawerOverlayState, PlayerAwayNotice, PlayerLabelOverlayKey, PlayerLabelOverlayState, PlayerRemovalRequest, PointsOverlayState, TableSeat, TileCallDecision, TileCallOffer, WallCountOverlayState } from "./scenes/type";
import { TablePhase } from "../model/table-phase";
import { GameHapticsService, GameHapticType } from "../platform/haptics.service";
import { DeviceLayoutService } from "./device-layout.service";
import { COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY } from "./const";

@Component({
  selector: "app-phaser-board",
  standalone: true,
  template: `<div #host class="phaser-host"></div>
  <div #safeAreaProbe class="safe-area-probe" aria-hidden="true"></div>
  <div #wallCountOverlay class="hud-wall-count" aria-hidden="true"></div>
  <div #wallIconOverlay class="hud-wall-icon" aria-hidden="true">crop_2_3</div>
  <div #pointsOverlay class="hud-points" aria-hidden="true"></div>
  <div #pointsIconOverlay class="hud-points-icon" aria-hidden="true">database</div>
  <div #mobileDrawerOverlay class="mobile-drawer-overlay" aria-hidden="true"></div>
  <div #removePlayerPopup class="remove-player-popup" aria-hidden="true"></div>
  <div #joinTablePopup class="join-table-popup" aria-hidden="true"></div>
  <div #deadHandPopup class="dead-hand-popup" aria-hidden="true"></div>
  <div #topPlayerLabelOverlay class="hud-player-label" aria-hidden="true"></div>
  <div #rightPlayerLabelOverlay class="hud-player-label" aria-hidden="true"></div>
  <div #leftPlayerLabelOverlay class="hud-player-label" aria-hidden="true"></div>
  <div #bottomPlayerLabelOverlay class="hud-player-label" aria-hidden="true"></div>
  <img
    #headerLogo
    class="hud-logo"
    src="assets/majhfit-logo@2x.png"
    srcset="
      assets/majhfit-logo@1x.png 1x,
      assets/majhfit-logo@2x.png 2x,
      assets/majhfit-logo@3x.png 3x
    "
    alt="MAJHFIT"
    draggable="false"
  />
  `,
  styles: [
    `
       :host {
        display: block;
        position: relative;
        width: 100vw;
        height: 100dvh;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        background: #2f4d99;

        --safe-area-top: env(safe-area-inset-top, 0px);
        --safe-area-right: env(safe-area-inset-right, 0px);
        --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-left: env(safe-area-inset-left, 0px);
        --game-safe-top: env(safe-area-inset-top, 0px);
        --game-logo-top: 6px;
      }

      .phaser-host {
        width: 100%;
        height: 100%;
        overflow: hidden;
        touch-action: none;
      }

      /* Computed padding resolves iOS env() values reliably after rotation. */
      .safe-area-probe {
        position: fixed;
        inset: 0 auto auto 0;
        width: 0;
        height: 0;
        padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
          env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
        visibility: hidden;
        pointer-events: none;
      }

      /* Native DOM text stays sharp at every device pixel density. */
      .hud-wall-count {
        position: absolute;
        z-index: 30;
        display: none;
        pointer-events: none;
        white-space: nowrap;
        font-family: Poppins, Arial, sans-serif;
        font-weight: 500;
        line-height: 1;
        color: #264089;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }

      .hud-wall-icon {
        position: absolute;
        z-index: 30;
        display: none;
        pointer-events: none;
        font-family: "Material Symbols Rounded";
        font-weight: normal;
        font-style: normal;
        line-height: 1;
        color: #264089;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }

      .hud-points {
        position: absolute;
        z-index: 30;
        display: none;
        pointer-events: none;
        white-space: nowrap;
        font-family: Poppins, Arial, sans-serif;
        font-weight: 500;
        line-height: 1;
        color: #f8fafc;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }

      .hud-points-icon {
        position: absolute;
        z-index: 30;
        display: none;
        pointer-events: none;
        font-family: "Material Symbols Rounded";
        font-weight: normal;
        font-style: normal;
        line-height: 1;
        color: #d4d12a;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }

      .mobile-drawer-overlay { position:absolute; z-index:80; display:none; pointer-events:none; overflow:hidden; box-sizing:border-box; padding:14px 18px; border-radius:22px; background:#fff; box-shadow:0 8px 14px rgb(7 20 47 / 28%); color:#264089; font-family:Outfit,Arial,sans-serif; }
      .mobile-drawer-overlay__close { position:absolute; left:14px; top:7px; pointer-events:auto; color:#B92A90; font-size:32px; font-weight:700; line-height:1; }
      .mobile-drawer-overlay__title { font-size:20px; font-weight:700; margin-left:36px; margin-bottom:14px; }
      .mobile-drawer-overlay__item { color:#B92A90; font-size:16px; font-weight:600; line-height:1.55; white-space:nowrap; }
      .remove-player-popup { position:absolute; inset:0; z-index:100; place-items:center; background:rgb(7 20 47 / 38%); font-family:Outfit,Arial,sans-serif; }
      .remove-player-popup section { width:min(420px,calc(100% - 32px)); padding:24px; border:2px solid #B92A90; border-radius:14px; background:#07142f; color:#fff; text-align:center; box-sizing:border-box; }
      .remove-player-popup h2 { margin:0 0 12px; font-size:22px; } .remove-player-popup p { margin:0 0 8px; } .remove-player-popup small { display:block; margin-bottom:16px; color:#f6c542; } .remove-player-popup button { display:block; width:auto; min-width:150px; margin:8px auto 0; padding:9px 16px; border:0; border-radius:8px; background:#B92A90; color:#fff; font:600 15px Outfit,Arial,sans-serif; } .remove-player-popup button:last-child { background:#475569; } .remove-player-popup button:disabled { opacity:.55; }

      /* Phaser drawers must sit visually above the native sharp-text overlays. */
      :host(.mobile-drawer-open) .hud-wall-count,
      :host(.mobile-drawer-open) .hud-wall-icon,
      :host(.mobile-drawer-open) .hud-points,
      :host(.mobile-drawer-open) .hud-points-icon,
      :host(.mobile-drawer-open) .hud-player-label {
        display: none !important;
      }

      /* Native player labels remain sharp while Phaser owns layout. */
      .hud-player-label {
        position: absolute;
        z-index: 30;
        display: none;
        pointer-events: none;
        white-space: nowrap;
        font-family: Poppins, Arial, sans-serif;
        font-weight: 700;
        line-height: 1;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
        transform-origin: center center;
      }

      .hud-logo {
        position: absolute;
        z-index: 20;
        pointer-events: none;
        user-select: none;

        left: max(56px, calc(env(safe-area-inset-left, 0px) + 56px));
        top: var(--game-logo-top);

        /* The desktop/tablet HUD is at least 54px tall. */
        width: auto;
        height: 46px;

        image-rendering: auto;
        transform: translateZ(0);
        backface-visibility: hidden;
        transition: opacity 160ms ease, transform 160ms ease, visibility 160ms;
      }

      :host(.mobile-header-collapsed) .hud-logo {
        opacity: 0;
        visibility: hidden;
        transform: translateY(-12px) translateZ(0);
      }

      /* Compact mobile portrait */
      @media (max-width: 680px) and (orientation: portrait) {
        .hud-logo {
          /* 44px hamburger target + 6px edge pad + 8px visual gap. */
          left: max(58px, calc(env(safe-area-inset-left, 0px) + 58px));
          top: var(--game-logo-top);
          height: 32px;
        }
      }

      /* Small landscape phones */
      @media (max-height: 520px) and (orientation: landscape) {
        .hud-logo {
          left: max(58px, calc(env(safe-area-inset-left, 0px) + 58px));
          top: var(--game-logo-top);
          height: 28px;
        }
      }

    `,
  ],
})
export class PhaserBoardComponent implements AfterViewInit {
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

  @ViewChild("removePlayerPopup", { static: true })
  private readonly removePlayerPopupRef!: ElementRef<HTMLDivElement>;

  @ViewChild("joinTablePopup", { static: true })
  private readonly joinTablePopupRef!: ElementRef<HTMLDivElement>;

  @ViewChild("deadHandPopup", { static: true })
  private readonly deadHandPopupRef!: ElementRef<HTMLDivElement>;

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
  private readonly haptics = inject(GameHapticsService);

  private game?: Phaser.Game;
  private sceneReady = false;
  private safeAreaRefreshTimer?: number;
  private joinTablePopupTimer?: number;
  private mobileDrawerOpen = false;
  private wallCountOverlayState?: WallCountOverlayState;
  private pointsOverlayState?: PointsOverlayState;
  private playerLabelOverlayStates: readonly PlayerLabelOverlayState[] = [];

  readonly tablePhase = input<TablePhase>("playing");
  private readonly deviceLayout = inject(DeviceLayoutService);

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
      if (!result || !this.game || !this.sceneReady) return;
      // Phaser owns the visual effect; Angular only supplies the result.
      this.game.events.emit("mahjong:win", result);
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
      const scene = new TableScene({
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
        if (win) this.game?.events.emit("mahjong:win", win);
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
    panel.innerHTML = `<section><h2>REMOVE PLAYER?</h2><p>${notice.playerName} has been away for ${format(elapsed)}.</p><small>${remaining === 0 ? `The ${format(limit)} away limit has been reached.` : `Removal available in ${format(remaining)}.`}</small><button ${remaining > 0 ? "disabled" : ""}>REMOVE PLAYER</button><button>KEEP WAITING</button></section>`;
    const card = panel.querySelector("section") as HTMLElement;
    Object.assign(card.style, { width: "min(420px, calc(100% - 32px))", padding: "24px", boxSizing: "border-box", border: "2px solid #B92A90", borderRadius: "14px", background: "#07142f", color: "#ffffff", textAlign: "center", fontFamily: "Outfit, Arial, sans-serif" });
    const heading = card.querySelector("h2") as HTMLElement;
    Object.assign(heading.style, { margin: "0 0 12px", fontSize: "22px" });
    const detail = card.querySelector("p") as HTMLElement;
    detail.style.margin = "0 0 8px";
    const rule = card.querySelector("small") as HTMLElement;
    Object.assign(rule.style, { display: "block", marginBottom: "16px", color: "#f6c542" });
    const [remove, keep] = Array.from(panel.querySelectorAll("button")) as HTMLButtonElement[];
    for (const button of [remove, keep]) {
      Object.assign(button.style, { display: "block", minWidth: "150px", margin: "8px auto 0", padding: "9px 16px", border: "0", borderRadius: "8px", color: "#ffffff", fontFamily: "Outfit, Arial, sans-serif", fontWeight: "600" });
    }
    if (remove) remove.style.background = COLOR_FUSHIA;
    if (keep) keep.style.background = COLOR_GRAY;
    remove?.addEventListener("click", () => this.zone.run(() => this.playerRemovalRequested.emit({ seat: notice.seat, requestId: notice.requestId })));
    keep?.addEventListener("click", () => this.setRemovePlayerPopup(null));
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
