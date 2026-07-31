// src/app/game/scenes/table.scene.ts
import Phaser from "phaser";
import { GAME_TABLE_CONFIG } from "../game-table.config";
import { GameLayoutEngine } from "../game-layout.engine";
import { Point, Rect, SafeAreaInsets, TableLayout } from "../type";
import { PassDirection, TileVm } from "../../model/tile";
import { TileTextureResolver } from "../../tiles/tile-texture.resolver";
import { selectTileAtlas, TILE_ATLAS_1X_KEY, TILE_ATLAS_2X_KEY } from "../../tiles/tile-atlas.config";
import { PassAnimationItem } from "../models/pass-animation.model";
import { TablePhase } from "../../model/table-phase";
import type { GameHapticType } from "../../platform/haptics.service";
import { AnimationManager } from "./managers/animation";
import { PassFlowManager } from "./managers/pass-flow";
import { SoundManager } from "./managers/sound";
import { StateManager, type TableSeat, type TileRuntime } from "./managers/state";
import { TileInteractionManager } from "./managers/tile-interaction";
import { HudActionKey, UiLayoutManager, HamburgerMenuActionKey } from "./managers/ui-layout";
import {
  type ExposurePanelMode,
  exposureLipRatio,
  exposureNameStripRatio,
} from "../exposure-panel.tokens";
//import { AssetTextureLoader } from "../asset-texture.loader";


interface TableSceneCallbacks {
  readonly onSelectionChanged: (ids: readonly string[]) => void;
  readonly onPassCompleted: (payload: { readonly tileIds: readonly string[]; readonly direction: PassDirection }) => void;
  onHaptic?: (type: GameHapticType) => void;
}

interface SeatPassMove {
  readonly from: TableSeat;
  readonly to: TableSeat;
}

type TableSfxId =
  | "tile-select"
  | "tile-pass-waiting"
  | "tile-return"
  | "tile-drop"
  | "pass";

type TableSfxConfig = {
  key: string;
  urls: string[];
  volume: number;
  poolSize: number;
  throttleMs?: number;
};

interface DiscardGrid {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly gapX: number;
  readonly gapY: number;
  readonly columns: number;
}


type CharlestonVisualPhase =
  | "idle"
  | "selecting"
  | "bot-staging"
  | "committing";

interface CharlestonVisualTransfer {
  readonly from: TableSeat;
  readonly to: TableSeat;
  readonly includeBottom: boolean;
}

interface BotPassVisualTile {
  readonly id: string;
  readonly from: TableSeat;
  readonly to: TableSeat;
  readonly image: Phaser.GameObjects.Container;
}

export class TableScene extends Phaser.Scene {
  private readonly callbacks: TableSceneCallbacks;
  private readonly layoutEngine = new GameLayoutEngine();
  private readonly config = GAME_TABLE_CONFIG;

  // Manager skeletons; existing Scene logic remains the active implementation.
  private readonly tileInteractionManager: TileInteractionManager;
  private readonly passFlowManager: PassFlowManager;
  private readonly animationManager = new AnimationManager(this);
  //private readonly uiLayoutManager = new UiLayoutManager();
  private readonly uiLayoutManager: UiLayoutManager;
  private readonly soundManager: SoundManager;
  private readonly stateManager = new StateManager();

  private readonly logoTextureKey = "majhfit-logo";

  private readonly tileVoiceVolume = 0.85;

  private readonly tileVoiceKeys = [
    "1-bam",
    "2-bam",
    "3-bam",
    "4-bam",
    "5-bam",
    "6-bam",
    "7-bam",
    "8-bam",
    "9-bam",

    "1-crack",
    "2-crack",
    "3-crack",
    "4-crack",
    "5-crack",
    "6-crack",
    "7-crack",
    "8-crack",
    "9-crack",

    "1-dot",
    "2-dot",
    "3-dot",
    "4-dot",
    "5-dot",
    "6-dot",
    "7-dot",
    "8-dot",
    "9-dot",

    "east",
    "south",
    "west",
    "north",
    "red",
    "green",
    "soap",
    "joker",
    "flower",
  ] as const;

  private readonly tileVoiceSounds = new Map<string, Phaser.Sound.BaseSound>();
  private currentTileVoice?: Phaser.Sound.BaseSound;
  private lastTileVoiceAt = 0;

  //private assetLoader!: AssetTextureLoader;

  private get layout(): TableLayout {
    return this.stateManager.layout;
  }

  private set layout(value: TableLayout) {
    this.stateManager.layout = value;
  }
  

  private graphics!: Phaser.GameObjects.Graphics;
  private get hudTextObjects(): Phaser.GameObjects.Text[] { return this.uiLayoutManager.hudTextObjects; }
  private set hudTextObjects(value: Phaser.GameObjects.Text[]) { this.uiLayoutManager.hudTextObjects = value; }
  private get hudPointsIcon(): Phaser.GameObjects.Container | undefined { return this.uiLayoutManager.hudPointsIcon; }
  private set hudPointsIcon(value: Phaser.GameObjects.Container | undefined) { this.uiLayoutManager.hudPointsIcon = value; }
  private get hudBg(): Phaser.GameObjects.Rectangle | undefined { return this.uiLayoutManager.hudBg; }
  private set hudBg(value: Phaser.GameObjects.Rectangle | undefined) { this.uiLayoutManager.hudBg = value; }
  private get hudActionsContainer(): Phaser.GameObjects.Container | undefined { return this.uiLayoutManager.hudActionsContainer; }
  private set hudActionsContainer(value: Phaser.GameObjects.Container | undefined) { this.uiLayoutManager.hudActionsContainer = value; }
  private get hudActionIconTexts(): Phaser.GameObjects.Text[] { return this.uiLayoutManager.hudActionIconTexts; }
  private set hudActionIconTexts(value: Phaser.GameObjects.Text[]) { this.uiLayoutManager.hudActionIconTexts = value; }
  private get instructionText(): Phaser.GameObjects.Text | undefined { return this.uiLayoutManager.instructionText; }
  private set instructionText(value: Phaser.GameObjects.Text | undefined) { this.uiLayoutManager.instructionText = value; }
  private get passButton(): Phaser.GameObjects.Container | undefined { return this.uiLayoutManager.passButton; }
  private set passButton(value: Phaser.GameObjects.Container | undefined) { this.uiLayoutManager.passButton = value; }
  private get playerLabels(): Phaser.GameObjects.Text[] { return this.uiLayoutManager.playerLabels; }
  private set playerLabels(value: Phaser.GameObjects.Text[]) { this.uiLayoutManager.playerLabels = value; }
  private get usernameText(): Phaser.GameObjects.Text | undefined { return this.uiLayoutManager.usernameText; }
  private set usernameText(value: Phaser.GameObjects.Text | undefined) { this.uiLayoutManager.usernameText = value; }
  private get wallTileBox(): Phaser.GameObjects.Container | undefined { return this.uiLayoutManager.wallTileBox; }
  private set wallTileBox(value: Phaser.GameObjects.Container | undefined) { this.uiLayoutManager.wallTileBox = value; }
  private get wallTileCount(): number { return this.stateManager.wallTileCount; }
  private set wallTileCount(value: number) { this.stateManager.wallTileCount = value; }
  private get pickTargetSeat(): TableSeat { return this.stateManager.pickTargetSeat; }
  private set pickTargetSeat(value: TableSeat) { this.stateManager.pickTargetSeat = value; }
  private get pickSeatSelector(): Phaser.GameObjects.Container | undefined { return this.uiLayoutManager.pickSeatSelector; }
  private set pickSeatSelector(value: Phaser.GameObjects.Container | undefined) { this.uiLayoutManager.pickSeatSelector = value; }
  private get pickSeatButtons(): Phaser.GameObjects.Text[] { return this.uiLayoutManager.pickSeatButtons; }
  private set pickSeatButtons(value: Phaser.GameObjects.Text[]) { this.uiLayoutManager.pickSeatButtons = value; }
  private get isPickAnimating(): boolean { return this.stateManager.isPickAnimating; }
  private set isPickAnimating(value: boolean) { this.stateManager.isPickAnimating = value; }
  private get nextMockTileId(): number { return this.stateManager.nextMockTileId; }
  private set nextMockTileId(value: number) { this.stateManager.nextMockTileId = value; }

  private get rackTiles(): readonly TileVm[] { return this.stateManager.rackTiles; }
  private set rackTiles(value: readonly TileVm[]) { this.stateManager.rackTiles = value; }
  private get tileMap(): Map<string, TileRuntime> { return this.stateManager.tileMap; }
  private get selectedIds(): Set<string> { return this.stateManager.selectedIds; }
  private get rackOrder(): string[] { return this.stateManager.rackOrder; }
  private set rackOrder(value: string[]) { this.stateManager.rackOrder = value; }
  private get discardedTileIds(): string[] { return this.stateManager.discardedTileIds; }
  private get activeDragTile(): TileRuntime | undefined { return this.stateManager.activeDragTile; }
  private set activeDragTile(value: TileRuntime | undefined) { this.stateManager.activeDragTile = value; }
  private get dragPointerId(): number | undefined { return this.stateManager.dragPointerId; }
  private set dragPointerId(value: number | undefined) { this.stateManager.dragPointerId = value; }

  private renderDpr = 1;

  private get hudMenuOpen(): boolean { return this.uiLayoutManager.hudMenuOpen; }
  private set hudMenuOpen(value: boolean) { this.uiLayoutManager.hudMenuOpen = value; }
  private get hudMenuItems(): Phaser.GameObjects.Text[] { return this.uiLayoutManager.hudMenuItems; }
  private set hudMenuItems(value: Phaser.GameObjects.Text[]) { this.uiLayoutManager.hudMenuItems = value; }

  private readonly tileTextureResolver = new TileTextureResolver();
  private get dragStartByTileId(): Map<string, { x: number; y: number }> { return this.stateManager.dragStartByTileId; }
  private get dragThresholdPx(): number { return this.stateManager.dragThresholdPx; }
  private get suppressTapByTileId(): Set<string> { return this.stateManager.suppressTapByTileId; }
  private get passTrayClones(): Phaser.GameObjects.Image[] { return this.stateManager.passTrayClones; }
  private set passTrayClones(value: Phaser.GameObjects.Image[]) { this.stateManager.passTrayClones = value; }
  private get passAnimationClones(): Phaser.GameObjects.GameObject[] { return this.stateManager.passAnimationClones; }
  private set passAnimationClones(value: Phaser.GameObjects.GameObject[]) { this.stateManager.passAnimationClones = value; }
  private get passDirection(): PassDirection { return this.stateManager.passDirection; }
  private set passDirection(value: PassDirection) { this.stateManager.passDirection = value; }
  private get tablePhase(): TablePhase { return this.stateManager.tablePhase; }
  private set tablePhase(value: TablePhase) { this.stateManager.tablePhase = value; }
  private get currentPassDestination(): TableSeat { return this.stateManager.currentPassDestination; }
  private set currentPassDestination(value: TableSeat) { this.stateManager.currentPassDestination = value; }
  private get activeSeat(): TableSeat { return this.stateManager.activeSeat; }
  private set activeSeat(value: TableSeat) { this.stateManager.activeSeat = value; }
  private get passWaitingTileIds(): string[] { return this.stateManager.passWaitingTileIds; }
  private get passCloseButtons(): Map<string, Phaser.GameObjects.Container> { return this.stateManager.passCloseButtons; }
  private get passWaitingAreaGraphics(): Phaser.GameObjects.Graphics | undefined { return this.stateManager.passWaitingAreaGraphics; }
  private set passWaitingAreaGraphics(value: Phaser.GameObjects.Graphics | undefined) { this.stateManager.passWaitingAreaGraphics = value; }
  private get doubleTapMs(): number { return this.stateManager.doubleTapMs; }
  private get lastTapAtByTileId(): Map<string, number> { return this.stateManager.lastTapAtByTileId; }
  private get isPassAnimating(): boolean { return this.stateManager.isPassAnimating; }
  private set isPassAnimating(value: boolean) { this.stateManager.isPassAnimating = value; }
  private get passWaitingTileScale(): number { return this.stateManager.passWaitingTileScale; }
  private get passCloseButtonScale(): number { return this.stateManager.passCloseButtonScale; }
  private get activeRackAtlasKey(): string | undefined { return this.stateManager.activeRackAtlasKey; }
  private set activeRackAtlasKey(value: string | undefined) { this.stateManager.activeRackAtlasKey = value; }
  private get pendingAtlasRefresh(): boolean { return this.stateManager.pendingAtlasRefresh; }
  private set pendingAtlasRefresh(value: boolean) { this.stateManager.pendingAtlasRefresh = value; }

  /* private readonly sfxConfig: Record<TableSfxId, TableSfxConfig> = {
    "tile-select": {
      key: "sfx-tile-select",
      urls: ["assets/sounds/tile-select.mp3"],
      volume: 0.45,
      poolSize: 3,
      throttleMs: 35,
    },
    "tile-pass-waiting": {
      key: "sfx-tile-pass-waiting",
      urls: ["assets/sounds/tile-drop.mp3"],
      volume: 0.5,
      poolSize: 3,
      throttleMs: 35,
    },
    "tile-return": {
      key: "sfx-tile-return",
      urls: ["assets/sounds/tile-drop.mp3"],
      volume: 0.45,
      poolSize: 2,
      throttleMs: 45,
    },
    "tile-drop": {
      key: "sfx-tile-drop",
      urls: ["assets/sounds/tile-drop.mp3"],
      volume: 0.5,
      poolSize: 2,
      throttleMs: 45,
    },
    pass: {
      key: "sfx-pass",
      urls: ["assets/sounds/pass.mp3"],
      volume: 0.65,
      poolSize: 1,
      throttleMs: 150,
    },
  };

  private readonly sfxPools = new Map<TableSfxId, Phaser.Sound.BaseSound[]>();
  private readonly sfxPoolCursor = new Map<TableSfxId, number>();
  private readonly lastSfxAt = new Map<TableSfxId, number>();
  private sfxReady = false; */

  private safeAreaInsets: SafeAreaInsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  

  constructor(callbacks: TableSceneCallbacks) {
    super({ key: "table-scene" });
    this.callbacks = callbacks;

    this.uiLayoutManager = new UiLayoutManager({
      logoTextureKey: this.logoTextureKey,
      onHudAction: (action) => this.handleHudAction(action),
      onPrimaryAction: () => this.handlePrimaryAction(),
      onPickSeatChange: (seat) => {
        this.pickTargetSeat = seat;
        this.setActiveSeat(seat);
        this.updateInstructionText();
      },
      onHamburgerMenuAction: (action) => this.handleHamburgerMenuAction(action),
    });

    this.tileInteractionManager = new TileInteractionManager({
      canSelectTile: (runtime) => runtime.zone === "rack",
      canStartDrag: (runtime) => runtime.zone !== "pass",
      canDropTile: () => true,
      canDiscard: (runtime, x, y) =>
        this.tablePhase === "playing" && runtime.zone === "rack" && this.isInsidePlayableDiscardArea(x, y),
      canPass: (runtime, x, y) =>
        this.isPassingPhase() && runtime.zone === "rack" && this.isInsidePassWaitingArea(x, y),
      onTileSelected: () => undefined,
      onTileDropped: () => undefined,
      onDragFinished: () => undefined,
      requestAnimation: () => undefined,
    });
    this.soundManager = new SoundManager(this, callbacks.onHaptic);
    
    this.passFlowManager = new PassFlowManager(
      this.stateManager,
      this.animationManager,
      this.uiLayoutManager,
      {
        isPassPhaseAllowed: () => this.tablePhase === "passing",
        validateSubmission: () => this.passFlowManager.canSubmitPassWaitingTiles(),
        approveSubmission: () => !this.isPassAnimating,
        onPassCompleted: (payload) => this.callbacks.onPassCompleted(payload),
        notifyNetworking: () => undefined,
        emitExternalEvent: (event, payload) => this.game.events.emit(event, payload),
        requestPassUiUpdate: () => this.updatePassButtonState(),
      },
    );
  }

  create(): void {
    this.graphics = this.add.graphics();
    //this.assetLoader = new AssetTextureLoader(this);

    this.input.setTopOnly(true);

    this.input.dragDistanceThreshold = 4;
    this.input.dragTimeThreshold = 60;

    this.game.events.on("rack:set", this.setRack, this);
    this.game.events.on("pass:direction", this.setPassDirection, this);
    this.game.events.on("table:resize", this.resize, this);
    this.game.events.on("table:phase", this.setTablePhase, this);
    this.game.events.on("table:safe-area", this.setSafeAreaInsets, this);
    this.game.events.on("table:active-seat", this.setActiveSeat, this);
    /* this.game.events.on("table:resize", (width: number, height: number, dpr = 1) => {
      this.resize(width, height);
    }); */
    /**
     * Charleston animation completed.
     *
     * Apply the visual/game result.
     */
    this.game.events.on(
      "charleston:animation-complete",
      () => {
          //this.applyPassResult();
      }
    );

    this.resize(this.scale.width, this.scale.height);
    this.createStaticUi();

    this.game.events.emit("table:ready");

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      console.log("Table scene shutdown");
      this.game.events.off("rack:set", this.setRack, this);
      this.game.events.off("pass:direction", this.setPassDirection, this);
      this.game.events.off("table:resize", this.resize, this);
      this.game.events.off("table:phase", this.setTablePhase, this);
      this.game.events.off("table:safe-area", this.setSafeAreaInsets, this);
      this.game.events.off("table:active-seat", this.setActiveSeat, this);

      
      this.soundManager.destroy();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.soundManager.destroy();
    });

    this.soundManager.create();
  
  }
  public preload(): void {
    this.soundManager.preload();
    // Phaser's Loader.image accepts (key, url) or ImageFileConfig without a 'config' property.
    // Remove unsupported 'config' object and load the image by key and url.
    if (!this.textures.exists(this.logoTextureKey)) {
      this.load.image(
        this.logoTextureKey,
        "assets/majhfit-logo-blue@3x.png",
      );
    }

    /* if (!this.textures.exists(this.logoTextureKey)) {
      this.load.svg(
        this.logoTextureKey,
        "assets/Logo_white.svg",
        {
          width: 360,
          height: 110,
        },
      );
    } */
  }

  private setSafeAreaInsets(insets: SafeAreaInsets): void {
    this.safeAreaInsets = insets;
  }
  private playTileDiscardVoice(vm: TileVm): void {
    this.soundManager.playTileDiscardVoice(vm);
  }
  private playWebFallback(type: GameHapticType): void {
    this.soundManager.playWebFallback(type);
  }

  private handleHamburgerMenuAction(action: HamburgerMenuActionKey): void {
    switch (action) {
      case "gameplay-settings":
        // open gameplay settings
        return;
      case "play-history":
        // open play history
        return;
      case "account-billing":
        // open account/billing
        return;
      case "restart-game":
        // restart flow
        return;
      case "quit-exit":
        // quit/exit flow
        return;
      case "log-out":
        // logout flow
        return;
    }
  }
  private handlePrimaryAction(): void {
    if (this.tablePhase === "playing") {
      this.playHaptic("pick");
      this.pickTileForSeat(this.pickTargetSeat);
      return;
    }

    if (!this.canSubmitPassWaitingTiles()) return;
    if (this.isPassAnimating) return;

    this.playHaptic("pass-submit");
    this.submitPassWaitingTiles();
  }

  private handleHudAction(action: HudActionKey): void {
    if (action === "sort") {
      this.sortRackTilesForDebug();
      return;
    }

    if (action === "hint") {
      // TODO: connect hint engine.
      return;
    }

    if (action === "dead-hand") {
      // TODO: connect dead-hand flow.
      return;
    }

    if (action === "settings") {
      // Menu open/close is owned by UiLayoutManager.
      return;
    }

    if (action === "help") {
      // TODO: open help UI.
      return;
    }
  }
  private sortRackTilesForDebug(): void {
    if (this.rackOrder.length <= 1) return;

    const tileRank = (tileId: string): number => {
      const runtime = this.tileMap.get(tileId);
      if (!runtime) return 9999;

      const soundKey = runtime.vm.soundKey ?? "";
      const rank = Number.parseInt(soundKey, 10) || 0;

      if (runtime.vm.suit === "dot") return 100 + rank;
      if (runtime.vm.suit === "bam") return 200 + rank;
      if (runtime.vm.suit === "char") return 300 + rank;
      if (runtime.vm.suit === "flower") return 800;
      if (runtime.vm.suit === "joker") return 900;

      return 9999;
    };

    this.rackOrder.sort((a, b) => tileRank(a) - tileRank(b));
    this.reindexRackRuntimeSlots();
    this.layoutRackTiles(true);
  }
  public setTablePhase(phase: TablePhase): void {
    if (this.tablePhase === phase) {
      return;
    }

    this.tablePhase = phase;
    console.log("setTablePhase", phase);

    this.updatePhaseUi();
  }
  public setActiveSeat(seat: TableSeat): void {
    if (this.activeSeat === seat) {
      return;
    }

    this.activeSeat = seat;

    if (this.layout && this.graphics) {
      this.drawTable();
      this.layoutStaticUi();
    }
  }
  private updatePhaseUi(): void {
    this.updateInstructionText();
    this.updatePassButtonState();
    this.layoutPickSeatSelector();

    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
  }
  private isPassingPhase(): boolean {
    return this.passFlowManager.isPassingPhase();
  }
  private resize(width: number, height: number): void {
    this.renderDpr = 1;

    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);

    this.layout = this.layoutEngine.compute(
      width,
      height,
      //this.rackTiles.length || 14,
      this.activeRackLayoutTileCount(),
      this.config,
      this.safeAreaInsets,
    );

    this.drawTable();
    this.layoutStaticUi();
    this.layoutRackTiles(false);
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
    this.updatePassButtonState();

    this.refreshRackTexturesIfAtlasChanged();
  }

  private activeRackLayoutTileCount(): number {
    /**
     * Use rackOrder, not rackTiles.
     *
     * rackTiles contains all known tile VMs, including discarded tiles.
     * rackOrder contains only tiles currently in the player's rack.
     *
     * Keep minimum 14 so the rack/discard tile size does not shrink/grow
     * when the hand temporarily has fewer tiles after discarding.
     */
    return Math.max(14, this.rackOrder.length);
  }
  private resizeW(width: number, height: number): void {
    this.renderDpr = 1;

    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);

    this.layout = this.layoutEngine.compute(width, height, this.rackTiles.length || 14, this.config);

    this.drawTable();
    this.layoutStaticUi();
    this.layoutRackTiles(false);

    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
    this.updatePassButtonState();
  }
  

  private setPassDirection(direction: PassDirection): void {
    this.passFlowManager.setPassDirection(direction);

    console.log("[TableScene] pass direction received:", {
      direction: this.passDirection,
      destination: this.currentPassDestination,
    });

    this.updateInstructionText();
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
    this.updatePassButtonState();
  }

  private setRack(tiles: readonly TileVm[]): void {
    //this.validateTiles(tiles);
    this.rackTiles = [...tiles];

    const needs1xAtlas = !this.textures.exists(TILE_ATLAS_1X_KEY);
    const needs2xAtlas = !this.textures.exists(TILE_ATLAS_2X_KEY);

    if (!needs1xAtlas && !needs2xAtlas) {
      this.reconcileRackTiles();
      const tileWidth = Math.round(this.layout.bottomTileLayout.width);
      this.activeRackAtlasKey = selectTileAtlas(tileWidth).atlasKey;
      return;
    }

    this.load.once("loaderror", (file: Phaser.Loader.File) => {
      console.error("[PHASER LOAD ERROR]", file.key, file.src);
    });

    if (needs1xAtlas) {
      this.load.atlas(
        TILE_ATLAS_1X_KEY,
        "assets/game/tiles/1xnew/tiles_1x.png",
        "assets/game/tiles/1xnew/tiles_1x.json",
      );
    }

    if (needs2xAtlas) {
      this.load.atlas(
        TILE_ATLAS_2X_KEY,
        "assets/game/tiles/2xnew/tiles_2x.png",
        "assets/game/tiles/2xnew/tiles_2x.json",
      );
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.reconcileRackTiles();
      const tileWidth = Math.round(this.layout.bottomTileLayout.width);
      this.activeRackAtlasKey = selectTileAtlas(tileWidth).atlasKey;
    });

    if (!this.load.isLoading()) {
      this.load.start();
    }
  }
 

  private reconcileRackTiles(): void {
    const incomingIds = new Set(this.rackTiles.map((tile) => tile.id));

    for (const [id, runtime] of this.tileMap.entries()) {
      if (!incomingIds.has(id)) {
        runtime.image.destroy();
        this.tileMap.delete(id);
        this.selectedIds.delete(id);
        this.removeFromRackOrder(id);
        this.removeFromDiscardOrder(id);
      }
    }

    for (const tile of this.rackTiles) {
      if (!this.rackOrder.includes(tile.id) && !this.discardedTileIds.includes(tile.id)) {
        this.rackOrder.push(tile.id);
      }

      if (this.tileMap.has(tile.id)) continue;

      const tileWidth = Math.round(this.layout.bottomTileLayout.width);
      const tileHeight = Math.round(this.layout.bottomTileLayout.height);
      const texture = this.tileTextureResolver.resolve(tile, tileWidth);

      if (!this.textures.exists(texture.atlasKey)) {
        console.error("[TILE ATLAS MISSING]", texture.atlasKey, tile);
        continue;
      }

      if (!this.textures.get(texture.atlasKey).has(texture.frameKey)) {
        console.error("[TILE FRAME MISSING]", texture.atlasKey, texture.frameKey, tile);
        continue;
      }

      const image = this.add.image(0, 0, texture.atlasKey, texture.frameKey);
      image.setOrigin(0.5);
      image.setDisplaySize(tileWidth, tileHeight);
      this.applyTileTextureFilter(image);


      const runtime: TileRuntime = {
        vm: tile,
        image,
        slotIndex: this.rackOrder.indexOf(tile.id),
        selected: false,
        isDragging: false,
        zone: "rack",
      };

      this.tileMap.set(tile.id, runtime);
      this.registerTileInput(runtime);
    }

    this.reindexRackRuntimeSlots();
    this.selectedIds.clear();
    this.callbacks.onSelectionChanged([]);
    this.resize(this.scale.width, this.scale.height);
  }
  private refreshRackTileTextures(): void {
    const tileWidth = Math.round(this.layout.bottomTileLayout.width);

    for (const tileId of this.rackOrder) {
      const runtime = this.tileMap.get(tileId);
      if (!runtime) continue;
      if (runtime.zone !== "rack") continue;

      const texture = this.tileTextureResolver.resolve(runtime.vm, tileWidth);

      if (!this.textures.exists(texture.atlasKey)) {
        continue;
      }

      if (!this.textures.get(texture.atlasKey).has(texture.frameKey)) {
        console.error("[TILE FRAME MISSING]", texture.atlasKey, texture.frameKey, runtime.vm);
        continue;
      }

      runtime.image.setTexture(texture.atlasKey, texture.frameKey);
    }
  }
  private refreshRackTexturesIfAtlasChanged(): void {
    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const atlas = selectTileAtlas(tileWidth);

    if (this.activeRackAtlasKey === atlas.atlasKey) {
      return;
    }

    this.ensureTileAtlasLoaded(() => {
      this.activeRackAtlasKey = atlas.atlasKey;
      this.refreshRackTileTextures();
      this.layoutRackTiles(false);
      this.layoutPassWaitingArea();
      this.layoutPassWaitingTiles(false);
      this.updatePassButtonState();
    });
  }

  private ensureTileAtlasLoaded(onReady: () => void): void {
    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const atlas = selectTileAtlas(tileWidth);

    if (this.textures.exists(atlas.atlasKey)) {
      onReady();
      return;
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      onReady();
    });

    if (atlas.atlasKey === TILE_ATLAS_1X_KEY) {
      this.load.atlas(
        TILE_ATLAS_1X_KEY,
        "assets/game/tiles/1xnew/tiles_1x.png",
        "assets/game/tiles/1xnew/tiles_1x.json",
      );
    }

    if (atlas.atlasKey === TILE_ATLAS_2X_KEY) {
      this.load.atlas(
        TILE_ATLAS_2X_KEY,
        "assets/game/tiles/2xnew/tiles_2x.png",
        "assets/game/tiles/2xnew/tiles_2x.json",
      );
    }

    if (!this.load.isLoading()) {
      this.load.start();
    }
  }

  private removeFromRackOrder(tileId: string): void {
    this.rackOrder = this.rackOrder.filter((id) => id !== tileId);
  }

  private removeFromDiscardOrder(tileId: string): void {
    const index = this.discardedTileIds.indexOf(tileId);
    if (index >= 0) this.discardedTileIds.splice(index, 1);
  }

  private reindexRackRuntimeSlots(): void {
    this.rackOrder.forEach((id, index) => {
      const runtime = this.tileMap.get(id);
      if (runtime) runtime.slotIndex = index;
    });
  }

  private moveRackTileToIndex(tileId: string, targetIndex: number): void {
    this.removeFromRackOrder(tileId);

    const safeIndex = Phaser.Math.Clamp(targetIndex, 0, this.rackOrder.length);
    this.rackOrder.splice(safeIndex, 0, tileId);

    this.reindexRackRuntimeSlots();
  }

  private registerTileInput(runtime: TileRuntime): void {
    runtime.image.setInteractive({
      useHandCursor: true,
      draggable: true,
      pixelPerfect: false,
    });

    this.input.setDraggable(runtime.image);

    this.tileInteractionManager.onPointerDown(runtime.image, (pointer: Phaser.Input.Pointer) => {
      /**
       * PASS TILE TAP
       *
       * Keep this behavior identical to the close button.
       * Close button uses pointerdown, so pass tile image should also use pointerdown.
       *
       * This must happen before drag setup and before suppressTap logic.
       */
      if (runtime.zone === "pass") {
        pointer.event?.stopPropagation?.();
        this.playHaptic("tile-return");
        this.returnPassTileToRack(runtime.vm.id);
        return;
      }

      this.activeDragTile = runtime;
      this.suppressTapByTileId.delete(runtime.vm.id);

      this.tileInteractionManager.beginPointer(runtime.vm.id, pointer);

      runtime.isDragging = false;
      runtime.image.setDepth(100);
    });

    this.tileInteractionManager.onDragStart(runtime.image, () => {
      runtime.image.setDepth(100);
    });

    this.tileInteractionManager.onDrag(runtime.image, (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (
        !runtime.isDragging &&
        !this.tileInteractionManager.hasReachedDragThreshold(
          runtime.vm.id,
          pointer,
          this.dragThresholdPx,
        )
      ) return;

      if (!runtime.isDragging) {
        runtime.isDragging = true;

        runtime.selected = false;
        this.selectedIds.delete(runtime.vm.id);
        runtime.image.clearTint();

        this.callbacks.onSelectionChanged([...this.selectedIds]);
      }

      runtime.image.setPosition(Math.round(dragX), Math.round(dragY));

     if (runtime.zone === "rack") {
        const isPassingDropTarget =
          this.tablePhase === "passing" &&
          (
            this.isInsidePassWaitingArea(pointer.worldX, pointer.worldY) ||
            this.isInsidePlayableDiscardArea(pointer.worldX, pointer.worldY)
          );

        /**
         * During PASSING phase, pass/drop targets still win.
         * So dragging into pass waiting area or playable discard area
         * should not reorder the rack.
         */
        if (isPassingDropTarget) {
          return;
        }

        /**
         * Rack rearrange should work in both:
         * - passing phase
         * - playing phase
         */
        if (this.isInsideRackArea(pointer.worldX, pointer.worldY)) {
          const newIndex = this.rackIndexFromDragX(runtime.vm.id, pointer.worldX);
          const currentIndex = this.rackOrder.indexOf(runtime.vm.id);

          if (newIndex !== currentIndex && newIndex >= 0) {
            this.moveRackTileToIndex(runtime.vm.id, newIndex);
            this.layoutRackTiles(true);
            runtime.image.setDepth(100);
          }
        }
      }
    });

    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
      this.tileInteractionManager.handleDrop(runtime, pointer, () => {
        runtime.image.setDepth(30);

        if (!runtime.isDragging) {
          this.returnTileToSlot(runtime);
          return;
        }

        this.suppressTapByTileId.add(runtime.vm.id);
        runtime.isDragging = false;
     
      if (
          this.tablePhase === "passing" &&
          runtime.zone === "rack" &&
          (
            this.isInsidePassWaitingArea(pointer.worldX, pointer.worldY) ||
            this.isInsidePlayableDiscardArea(pointer.worldX, pointer.worldY)
          )
        ) {
          this.tileInteractionManager.cleanupDrop(runtime.vm.id);
          this.snapTileToPassWaiting(runtime);
          return;
        }

        if (
          this.tablePhase !== "passing" &&
          this.isInsidePlayableDiscardArea(pointer.worldX, pointer.worldY)
        ) {
          this.tileInteractionManager.cleanupDrop(runtime.vm.id);
          this.snapTileToDiscard(runtime);
          return;
        }

          this.tileInteractionManager.cleanupDrop(runtime.vm.id);
          this.returnTileToSlot(runtime);
        });
    });

    this.tileInteractionManager.onPointerUp(runtime.image, () => {
      this.activeDragTile = undefined;

      const shouldSuppressTap = this.suppressTapByTileId.delete(runtime.vm.id);
      this.tileInteractionManager.finishPointer(runtime.vm.id);

      if (shouldSuppressTap) return;
      if (runtime.isDragging) return;

      /**
       * Discarded tiles are final.
       * No tap, no select, no return to rack.
       */
      if (runtime.zone === "discard") return;

      /**
       * Pass tile return remains handled in pointerdown.
       */
      if (runtime.zone !== "rack") return;

      const now = this.time.now;
      const previous = this.lastTapAtByTileId.get(runtime.vm.id) ?? 0;
      const isDoubleTap = now - previous <= this.doubleTapMs;

      this.lastTapAtByTileId.set(runtime.vm.id, now);

      /**
       * Single tap/click on rack tile intentionally does nothing.
       */
      if (!isDoubleTap) return;

      if (this.tablePhase === "passing") {
        this.playHaptic("tile-tap");
        this.snapTileToPassWaiting(runtime);
        return;
      }

      if (this.tablePhase === "playing") {
        runtime.selected = false;
        this.selectedIds.delete(runtime.vm.id);
        runtime.image.clearTint();

        //this.playHaptic("tile-tap");
        this.snapTileToDiscard(runtime);
      }
    });
  }
  private toggleTile(runtime: TileRuntime): void {
    this.tileInteractionManager.toggleSelection(
      runtime,
      this.selectedIds,
      (tile, selecting) =>
        tile.zone === "rack" && (!selecting || this.selectedIds.size < 3),
      (tile) => this.applyTileSelection(tile),
      () => {
        this.playSfx("tile-select");
        this.callbacks.onSelectionChanged([...this.selectedIds]);
      },
    );
  }

  private applyTileSelection(runtime: TileRuntime): void {
    const slot = this.slotFor(runtime);
    const selectedOffset = runtime.selected ? -this.layout.bottomTileLayout.height * 0.18 : 0;

    this.animationManager.animateRackTileSelection(
      runtime.image,
      slot.x,
      slot.y + selectedOffset,
    );

    if (runtime.selected) {
      runtime.image.setTint(0xe4f22c);
    } else {
      runtime.image.clearTint();
    }
  }
// 
  private returnTileToSlot(runtime: TileRuntime): void {
    runtime.zone = "rack";

    if (!this.rackOrder.includes(runtime.vm.id)) {
      this.rackOrder.push(runtime.vm.id);
      this.reindexRackRuntimeSlots();
    }

    const slot = this.slotFor(runtime);
    const selectedOffset = runtime.selected
      ? -this.layout.bottomTileLayout.height * 0.18
      : 0;

    this.animationManager.animateRackTileReturn(
      runtime.image,
      Math.round(slot.x),
      Math.round(slot.y + selectedOffset),
      this.config.animation.dragReturnMs,
    );
  }

  /**
   * First Charleston RIGHT pass animation.
   *
   * Required flow:
   * bottom -> right
   * right  -> top
   * top    -> left
   * left   -> bottom
   */
  private playRightCharlestonRound(
    selectedBottomTileIds: readonly string[],
    onFinished: () => void,
  ): void {
    this.destroyPassAnimationClones();

    const moves: readonly SeatPassMove[] = [
      { from: "bottom", to: "right" },
      { from: "right", to: "top" },
      { from: "top", to: "left" },
      { from: "left", to: "bottom" },
    ];

    let completed = 0;

    const finishOne = (): void => {
      completed++;

      if (completed === moves.length) {
        onFinished();
      }
    };

    for (const move of moves) {
      if (move.from === "bottom") {
        this.animateSelectedRackTilesToSeat(selectedBottomTileIds, move.to, finishOne);
      } else {
        this.animatePlaceholderPassGroup(move.from, move.to, 3, finishOne);
      }
    }
  }

  /**
   * Animates the real selected bottom rack tile faces to the destination pass area.
   *
   * We animate clones, not the original rack sprites.
   * This keeps drag/drop/rack ordering safe during the pass animation.
   */
  private animateSelectedRackTilesToSeat(
    ids: readonly string[],
    destination: TableSeat,
    onFinished: () => void,
  ): void {
    const targets = this.passAreaTargets(destination, ids.length);
    let completed = 0;

    ids.forEach((id, index) => {
      const runtime = this.tileMap.get(id);

      if (!runtime) {
        completed++;
        if (completed === ids.length) onFinished();
        return;
      }

      runtime.image.disableInteractive();
      runtime.image.clearTint();
      runtime.image.setAlpha(0.3);

      const clone = this.add.image(
        runtime.image.x,
        runtime.image.y,
        runtime.image.texture.key,
        runtime.image.frame.name,
      );

      clone
        .setOrigin(0.5)
        .setDisplaySize(
          Math.round(this.layout.bottomTileLayout.width),
          Math.round(this.layout.bottomTileLayout.height),
        )
        .setDepth(180);

      this.passAnimationClones.push(clone);

      this.tweens.add({
        targets: clone,
        x: targets[index].x,
        y: targets[index].y,
        angle: 0,
        alpha: 1,
        duration: 520,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          completed++;

          if (completed === ids.length) {
            onFinished();
          }
        },
      });
    });
  }

  /**
   * Animates remote players' pass groups using temporary white placeholders.
   *
   * Later, when remote player tile data exists, this can use real tile faces too.
   */
  private animatePlaceholderPassGroup(
    from: TableSeat,
    to: TableSeat,
    count: number,
    onFinished: () => void,
  ): void {
    const startTargets = this.passAreaTargets(from, count);
    const endTargets = this.passAreaTargets(to, count);

    const group = this.add.container(0, 0).setDepth(170);
    this.passAnimationClones.push(group);

    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);

    const children: Phaser.GameObjects.Rectangle[] = [];

    for (let index = 0; index < count; index++) {
      const tile = this.add.rectangle(
        startTargets[index].x,
        startTargets[index].y,
        tileWidth,
        tileHeight,
        0xffffff,
        1,
      );

      tile.setStrokeStyle(2, 0xd9d9d9, 1);
      tile.setOrigin(0.5);

      children.push(tile);
      group.add(tile);
    }

    let completed = 0;

    children.forEach((tile, index) => {
      this.tweens.add({
        targets: tile,
        x: endTargets[index].x,
        y: endTargets[index].y,
        duration: 520,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          completed++;

          if (completed === children.length) {
            onFinished();
          }
        },
      });
    });
  }
  /**
   * Applies local debug pass result after animation.
   *
   * Production version should replace rack from server payload instead.
   */
  private applyPassResult(ids: readonly string[]): void {
    ids.forEach((id) => {
      const runtime = this.tileMap.get(id);
      if (!runtime) return;

      runtime.image.destroy();
      this.tileMap.delete(id);
    });

    this.rackTiles = this.rackTiles.filter((tile) => !ids.includes(tile.id));
    this.selectedIds.clear();

    this.destroyPassAnimationClones();

    this.callbacks.onSelectionChanged([]);
    this.callbacks.onPassCompleted({
      tileIds: ids,
      direction: this.passDirection,
    });

    this.isPassAnimating = false;

    this.resize(this.scale.width, this.scale.height);
  }

  /**
   * Removes all temporary pass animation objects.
   */
  private destroyPassAnimationClones(): void {
    this.passAnimationClones.forEach((item) => item.destroy());
    this.passAnimationClones = [];
  }
  // Instead of Moves actual selected rack tile images into the bottom player's pass tray. We have to move that tile to the  which seat we have to pass front of the exposure meald
  /**
   * Moves actual selected rack tile images into the bottom player's pass tray.
   *
   * These are visual clones, not real rack state changes.
   * The real rack is updated only after Charleston animation completes.
   */
  private moveSelectedTilesToPassTray(
    ids: readonly string[],
    onFinished: () => void,
  ): void {
    this.destroyPassTrayClones();

    const trayTargets = this.bottomPassTrayTargets(ids.length);
    let completed = 0;

    ids.forEach((id, index) => {
      const runtime = this.tileMap.get(id);
      if (!runtime) {
        completed++;
        if (completed === ids.length) onFinished();
        return;
      }

      runtime.image.disableInteractive();
      runtime.image.clearTint();
      runtime.image.setAlpha(0.35);

      const clone = this.add.image(
        runtime.image.x,
        runtime.image.y,
        runtime.image.texture.key,
        runtime.image.frame.name,
      );

      clone
        .setOrigin(0.5)
        .setDisplaySize(
          Math.round(this.layout.bottomTileLayout.width),
          Math.round(this.layout.bottomTileLayout.height),
        )
        .setDepth(180);

      this.passTrayClones.push(clone);

      this.tweens.add({
        targets: clone,
        x: trayTargets[index].x,
        y: trayTargets[index].y,
        angle: 0,
        duration: 260,
        ease: "Sine.easeOut",
        onComplete: () => {
          completed++;
          if (completed === ids.length) onFinished();
        },
      });
    });
  }

  /**
   * Bottom player pass tray position.
   * Tray appears to the right side of the local/bottom seat.
   */
  private bottomPassTrayTargets(count: number): readonly Point[] {
    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);
    const overlap = tileWidth * 0.72;

    const startX =
      this.layout.bottomExposure.x +
      this.layout.bottomExposure.width -
      tileWidth * 0.8 -
      overlap * (count - 1);

    const y =
      this.layout.bottomExposure.y +
      this.layout.bottomExposure.height / 2;

    return Array.from({ length: count }, (_, index) => ({
      x: Math.round(startX + index * overlap),
      y: Math.round(y),
    }));
  }

  /**
   * Animates local bottom pass tray to destination seat.
   *
   * Current debug direction:
   * bottom -> left
   */
  private animatePassTrayToSeat(
    destination: "top" | "right" | "bottom" | "left",
    onFinished: () => void,
  ): void {
    if (!this.passTrayClones.length) {
      onFinished();
      return;
    }

    const targets = this.passTraySeatTargets(destination, this.passTrayClones.length);
    let completed = 0;

    this.passTrayClones.forEach((clone, index) => {
      this.tweens.add({
        targets: clone,
        x: targets[index].x,
        y: targets[index].y,
        alpha: 0.9,
        duration: 650,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          completed++;
          if (completed === this.passTrayClones.length) {
            onFinished();
          }
        },
      });
    });
  }

  /**
   * Destination tray positions for Charleston transfer animation.
   */
  private passTraySeatTargets(
    seat: "top" | "right" | "bottom" | "left",
    count: number,
  ): readonly Point[] {
    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);
    const overlap = tileWidth * 0.72;

    if (seat === "left") {
      const x = this.layout.leftExposure.x + this.layout.leftExposure.width + tileWidth * 0.65;
      const startY =
        this.layout.leftExposure.y +
        this.layout.leftExposure.height / 2 -
        overlap * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * overlap),
      }));
    }

    if (seat === "right") {
      const x = this.layout.rightExposure.x - tileWidth * 0.65;
      const startY =
        this.layout.rightExposure.y +
        this.layout.rightExposure.height / 2 -
        overlap * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * overlap),
      }));
    }

    if (seat === "top") {
      const startX =
        this.layout.topExposure.x +
        this.layout.topExposure.width / 2 -
        overlap * (count - 1) / 2;

      const y = this.layout.topExposure.y + this.layout.topExposure.height + tileHeight * 0.65;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(startX + index * overlap),
        y: Math.round(y),
      }));
    }

    return this.bottomPassTrayTargets(count);
  }
  /**
   * Clears temporary pass tray clone images.
   */
  private destroyPassTrayClones(): void {
    this.passTrayClones.forEach((clone) => clone.destroy());
    this.passTrayClones = [];
  }
  /**
  * -------------------------------------------------------------------------
  * Animates the local player's selected tiles.
  *
  * These tiles visually leave the rack.
  *
  * No game state is modified here.
  * -------------------------------------------------------------------------
  */
  private animatePassedTiles(
    ids: readonly string[],
    onFinished: () => void,
  ): void {

    const targets = this.passTargets(ids.length);
    let completed = 0;

    ids.forEach((id, index) => {
      const runtime = this.tileMap.get(id);
      if (!runtime) {
        completed++;
        if (completed === ids.length) {
          onFinished();
        }
        return;
      }

      runtime.image.disableInteractive();
      runtime.image.clearTint();
      runtime.image.setDepth(120);

      this.tweens.killTweensOf(runtime.image);

      this.tweens.add({
        targets: runtime.image,
        x: targets[index].x,
        y: targets[index].y,
        angle: 0,
        scale: 0.78,
        alpha: 0.92,
        duration: this.config.animation.passDurationMs,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          completed++;
          if (completed === ids.length) {
            onFinished();
          }
        }
      });
    });
  }
  private passTargets(count: number): readonly Point[] {
    const spacing = this.layout.bottomTileLayout.width * 0.85;
    const discard = this.layout.discardArea;

    if (this.passDirection === "right") {
      return Array.from({ length: count }, (_, i) => ({
        x: this.layout.rightExposure.x + this.layout.rightExposure.width / 2,
        y: discard.y + discard.height * 0.5 + (i - 1) * spacing,
      }));
    }

    if (this.passDirection === "left") {
      return Array.from({ length: count }, (_, i) => ({
        x: this.layout.leftExposure.x + this.layout.leftExposure.width / 2,
        y: discard.y + discard.height * 0.5 + (i - 1) * spacing,
      }));
    }

    return Array.from({ length: count }, (_, i) => ({
      x: discard.x + discard.width * 0.5 + (i - 1) * spacing,
      y: this.layout.topExposure.y + this.layout.topExposure.height / 2,
    }));
  }

  private slotFor(runtime: TileRuntime): Point {
    const index = this.rackOrder.indexOf(runtime.vm.id);
    const slot = this.layout.bottomTileLayout.slots[index];

    return slot ?? {
      x: this.layout.bottomRack.x + this.layout.bottomRack.width / 2,
      y: this.layout.bottomRack.y + this.layout.bottomRack.height / 2,
    };
  }
  private drawTable(): void {
    const g = this.graphics;

    g.clear();

    const canvas = this.layout.canvas;
    const table = this.layout.tableOuter;
    const hud = this.layout.hud;

    const pageColor = 0x121a36;
    const hudColor = 0x121a36;
    const tableBorderDark = 0x0b1228;
    const tableBorderMid = 0x27314f;
    const tableBorderPink = 0xd64abf;
    const feltColor = 0xc783b8;
    const panelColor = 0x162449;
    const panelInner = 0x253a78;

    g.fillStyle(pageColor, 1);
    g.fillRect(0, 0, canvas.width, canvas.height);

    /**
     * Header.
     */
    g.fillStyle(hudColor, 1);
    g.fillRect(hud.x, hud.y, hud.width, hud.height);

    /**
     * Outer board shadow/border.
     */
    g.fillStyle(tableBorderDark, 1);
    g.fillRoundedRect(
      table.x,
      table.y,
      table.width,
      table.height,
      20,
    );

    g.fillStyle(tableBorderMid, 1);
    g.fillRoundedRect(
      table.x + 5,
      table.y + 5,
      table.width - 10,
      table.height - 10,
      18,
    );

    g.fillStyle(tableBorderPink, 1);
    g.fillRoundedRect(
      table.x + 9,
      table.y + 9,
      table.width - 18,
      table.height - 18,
      16,
    );

    /**
     * Felt area.
     */
    g.fillStyle(feltColor, 1);
    g.fillRoundedRect(
      table.x + 16,
      table.y + 16,
      table.width - 32,
      table.height - 32,
      12,
    );

    /**
     * Very subtle center felt panel.
     */
    g.fillStyle(0xffffff, 0.035);
    g.fillRoundedRect(
      this.layout.discardArea.x,
      this.layout.discardArea.y,
      this.layout.discardArea.width,
      this.layout.discardArea.height,
      14,
    );

    /* this.drawPsdSideRackPanel(this.layout.leftExposure, "left");
    this.drawPsdSideRackPanel(this.layout.rightExposure, "right");

    this.drawPsdHorizontalRackPanel(this.layout.topExposure, 'horizontal');
    this.drawPsdHorizontalRackPanel(this.layout.bottomExposure, 'bottom'); */

    this.drawPsdRackPanel(
      this.layout.leftExposure,
      0,
      0,
      "vertical-left",
    );

    this.drawPsdRackPanel(
      this.layout.rightExposure,
      0,
      0,
      "vertical-right",
    );

    this.drawPsdRackPanel(
      this.layout.topExposure,
      0,
      0,
      "horizontal",
    );

    this.drawPsdRackPanel(
      this.layout.bottomExposure,
      0,
      0,
      "bottom",
    );

    this.drawActiveSeatExposureHighlight();

    /**
     * Center card.
     */
    /* const card = this.layout.instructionBar;

    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(card.x + 5, card.y + 7, card.width, card.height, 20);

    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(card.x, card.y, card.width, card.height, 20);

    g.lineStyle(3, 0xb0b751, 0.8);
    g.strokeRoundedRect(card.x, card.y, card.width, card.height, 20); */

    const card = this.layout.instructionBar;

    const cardRadius = Math.round(
      Phaser.Math.Clamp(card.height * 0.22, 16, 34),
    );

    /**
     * PSD-style instruction card shadow.
     */
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(
      card.x + Math.max(4, card.width * 0.012),
      card.y + Math.max(6, card.height * 0.045),
      card.width,
      card.height,
      cardRadius,
    );

    g.fillStyle(0x000000, 0.08);
    g.fillRoundedRect(
      card.x + Math.max(8, card.width * 0.020),
      card.y + Math.max(10, card.height * 0.065),
      card.width,
      card.height,
      cardRadius,
    );

    /**
     * White card body.
     */
    g.fillStyle(0xffffff, 0.98);
    g.fillRoundedRect(
      card.x,
      card.y,
      card.width,
      card.height,
      cardRadius,
    );

    /**
     * Subtle inner cream overlay, closer to PSD.
     */
    g.fillStyle(0xfffbf2, 0.20);
    g.fillRoundedRect(
      card.x + 2,
      card.y + 2,
      card.width - 4,
      card.height - 4,
      Math.max(10, cardRadius - 2),
    );

    /**
     * Olive/yellow border.
     */
    g.lineStyle(
      Math.max(2, Math.round(card.height * 0.018)),
      0xb4ba4a,
      0.95,
    );
    g.strokeRoundedRect(
      card.x,
      card.y,
      card.width,
      card.height,
      cardRadius,
    );
  }
  private exposureLipRatio(): number {
    /**
     * Shared lip/bevel ratio for all exposure panels.
     */
    return 0.14;
  }

  private exposureNameStripRatio(): number {
    /**
     * Shared player-name strip ratio for all exposure panels.
     * This keeps top, bottom, left, and right visually consistent.
     */
    return 0.125;
  }

  private horizontalExposureNameStripRatio(): number {
    /**
     * Top/bottom label strip height.
     *
     * Desktop already looks good, so keep it unchanged.
     * Mobile uses a slightly smaller strip to avoid stealing tile area.
     */
    if (this.layout.metrics.isMobile) {
      return 0.105;
    }

    return 0.225;
  }

  private verticalExposureNameStripRatio(): number {
    /**
     * Left/right label strip width.
     *
     * Side panels are narrow on mobile, so use smaller ratio
     * than top/bottom.
     */
    if (this.layout.metrics.isMobile && this.layout.metrics.isPortrait) {
      return 0.075;
    }

    if (this.layout.metrics.isMobile && !this.layout.metrics.isPortrait) {
      return 0.080;
    }

    return 0.225;
  }
  private exposurePanelMode(): ExposurePanelMode {
    const width = this.layout.canvas.width;
    const height = this.layout.canvas.height;

    const phoneLandscape =
      width > height &&
      height <= 520 &&
      width <= 980;

    if (this.layout.metrics.isMobile && this.layout.metrics.isPortrait) {
      return "mobile-portrait";
    }

    if (phoneLandscape || (this.layout.metrics.isMobile && !this.layout.metrics.isPortrait)) {
      return "mobile-landscape";
    }

    if (this.layout.metrics.isTablet) {
      return "tablet";
    }

    return "desktop";
  }
  private drawPsdRackPanel(
    rect: Rect,
    color: number,
    innerColor: number,
    mode: "vertical-left" | "vertical-right" | "horizontal" | "bottom",
  ): void {
    if (mode === "vertical-left") {
      this.drawPsdSideRackPanel(rect, "left", this.activeSeat === "left");
      return;
    }

    if (mode === "vertical-right") {
      this.drawPsdSideRackPanel(rect, "right", this.activeSeat === "right");
      return;
    }

    this.drawPsdHorizontalRackPanel(
      rect,
      mode,
      mode === "bottom"
        ? this.activeSeat === "bottom"
        : this.activeSeat === "top",
    );
  }
  private drawPsdSideRackPanel(
    rect: Rect,
    side: "left" | "right",
    active: boolean,
  ): void {
    const g = this.graphics;

    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const shadowX = Math.max(4, Math.round(w * 0.045));
    const shadowY = Math.max(5, Math.round(w * 0.055));


    //const compactMobile = this.layout.metrics.isMobile && this.layout.metrics.isPortrait;
    const compactMobile = this.layout.metrics.isMobile;

    /**
     * In mobile portrait, reduce label strip width
     * so the exposure tile area becomes larger.
     */

    /* const compactPortrait =
      this.layout.metrics.isMobile && this.layout.metrics.isPortrait;

    const compactLandscape =
      this.layout.metrics.isMobile && !this.layout.metrics.isPortrait;

    const lipW = compactPortrait
      ? Math.max(4, Math.round(w * 0.075))
      : compactLandscape
        ? Math.max(6, Math.round(w * 0.085))
        : Math.max(8, Math.round(w * 0.105));

    const nameStripW = compactPortrait
      ? Math.max(8, Math.round(w * 0.145))
      : compactLandscape
        ? Math.max(12, Math.round(w * 0.20))
        : Math.max(24, Math.round(w * 0.315)); */
    

/*   const modeKey = this.exposurePanelMode();

  const lipRatio = exposureLipRatio(modeKey);
  const nameStripRatio = exposureNameStripRatio(modeKey);

  const lipW = Math.max(
    this.layout.metrics.isMobile ? 4 : 8,
    Math.round(w * lipRatio),
  );

  const nameStripW = Math.max(
    this.layout.metrics.isMobile ? 4 : 8,
    Math.round(w * nameStripRatio),
  ); */


  const modeKey = this.exposurePanelMode();

  const isMobileLandscape = this.layout.metrics.isMobile && !this.layout.metrics.isPortrait;

  /* console.log('Metrics', this.layout.metrics);
  console.log('isMobileLandscape: ==============', isMobileLandscape); */
    

  /**
   * Landscape side exposure:
   * Keep the whole panel size unchanged, but make its inner structure
   * closer to top/bottom exposure proportions.
   *
   * This reduces the over-large inner tile channel only for landscape side panels.
   */
  const lipRatio = exposureLipRatio(modeKey);

  const nameStripRatio =  exposureNameStripRatio(modeKey);

  const lipW = Math.max(
    this.layout.metrics.isMobile ? 4 : 8,
    Math.round(w * lipRatio),
  );

  const nameStripW = Math.max(
    this.layout.metrics.isMobile ? 2 : 8,
    Math.round(w * nameStripRatio),
  );



/* const lipW = compactPortrait
  ? Math.max(4, Math.round(w * 0.055))
  : compactLandscape
    ? Math.max(4, Math.round(w * 0.050))
    : Math.max(7, Math.round(w * 0.085));
 // PLAYER 2 / PLAYER 3 strip width.
 
 
const nameStripW = compactPortrait
  ? Math.max(3, Math.round(w * 0.045))
  : compactLandscape
    ? Math.max(3, Math.round(w * 0.040))
    : Math.max(8, Math.round(w * 0.095)); */



    const dividerW = 1;

    const stripFill = active ? 0xd7d33a : 0x22488f;
    const stripHighlight = active ? 0xf0eb78 : 0x3c63bb;
    const dividerFill = active ? 0x9b9722 : 0x8ea4d0;

    /**
     * Soft separated outside shadow.
     */
    g.fillStyle(0x05091a, 0.12);
    g.fillRect(x + shadowX * 0.45, y + shadowY * 0.45, w, h);

    g.fillStyle(0x05091a, 0.10);
    g.fillRect(x + shadowX * 0.85, y + shadowY * 0.85, w, h);

    g.fillStyle(0x05091a, 0.08);
    g.fillRect(x + shadowX * 1.25, y + shadowY * 1.25, w, h);

    /**
     * Main outer tray.
     */
    g.fillStyle(0x17336f, 1);
    g.fillRect(x, y, w, h);

    /**
     * Soft outer border.
     */
    g.lineStyle(1, 0x07142f, 0.45);
    g.strokeRect(x, y, w, h);

    if (side === "left") {
      /**
       * LEFT PANEL:
       * small left lip -> center tray -> divider -> right player strip
       */
      const contentX = x + lipW;
      const contentW = w - lipW - nameStripW - dividerW;
      const dividerX = contentX + contentW;
      const stripX = dividerX + dividerW;

      g.fillStyle(0x3159aa, 1);
      g.fillRect(x, y, lipW, h);

      g.fillStyle(0x5e82d5, 0.42);
      g.fillRect(
        x + Math.max(2, Math.round(lipW * 0.18)),
        y + Math.max(4, Math.round(h * 0.01)),
        Math.max(2, Math.round(lipW * 0.16)),
        h - Math.max(8, Math.round(h * 0.02)),
      );

      g.fillStyle(0x172c61, 1);
      g.fillRect(contentX, y, contentW, h);

      g.fillStyle(0x1f3b83, 0.76);
      g.fillRect(
        contentX + Math.max(2, Math.round(contentW * 0.035)),
        y + Math.max(4, Math.round(h * 0.01)),
        contentW - Math.max(4, Math.round(contentW * 0.07)),
        h - Math.max(8, Math.round(h * 0.02)),
      );

      g.fillStyle(0x07122d, 0.14);
      g.fillRect(
        contentX,
        y,
        Math.max(3, Math.round(contentW * 0.045)),
        h,
      );

      g.fillStyle(dividerFill, active ? 0.72 : 0.58);
      g.fillRect(
        dividerX,
        y + Math.max(4, Math.round(h * 0.012)),
        dividerW,
        h - Math.max(8, Math.round(h * 0.024)),
      );

      g.fillStyle(stripFill, 1);
      g.fillRect(stripX, y, nameStripW, h);

      /* g.fillStyle(stripHighlight, active ? 0.34 : 0.24);
      g.fillRect(
        stripX + Math.max(2, Math.round(nameStripW * 0.15)),
        y + Math.max(4, Math.round(h * 0.01)),
        Math.max(2, Math.round(nameStripW * 0.12)),
        h - Math.max(8, Math.round(h * 0.02)),
      ); */

      g.fillStyle(stripHighlight, active ? 0.34 : 0.24);
      g.fillRect(
        stripX + Math.max(1, Math.round(nameStripW * 0.10)),
        y + Math.max(3, Math.round(h * 0.01)),
        Math.max(1, Math.round(nameStripW * (compactMobile ? 0.08 : 0.12))),
        h - Math.max(6, Math.round(h * 0.02)),
      );

      return;
    }

    /**
     * RIGHT PANEL:
     * left player strip -> divider -> center tray -> small right lip
     */
    const stripX = x;
    const dividerX = stripX + nameStripW;
    const contentX = dividerX + dividerW;
    const contentW = w - nameStripW - dividerW - lipW;
    const rightLipX = contentX + contentW;

    g.fillStyle(stripFill, 1);
    g.fillRect(stripX, y, nameStripW, h);

    /* g.fillStyle(stripHighlight, active ? 0.34 : 0.24);
    g.fillRect(
      stripX + Math.max(2, Math.round(nameStripW * 0.15)),
      y + Math.max(4, Math.round(h * 0.01)),
      Math.max(2, Math.round(nameStripW * 0.12)),
      h - Math.max(8, Math.round(h * 0.02)),
    ); */
    if (nameStripW >= 6) {
      g.fillStyle(stripHighlight, active ? 0.22 : 0.16);
      g.fillRect(
        stripX + Math.max(1, Math.round(nameStripW * 0.18)),
        y + Math.max(3, Math.round(h * 0.01)),
        Math.max(1, Math.round(nameStripW * 0.06)),
        h - Math.max(6, Math.round(h * 0.02)),
      );
    }

    g.fillStyle(dividerFill, active ? 0.72 : 0.58);
    g.fillRect(
      dividerX,
      y + Math.max(4, Math.round(h * 0.012)),
      dividerW,
      h - Math.max(8, Math.round(h * 0.024)),
    );

    g.fillStyle(0x172c61, 1);
    g.fillRect(contentX, y, contentW, h);

    g.fillStyle(0x1f3b83, 0.76);
    g.fillRect(
      contentX + Math.max(2, Math.round(contentW * 0.035)),
      y + Math.max(4, Math.round(h * 0.01)),
      contentW - Math.max(4, Math.round(contentW * 0.07)),
      h - Math.max(8, Math.round(h * 0.02)),
    );

    g.fillStyle(0x07122d, 0.10);
    g.fillRect(
      contentX + contentW - Math.max(3, Math.round(contentW * 0.045)),
      y,
      Math.max(3, Math.round(contentW * 0.045)),
      h,
    );

    g.fillStyle(0x3159aa, 1);
    g.fillRect(rightLipX, y, lipW, h);

    g.fillStyle(0x5e82d5, 0.42);
    g.fillRect(
      rightLipX + Math.max(2, Math.round(lipW * 0.66)),
      y + Math.max(4, Math.round(h * 0.01)),
      Math.max(2, Math.round(lipW * 0.16)),
      h - Math.max(8, Math.round(h * 0.02)),
    );
  }
  private drawPsdSideRackPanelW(rect: Rect, side: "left" | "right"): void {
    const g = this.graphics;

    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const shadowX = Math.max(4, Math.round(w * 0.045));
    const shadowY = Math.max(5, Math.round(w * 0.055));

    /* const lipW = Math.max(10, Math.round(w * 0.16));
    const nameStripW = Math.max(18, Math.round(w * 0.27)); */
    const lipW = Math.max(8, Math.round(w * 0.105));
    const nameStripW = Math.max(24, Math.round(w * 0.315));
    const dividerW = 1;

    /**
     * Outside shadow.
     */
    g.fillStyle(0x05091a, 0.12);
    g.fillRect(
      x + shadowX * 0.45,
      y + shadowY * 0.45,
      w,
      h,
    );

    g.fillStyle(0x05091a, 0.10);
    g.fillRect(
      x + shadowX * 0.85,
      y + shadowY * 0.85,
      w,
      h,
    );

    g.fillStyle(0x05091a, 0.08);
    g.fillRect(
      x + shadowX * 1.25,
      y + shadowY * 1.25,
      w,
      h,
    );

    /**
     * Main outer tray.
     */
    g.fillStyle(0x17336f, 1);
    g.fillRect(x, y, w, h);

    /**
     * Dark outer border.
     */
    g.lineStyle(1, 0x07142f, 0.45);
    g.strokeRect(x, y, w, h);

    if (side === "left") {
      /**
       * LEFT PANEL
       * left lip -> center -> divider -> right name strip
       */

      const contentX = x + lipW;
      const contentY = y;
      const contentW = w - lipW - nameStripW - dividerW;
      const contentH = h;

      const dividerX = contentX + contentW;
      const stripX = dividerX + dividerW;

      /**
       * Left bevel/lip.
       */
      g.fillStyle(0x3159aa, 1);
      g.fillRect(x, y, lipW, h);

      g.fillStyle(0x5e82d5, 0.42);
      g.fillRect(
        x + Math.max(2, Math.round(lipW * 0.18)),
        y + Math.max(4, Math.round(h * 0.01)),
        Math.max(2, Math.round(lipW * 0.16)),
        h - Math.max(8, Math.round(h * 0.02)),
      );

      /**
       * Recessed center tray.
       */
      g.fillStyle(0x172c61, 1);
      g.fillRect(contentX, contentY, contentW, contentH);

      g.fillStyle(0x1f3b83, 0.76);
      g.fillRect(
        contentX + Math.max(2, Math.round(contentW * 0.035)),
        contentY + Math.max(4, Math.round(h * 0.01)),
        contentW - Math.max(4, Math.round(contentW * 0.07)),
        contentH - Math.max(8, Math.round(h * 0.02)),
      );

      g.fillStyle(0x07122d, 0.14);
      g.fillRect(
        contentX,
        contentY,
        Math.max(3, Math.round(contentW * 0.045)),
        contentH,
      );

      /**
       * Divider.
       */
      g.fillStyle(0x8ea4d0, 0.58);
      g.fillRect(
        dividerX,
        y + Math.max(4, Math.round(h * 0.012)),
        dividerW,
        h - Math.max(8, Math.round(h * 0.024)),
      );

      /**
       * Right-side player strip.
       */
      g.fillStyle(0x22488f, 1);
      g.fillRect(stripX, y, nameStripW, h);

      g.fillStyle(0x3c63bb, 0.24);
      g.fillRect(
        stripX + Math.max(2, Math.round(nameStripW * 0.15)),
        y + Math.max(4, Math.round(h * 0.01)),
        Math.max(2, Math.round(nameStripW * 0.12)),
        h - Math.max(8, Math.round(h * 0.02)),
      );
    } else {
      /**
       * RIGHT PANEL
       * left name strip (big) -> divider -> center -> right lip (small)
       */

      const stripX = x;
      const dividerX = stripX + nameStripW;
      const contentX = dividerX + dividerW;
      const contentY = y;
      const contentW = w - nameStripW - dividerW - lipW;
      const contentH = h;
      const rightLipX = contentX + contentW;

      /**
       * Left-side player strip (big).
       */
      g.fillStyle(0x22488f, 1);
      g.fillRect(stripX, y, nameStripW, h);

      g.fillStyle(0x3c63bb, 0.24);
      g.fillRect(
        stripX + Math.max(2, Math.round(nameStripW * 0.15)),
        y + Math.max(4, Math.round(h * 0.01)),
        Math.max(2, Math.round(nameStripW * 0.12)),
        h - Math.max(8, Math.round(h * 0.02)),
      );

      /**
       * Divider.
       */
      g.fillStyle(0x8ea4d0, 0.58);
      g.fillRect(
        dividerX,
        y + Math.max(4, Math.round(h * 0.012)),
        dividerW,
        h - Math.max(8, Math.round(h * 0.024)),
      );

      /**
       * Recessed center tray.
       */
      g.fillStyle(0x172c61, 1);
      g.fillRect(contentX, contentY, contentW, contentH);

      g.fillStyle(0x1f3b83, 0.76);
      g.fillRect(
        contentX + Math.max(2, Math.round(contentW * 0.035)),
        contentY + Math.max(4, Math.round(h * 0.01)),
        contentW - Math.max(4, Math.round(contentW * 0.07)),
        contentH - Math.max(8, Math.round(h * 0.02)),
      );

      g.fillStyle(0x07122d, 0.10);
      g.fillRect(
        contentX + contentW - Math.max(3, Math.round(contentW * 0.045)),
        contentY,
        Math.max(3, Math.round(contentW * 0.045)),
        contentH,
      );

      /**
       * Small right bevel/lip.
       */
      g.fillStyle(0x3159aa, 1);
      g.fillRect(rightLipX, y, lipW, h);

      g.fillStyle(0x5e82d5, 0.42);
      g.fillRect(
        rightLipX + Math.max(2, Math.round(lipW * 0.66)),
        y + Math.max(4, Math.round(h * 0.01)),
        Math.max(2, Math.round(lipW * 0.16)),
        h - Math.max(8, Math.round(h * 0.02)),
      );
    }

    /**
     * Far-right depth.
     */
    g.fillStyle(0x07122d, 0.30);
    g.fillRect(
      x + w - Math.max(3, Math.round(w * 0.025)),
      y,
      Math.max(3, Math.round(w * 0.025)),
      h,
    );
  }
  private drawPsdSideRackPanelWW(rect: Rect): void {
    const g = this.graphics;

    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const shadowX = Math.max(4, Math.round(w * 0.045));
    const shadowY = Math.max(5, Math.round(w * 0.055));

    const leftLipW = Math.max(10, Math.round(w * 0.16));
    const nameStripW = Math.max(18, Math.round(w * 0.27));
    const dividerW = 1;

    const contentX = x + leftLipW;
    const contentY = y;
    const contentW = w - leftLipW - nameStripW - dividerW;
    const contentH = h;

    const dividerX = contentX + contentW;
    const stripX = dividerX + dividerW;

    /**
     * Outside shadow.
     */
    g.fillStyle(0x05091a, 0.42);
    g.fillRect(x + shadowX, y + shadowY, w, h);

    /**
     * Main outer tray.
     */
    g.fillStyle(0x17336f, 1);
    g.fillRect(x, y, w, h);

    /**
     * Dark outer border.
     */
    g.lineStyle(1, 0x07142f, 0.95);
    g.strokeRect(x, y, w, h);

    /**
     * Left bevel/lip.
     * This now matches the top rack lip style, without a black line.
     */
    g.fillStyle(0x3159aa, 1);
    g.fillRect(x, y, leftLipW, h);

    /**
     * Bright lip highlight.
     */
    g.fillStyle(0x5e82d5, 0.42);
    g.fillRect(
      x + Math.max(2, Math.round(leftLipW * 0.18)),
      y + Math.max(4, Math.round(h * 0.01)),
      Math.max(2, Math.round(leftLipW * 0.16)),
      h - Math.max(8, Math.round(h * 0.02)),
    );

    /**
     * Recessed main center tray.
     */
    g.fillStyle(0x172c61, 1);
    g.fillRect(contentX, contentY, contentW, contentH);

    /**
     * Soft center fill.
     */
    g.fillStyle(0x1f3b83, 0.76);
    g.fillRect(
      contentX + Math.max(2, Math.round(contentW * 0.035)),
      contentY + Math.max(4, Math.round(h * 0.01)),
      contentW - Math.max(4, Math.round(contentW * 0.07)),
      contentH - Math.max(8, Math.round(h * 0.02)),
    );

    /**
     * Very soft inner left shadow.
     */
    g.fillStyle(0x07122d, 0.14);
    g.fillRect(
      contentX,
      contentY,
      Math.max(3, Math.round(contentW * 0.045)),
      contentH,
    );

    /**
     * Thin divider before name strip.
     */
    g.fillStyle(0x8ea4d0, 0.58);
    g.fillRect(
      dividerX,
      y + Math.max(4, Math.round(h * 0.012)),
      dividerW,
      h - Math.max(8, Math.round(h * 0.024)),
    );

    /**
     * Player name strip.
     */
    g.fillStyle(0x22488f, 1);
    g.fillRect(stripX, y, nameStripW, h);

    /**
     * Subtle strip highlight.
     */
    g.fillStyle(0x3c63bb, 0.24);
    g.fillRect(
      stripX + Math.max(2, Math.round(nameStripW * 0.15)),
      y + Math.max(4, Math.round(h * 0.01)),
      Math.max(2, Math.round(nameStripW * 0.12)),
      h - Math.max(8, Math.round(h * 0.02)),
    );

    /**
     * Right depth.
     */
    g.fillStyle(0x07122d, 0.30);
    g.fillRect(
      x + w - Math.max(3, Math.round(w * 0.025)),
      y,
      Math.max(3, Math.round(w * 0.025)),
      h,
    );
  }
  private drawPsdHorizontalRackPanel(
    rect: Rect,
    mode: "horizontal" | "bottom",
    active: boolean,
  ): void {
    const g = this.graphics;

    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const shadowX = Math.max(4, Math.round(h * 0.045));
    const shadowY = Math.max(5, Math.round(h * 0.055));

    /* const topLipH = Math.max(12, Math.round(h * 0.15));
    const nameStripH = Math.max(24, Math.round(h * 0.285));
    const dividerH = Math.max(1, Math.round(h * 0.012)); */

    //const compactMobile = this.layout.metrics.isMobile && this.layout.metrics.isPortrait;
    /* const compactMobile = this.layout.metrics.isMobile;

    const topLipH = compactMobile
      ? Math.max(6, Math.round(h * 0.16))
      : Math.max(12, Math.round(h * 0.15));

    const nameStripH = compactMobile
      ? Math.max(10, Math.round(h * 0.20))
      : Math.max(24, Math.round(h * 0.285));

    const dividerH = Math.max(1, Math.round(h * 0.012)); */
    const compactMobile = this.layout.metrics.isMobile;
    
    const compactPortrait =
      this.layout.metrics.isMobile && this.layout.metrics.isPortrait;

    const compactLandscape =
      this.layout.metrics.isMobile && !this.layout.metrics.isPortrait;

    /* const topLipH = compactPortrait
      ? Math.max(6, Math.round(h * 0.15))
      : compactLandscape
        ? Math.max(5, Math.round(h * 0.13))
        : Math.max(12, Math.round(h * 0.15)); */

    /**
     * PLAYER 1 / USERNAME strip height.
     * This is the green highlighted horizontal area.
     */
    /**
     * PLAYER 1 / USERNAME strip height.
     * Keep this small. The exposure tile area should get most of the panel height.
     */
    /* const nameStripH = compactPortrait
      ? Math.max(4, Math.round(h * 0.070))
      : compactLandscape
        ? Math.max(4, Math.round(h * 0.065))
        : Math.max(10, Math.round(h * 0.120));

        //const dividerH = Math.max(1, Math.round(h * 0.010));
        const dividerH = Math.max(1, Math.round(h * 0.006)); */
    
    
    const modeKey = this.exposurePanelMode();

const lipRatio = exposureLipRatio(modeKey);
const nameStripRatio = exposureNameStripRatio(modeKey);

const topLipH = Math.max(
  this.layout.metrics.isMobile ? 4 : 8,
  Math.round(h * lipRatio),
);

const nameStripH = Math.max(
  this.layout.metrics.isMobile ? 4 : 8,
  Math.round(h * nameStripRatio),
);

const dividerH = 1;


    const contentX = x;
    const contentY = y + topLipH;
    const contentW = w;
    const contentH = h - topLipH - nameStripH - dividerH;

    const dividerY = contentY + contentH;
    const stripY = dividerY + dividerH;

    const isBottom = mode === "bottom";

    /**
     * Bottom/current user strip becomes yellow instead of using
     * an outer yellow rounded border.
     */
    /* const stripFill = isBottom ? 0xd7d33a : 0x22488f;
    const stripHighlight = isBottom ? 0xf0eb78 : 0x3c63bb;
    const dividerFill = isBottom ? 0x9b9722 : 0x8ea4d0; */
    const stripFill = active ? 0xd7d33a : 0x22488f;
    const stripHighlight = active ? 0xf0eb78 : 0x3c63bb;
    const dividerFill = active ? 0x9b9722 : 0x8ea4d0;

    /**
     * Soft separated outside shadow.
     */
    g.fillStyle(0x05091a, 0.12);
    g.fillRect(
      x + shadowX * 0.45,
      y + shadowY * 0.45,
      w,
      h,
    );

    g.fillStyle(0x05091a, 0.10);
    g.fillRect(
      x + shadowX * 0.85,
      y + shadowY * 0.85,
      w,
      h,
    );

    g.fillStyle(0x05091a, 0.08);
    g.fillRect(
      x + shadowX * 1.25,
      y + shadowY * 1.25,
      w,
      h,
    );

    /**
     * Main outer tray.
     */
    g.fillStyle(0x17336f, 1);
    g.fillRect(x, y, w, h);

    /**
     * Softer outer border.
     */
    g.lineStyle(1, 0x07142f, 0.45);
    g.strokeRect(x, y, w, h);

    /**
     * Top bevel/lip.
     */
    g.fillStyle(0x3159aa, 1);
    g.fillRect(x, y, w, topLipH);

    /**
     * Bright highlight inside top lip.
     */
    g.fillStyle(0x5e82d5, 0.42);
    g.fillRect(
      x + Math.max(4, Math.round(w * 0.01)),
      y + Math.max(2, Math.round(topLipH * 0.18)),
      w - Math.max(8, Math.round(w * 0.02)),
      Math.max(2, Math.round(topLipH * 0.16)),
    );

    /**
     * Recessed main center tray.
     */
    g.fillStyle(0x172c61, 1);
    g.fillRect(contentX, contentY, contentW, contentH);

    /**
     * Soft center fill.
     */
    g.fillStyle(0x1f3b83, 0.76);
    g.fillRect(
      contentX + Math.max(4, Math.round(w * 0.01)),
      contentY + Math.max(3, Math.round(contentH * 0.045)),
      contentW - Math.max(8, Math.round(w * 0.02)),
      contentH - Math.max(6, Math.round(contentH * 0.09)),
    );

    /**
     * Very soft inner top shadow.
     */
    g.fillStyle(0x07122d, 0.18);
    g.fillRect(
      contentX,
      contentY,
      contentW,
      Math.max(3, Math.round(contentH * 0.06)),
    );

    /**
     * Thin divider above name strip.
     */
    g.fillStyle(dividerFill, isBottom ? 0.72 : 0.58);
    g.fillRect(x, dividerY, w, dividerH);

    /**
     * Name strip.
     */
    g.fillStyle(stripFill, 1);
    g.fillRect(x, stripY, w, nameStripH);

    /**
     * Subtle strip highlight.
     */
   /*  g.fillStyle(stripHighlight, isBottom ? 0.34 : 0.26);
    g.fillRect(
      x + Math.max(4, Math.round(w * 0.01)),
      stripY + Math.max(3, Math.round(nameStripH * 0.14)),
      w - Math.max(8, Math.round(w * 0.02)),
      Math.max(2, Math.round(nameStripH * 0.10)),
    ); */

    /* g.fillStyle(stripHighlight, active ? 0.34 : 0.26);
    g.fillRect(
      x + Math.max(3, Math.round(w * 0.01)),
      stripY + Math.max(2, Math.round(nameStripH * 0.12)),
      w - Math.max(6, Math.round(w * 0.02)),
      Math.max(1, Math.round(nameStripH * (compactMobile ? 0.08 : 0.10))),
    ); */
    if (nameStripH >= 8) {
      g.fillStyle(stripHighlight, active ? 0.22 : 0.16);
      g.fillRect(
        x + Math.max(3, Math.round(w * 0.01)),
        stripY + Math.max(1, Math.round(nameStripH * 0.18)),
        w - Math.max(6, Math.round(w * 0.02)),
        Math.max(1, Math.round(nameStripH * 0.06)),
      );
    }

    /**
     * Bottom depth.
     */
    g.fillStyle(0x07122d, 0.22);
    g.fillRect(
      x,
      y + h - Math.max(3, Math.round(h * 0.018)),
      w,
      Math.max(3, Math.round(h * 0.018)),
    );
  }
  
  private drawActiveSeatExposureHighlight(): void {
    const rect = this.exposureRectForSeat(this.activeSeat);
    const g = this.graphics;

    const shortest = Math.min(rect.width, rect.height);
    const radius = Phaser.Math.Clamp(shortest * 0.18, 8, 18);

    const lineWidth = this.layout.metrics.isMobile ? 3 : 4;

    /**
     * Soft outer glow.
     * Multiple strokes are cheaper than a separate blurred object
     * and only redraw when layout/active seat changes.
     */
    /* g.lineStyle(lineWidth + 5, 0xffd166, 0.16);
    g.strokeRoundedRect(
      rect.x + 2,
      rect.y + 2,
      rect.width - 4,
      rect.height - 4,
      radius,
    );

    g.lineStyle(lineWidth + 2, 0xffd166, 0.28);
    g.strokeRoundedRect(
      rect.x + 3,
      rect.y + 3,
      rect.width - 6,
      rect.height - 6,
      radius,
    ); */

    /**
     * Main active border.
     */
    /* g.lineStyle(lineWidth, 0xfff3a3, 0.95);
    g.strokeRoundedRect(
      rect.x + 5,
      rect.y + 5,
      rect.width - 10,
      rect.height - 10,
      radius,
    );
 */
    /**
     * Very subtle inner overlay so the active exposure feels selected.
     */
    g.fillStyle(0xffd166, 0.08);
    g.fillRoundedRect(
      rect.x + 6,
      rect.y + 6,
      rect.width - 12,
      rect.height - 12,
      radius,
    );
  }

  private exposureRectForSeat(seat: TableSeat): Rect {
    if (seat === "bottom") {
      return this.layout.bottomExposure;
    }

    if (seat === "top") {
      return this.layout.topExposure;
    }

    if (seat === "left") {
      return this.layout.leftExposure;
    }

    return this.layout.rightExposure;
  }
  
  private createStaticUi(): void {
    this.uiLayoutManager.createStaticUi(this);
    this.layoutStaticUi();
  }
  private layoutStaticUi(): void {
    if (!this.layout) return;

    this.uiLayoutManager.layoutStaticUi({
      layout: this.layout,
      renderDpr: this.renderDpr,
      tablePhase: this.tablePhase,
      pickTargetSeat: this.pickTargetSeat,
      passDirection: this.passDirection,
      wallTileCount: this.wallTileCount,
      passWaitingCount: this.passWaitingTileIds.length,
      canSubmitPass: this.canSubmitPassWaitingTiles(),
      isPassAnimating: this.isPassAnimating,
      isPickAnimating: this.isPickAnimating,
      activeSeat: this.activeSeat,
    });
  }
  private layoutMobileHudMenu(): void {
    this.uiLayoutManager.layoutMobileHud(this.layout);
  }
  
  private wallTileBoxSize(): { readonly width: number; readonly height: number } {
    return this.uiLayoutManager.wallTileBoxSize(this.layout);
  }

  private wallTileSourcePoint(): Point {
    return this.uiLayoutManager.wallTileSourcePoint(this.layout);
  }

  private updateWallCountText(): void {
    this.uiLayoutManager.updateWallTiles(this.wallTileCount);
  }
  

  private layoutPassButton(): void {
    this.uiLayoutManager.layoutPassButton(this.layout);
  }
  

  private updateInstructionText(): void {
    this.uiLayoutManager.updateInstruction(
      this.tablePhase,
      this.pickTargetSeat,
      this.passDirection,
    );
  }
  
  private textureKey(tile: TileVm): string {
    return `tile-${tile.id}`;
  }

  private discardSlotFor(
    index: number,
    grid = this.discardGrid(),
  ): Point {
    const row = Math.floor(index / grid.columns);
    const col = index % grid.columns;

    /**
     * Center the FULL discard grid inside the discard area,
     * but do NOT center each individual row.
     *
     * This means:
     * - first discarded tile starts from the left side of the grid
     * - all rows start from the same left X
     * - full rows still have equal left/right spacing inside discard area
     */
    const fullRowWidth =
      grid.columns * grid.tileWidth +
      Math.max(0, grid.columns - 1) * grid.gapX;

    const startX =
      grid.x +
      (grid.width - fullRowWidth) / 2 +
      grid.tileWidth / 2;

    return {
      x: Math.round(startX + col * (grid.tileWidth + grid.gapX)),
      y: Math.round(
        grid.y +
          grid.paddingY +
          grid.tileHeight / 2 +
          row * (grid.tileHeight + grid.gapY),
      ),
    };
  }
  private discardSlotForOLD(
    index: number,
    grid = this.discardGrid(),
  ): Point {
    const row = Math.floor(index / grid.columns);
    const col = index % grid.columns;

    return {
      x:
        grid.x +
        grid.paddingX +
        grid.tileWidth / 2 +
        col * (grid.tileWidth + grid.gapX),
      y:
        grid.y +
        grid.paddingY +
        grid.tileHeight / 2 +
        row * (grid.tileHeight + grid.gapY),
    };
  }
  private discardGrid(): DiscardGrid {
    const area = this.layout.discardArea;
    const rackTile = this.layout.bottomTileLayout;
    const aspect = rackTile.height / rackTile.width;

    const isPhonePortrait =
      this.layout.canvas.height >= this.layout.canvas.width &&
      this.layout.canvas.width <= 520;

    const isPhoneLandscape =
      this.layout.canvas.width > this.layout.canvas.height &&
      this.layout.canvas.height <= 520 &&
      this.layout.canvas.width <= 980;

    const isTablet =
      this.layout.metrics.isTablet;

    const count = Math.max(1, this.discardedTileIds.length);

    const paddingX = isPhonePortrait ? 5 : isPhoneLandscape ? 6 : isTablet ? 10 : 12;
    const paddingY = isPhonePortrait ? 5 : isPhoneLandscape ? 6 : isTablet ? 10 : 12;

    const gapX = isPhonePortrait ? 2 : isPhoneLandscape ? 3 : isTablet ? 5 : 6;
    const gapY = isPhonePortrait ? 2 : isPhoneLandscape ? 3 : isTablet ? 5 : 6;

    /**
     * Mobile portrait:
     * Use a dense grid so discarded tiles do not dominate the board.
     */
    if (isPhonePortrait) {
      const preferredColumns = Phaser.Math.Clamp(
        Math.ceil(Math.sqrt(count * (area.width / Math.max(1, area.height)) * aspect)),
        7,
        10,
      );

      const rows = Math.max(1, Math.ceil(count / preferredColumns));

      const widthByColumns =
        (area.width - paddingX * 2 - gapX * (preferredColumns - 1)) /
        preferredColumns;

      const widthByRows =
        (area.height - paddingY * 2 - gapY * (rows - 1)) /
        rows /
        aspect;

      /* const tileWidth = Math.round(
        Phaser.Math.Clamp(
          Math.min(widthByColumns, widthByRows, rackTile.width * 0.42),
          12,
          22,
        ),
      ); */
     const tileWidth = Math.round(
      Phaser.Math.Clamp(
        Math.min(widthByColumns, widthByRows, rackTile.width * 0.66),
        22,
        42,
      ),
    );

      const tileHeight = Math.round(tileWidth * aspect);

      const columns = Math.max(
        1,
        Math.floor((area.width - paddingX * 2 + gapX) / (tileWidth + gapX)),
      );

      return {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        tileWidth,
        tileHeight,
        paddingX,
        paddingY,
        gapX,
        gapY,
        columns,
      };
    }

    /**
     * Mobile landscape:
     * Still compact, but can be slightly larger than portrait.
     */
    if (isPhoneLandscape) {
      const preferredColumns = Phaser.Math.Clamp(
        Math.ceil(Math.sqrt(count * 1.9)),
        10,
        18,
      );

      const rows = Math.max(1, Math.ceil(count / preferredColumns));

      const widthByColumns =
        (area.width - paddingX * 2 - gapX * (preferredColumns - 1)) /
        preferredColumns;

      const widthByRows =
        (area.height - paddingY * 2 - gapY * (rows - 1)) /
        rows /
        aspect;

      /* const tileWidth = Math.round(
        Phaser.Math.Clamp(
          Math.min(widthByColumns, widthByRows, rackTile.width * 0.48),
          14,
          26,
        ),
      ); */

      const tileWidth = Math.round(
        Phaser.Math.Clamp(
          Math.min(widthByColumns, widthByRows, rackTile.width * 0.56),
          17,
          30,
        ),
      );

      const tileHeight = Math.round(tileWidth * aspect);

      const columns = Math.max(
        1,
        Math.floor((area.width - paddingX * 2 + gapX) / (tileWidth + gapX)),
      );

      return {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        tileWidth,
        tileHeight,
        paddingX,
        paddingY,
        gapX,
        gapY,
        columns,
      };
    }

    /**
     * Tablet / desktop:
     * Keep existing visual density but still scale by available area.
     */
    const targetColumns = isTablet ? 14 : 18;
    const targetRows = isTablet ? 5 : 5;

    const widthFromColumns =
      (area.width - paddingX * 2 - gapX * (targetColumns - 1)) /
      targetColumns;

    const widthFromRows =
      (area.height - paddingY * 2 - gapY * (targetRows - 1)) /
      targetRows /
      aspect;

    const tileWidth = Math.round(
      Phaser.Math.Clamp(
        Math.min(widthFromColumns, widthFromRows, rackTile.width * 0.58),
        isTablet ? 22 : 26,
        isTablet ? 38 : 46,
      ),
    );

    const tileHeight = Math.round(tileWidth * aspect);

    const columns = Math.max(
      1,
      Math.floor((area.width - paddingX * 2 + gapX) / (tileWidth + gapX)),
    );

    return {
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      tileWidth,
      tileHeight,
      paddingX,
      paddingY,
      gapX,
      gapY,
      columns,
    };
  }
  
  private rackIndexFromX(x: number): number {
    const slots = this.layout.bottomTileLayout.slots;

    if (slots.length === 0) return 0;

    for (let i = 0; i < slots.length; i++) {
      if (x < slots[i].x) return i;
    }

    return slots.length - 1;
  }
  private rackIndexFromDragX(tileId: string, pointerX: number): number {
    const currentIndex = this.rackOrder.indexOf(tileId);

    if (currentIndex < 0) {
      return -1;
    }

    const slots = this.layout.bottomTileLayout.slots;
    const tileWidth = this.layout.bottomTileLayout.width;

    if (!slots.length) {
      return currentIndex;
    }

    /**
     * Higher value = less sensitive reorder.
     *
     * 0.35 means:
     * - moving right: pointer must cross around 85% of the next tile
     * - moving left: pointer must cross around 15% of the previous tile
     */
    const farSideThreshold = tileWidth * 0.35;

    let targetIndex = currentIndex;

    /**
     * Dragging to the right.
     * Only move after the pointer reaches near the far side of the next slot.
     */
    for (let index = currentIndex + 1; index < this.rackOrder.length; index++) {
      const slot = slots[index];

      if (!slot) continue;

      const thresholdX = slot.x + farSideThreshold;

      if (pointerX >= thresholdX) {
        targetIndex = index;
        continue;
      }

      break;
    }

    /**
     * Dragging to the left.
     * Only move after the pointer reaches near the far side of the previous slot.
     */
    for (let index = currentIndex - 1; index >= 0; index--) {
      const slot = slots[index];

      if (!slot) continue;

      const thresholdX = slot.x - farSideThreshold;

      if (pointerX <= thresholdX) {
        targetIndex = index;
        continue;
      }

      break;
    }

    return targetIndex;
  }

  private isInsideRackArea(x: number, y: number): boolean {
    return this.tileInteractionManager.isPointInsideRect(this.layout.bottomRack, x, y);
  }
  private snapTileToDiscard(runtime: TileRuntime): void {
    if (this.tablePhase !== "playing") {
      this.returnTileToSlot(runtime);
      return;
    }

    this.removeFromRackOrder(runtime.vm.id);

    if (!this.discardedTileIds.includes(runtime.vm.id)) {
      this.discardedTileIds.push(runtime.vm.id);
    }

    this.reindexRackRuntimeSlots();

    runtime.zone = "discard";
    runtime.selected = false;
    runtime.isDragging = false;


    this.selectedIds.delete(runtime.vm.id);
    runtime.image.clearTint();
    
    runtime.image.disableInteractive();
    const grid = this.discardGrid();
    const slot = this.discardSlotFor(
      this.discardedTileIds.indexOf(runtime.vm.id),
      grid,
    );

    runtime.image.setDisplaySize(grid.tileWidth, grid.tileHeight);
    runtime.image.setDepth(this.discardTileDepth());

    this.tweens.killTweensOf(runtime.image);

    this.animationManager.animateDiscardDrop(
      runtime.image,
      Math.round(slot.x),
      Math.round(slot.y),
    );

    this.playHaptic("tile-discard");
    this.playTileDiscardVoice(runtime.vm);

    this.layoutRackTiles(true);
    this.callbacks.onSelectionChanged([...this.selectedIds]);
  }

  // now remove the single tap/click event from the tile when it in the rack
  private snapTileToRackEnd(runtime: TileRuntime): void {
    this.removeFromDiscardOrder(runtime.vm.id);
    this.removeFromRackOrder(runtime.vm.id);

    this.rackOrder.push(runtime.vm.id);
    this.reindexRackRuntimeSlots();

    runtime.zone = "rack";
    runtime.selected = false;
    runtime.isDragging = false;

    runtime.image.clearTint();
    runtime.image.setDepth(30);

    this.returnTileToSlot(runtime);
    this.layoutDiscardTiles(true);
  }

  private applyTileTextureFilter(image: Phaser.GameObjects.Image): void {
    const tileWidth = this.layout.bottomTileLayout.width;

    /* image.texture.setFilter(
      tileWidth <= 34
        ? Phaser.Textures.FilterMode.NEAREST
        : Phaser.Textures.FilterMode.LINEAR,
    ); */
    image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  private layoutRackTiles(animate: boolean): void {
    this.reindexRackRuntimeSlots();

    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);

    for (const runtime of this.tileMap.values()) {
      if (runtime.zone === "discard" || runtime.zone === "pass") continue;

      const slot = this.slotFor(runtime);
      const selectedOffset = runtime.selected ? -tileHeight * 0.18 : 0;

      const targetX = Math.round(slot.x);
      const targetY = Math.round(slot.y + selectedOffset);

      /**
       * Keep the actively dragged tile under the pointer.
       * Do not resize or tween it while rack neighbors rearrange.
       */
      if (runtime.isDragging) {
        runtime.slotIndex = this.rackOrder.indexOf(runtime.vm.id);
        runtime.image.setDepth(100);
        continue;
      }

      this.animationManager.layoutRackTile(
        runtime.image,
        tileWidth,
        tileHeight,
        targetX,
        targetY,
        animate,
      );
    }

    this.layoutDiscardTiles(animate);
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(animate);
    this.updatePassButtonState();
  }
  private layoutDiscardTiles(animate: boolean): void {
    const grid = this.discardGrid();

    this.discardedTileIds.forEach((id, index) => {
      const runtime = this.tileMap.get(id);
      if (!runtime) return;

      const slot = this.discardSlotFor(index, grid);

      runtime.image.setDepth(this.discardTileDepth());
      runtime.image.setDisplaySize(grid.tileWidth, grid.tileHeight);

      if (animate) {
        this.tweens.killTweensOf(runtime.image);
        this.tweens.add({
          targets: runtime.image,
          x: Math.round(slot.x),
          y: Math.round(slot.y),
          angle: 0,
          duration: 140,
          ease: "Sine.easeOut",
        });
      } else {
        runtime.image.setPosition(Math.round(slot.x), Math.round(slot.y));
        runtime.image.setAngle(0);
      }
    });
  }
  private discardTileDepth(): number {
    /**
     * Keep discarded tiles below interactive/pass/card UI.
     * They should feel like board content, not overlay UI.
     */
    return 35;
  }

  private playableDiscardDropRect(): Phaser.Geom.Rectangle {
  const top =
    this.layout.topExposure.y +
    this.layout.topExposure.height +
    this.layout.tableOuter.height * 0.025;

  const bottom =
    this.layout.bottomExposure.y -
    this.layout.tableOuter.height * 0.018;

  const left =
    this.layout.leftExposure.x +
    this.layout.leftExposure.width +
    this.layout.tableOuter.width * 0.025;

  const right =
    this.layout.rightExposure.x -
    this.layout.tableOuter.width * 0.025;

  return new Phaser.Geom.Rectangle(
    left,
    top,
    Math.max(1, right - left),
    Math.max(1, bottom - top),
  );
}

private isInsidePlayableDiscardArea(x: number, y: number): boolean {
  if (this.tablePhase !== "playing") {
    return false;
  }

  return Phaser.Geom.Rectangle.Contains(
    this.playableDiscardDropRect(),
    x,
    y,
  );
}
  private isInsidePlayableDiscardAreaOLD(x: number, y: number): boolean {
    const playableDiscardArea = new Phaser.Geom.Rectangle(
      this.layout.discardArea.x,
      this.layout.discardArea.y + this.layout.hud.height,
      this.layout.discardArea.width,
      this.layout.discardArea.height -
        this.layout.hud.height -
        this.layout.instructionBar.height,
    );

    return this.tileInteractionManager.isPointInsideRect(playableDiscardArea, x, y);
  }


  /**
   * Plays one Charleston round.
   *
   * Example
   *
   * Top -> Right
   * Right -> Bottom
   * Bottom -> Left
   * Left -> Top
   *
   * After animation finishes,
   * caller should update racks.
   */
  public playCharlestonRound(items: readonly PassAnimationItem[]): void {
    this.animationManager.playCharlestonRound(
      items,
      this.layout,
      () => {
        this.game.events.emit(
          "charleston:animation-complete",
          [...this.selectedIds],
        );
      },
    );
  }

  /**
   * ---------------------------------------------------------
   * DEVELOPMENT ONLY
   *
   * Simulates the server telling us that every player
   * has submitted their Charleston tiles.
   *
   * REMOVE this method when multiplayer is connected.
   * ---------------------------------------------------------
   */
  public debugPlayCharleston(): void {

      this.playCharlestonRound([

          {
              from: "top",
              to: "right",
              tileCount: 3,
          },

          {
              from: "right",
              to: "bottom",
              tileCount: 3,
          },

          {
              from: "bottom",
              to: "left",
              tileCount: 3,
          },

          {
              from: "left",
              to: "top",
              tileCount: 3,
          }
      ]);
  }



  /**
   * Moves one rack tile into the destination player's PASS waiting area.
   *
   * During Charleston, this is the preferred mobile UX:
   * drag/drop or double-tap a tile instead of selecting 3 first.
   */
  private snapTileToPassWaiting(runtime: TileRuntime): void {
    if (!this.isPassingPhase()) return;
    if (runtime.zone !== "rack") return;
    if (this.passWaitingTileIds.length >= 3) return;

    // American Mahjong rule: jokers cannot be passed during Charleston.
    if (runtime.vm.suit === "joker") {
      this.returnTileToSlot(runtime);
      return;
    }

    this.removeFromRackOrder(runtime.vm.id);
    this.reindexRackRuntimeSlots();

    runtime.zone = "pass";
    runtime.selected = false;
    runtime.isDragging = false;

    this.selectedIds.delete(runtime.vm.id);
    runtime.image.clearTint();
    runtime.image.setAlpha(1);
    runtime.image.setDepth(90);

    this.passFlowManager.addPassWaitingTile(runtime.vm.id);
    this.ensurePassCloseButton(runtime.vm.id);

    this.playHaptic("tile-pass");
    this.playSfx("tile-pass-waiting");
    this.layoutRackTiles(true);
    this.layoutPassWaitingTiles(true);
    this.callbacks.onSelectionChanged([...this.selectedIds]);
  }


  private returnPassTileToRack(tileId: string): void {
    const runtime = this.tileMap.get(tileId);
    if (!runtime) return;
    console.log("RETURN START", {
      tileId,
      zone: runtime.zone,
      passWaitingTileIds: [...this.passWaitingTileIds],
      rackOrder: [...this.rackOrder],
      hasCloseButton: this.passCloseButtons.has(tileId),
    });
    if (runtime.zone !== "pass") return;
    this.playHaptic("tile-return");

    const close = this.passCloseButtons.get(tileId);
    close?.disableInteractive();

    this.tweens.killTweensOf(runtime.image);

    this.playSfx("tile-return");
    if (close) {
      this.tweens.killTweensOf(close);
      this.tweens.add({
        targets: close,
        alpha: 0,
        scaleX: 0.65,
        scaleY: 0.65,
        duration: 90,
        ease: "Sine.easeOut",
      });
    }

    const startWidth = runtime.image.displayWidth;
    const startHeight = runtime.image.displayHeight;

    const rackWidth = Math.round(this.layout.bottomTileLayout.width);
    const rackHeight = Math.round(this.layout.bottomTileLayout.height);


    /**
     * Update source-of-truth immediately.
     * Do not wait until animation complete, otherwise this tile can be pulled
     * back into pass area by layoutPassWaitingTiles().
     */
    this.removeFromPassWaiting(tileId);
    
    /* console.log("RETURN AFTER REMOVE", {
      tileId,
      zone: runtime.zone,
      passWaitingTileIds: [...this.passWaitingTileIds],
      rackOrder: [...this.rackOrder],
      hasCloseButton: this.passCloseButtons.has(tileId),
    }); */

    runtime.zone = "rack";
    runtime.selected = false;
    runtime.isDragging = false;

    this.selectedIds.delete(tileId);
    runtime.image.clearTint();

    this.removeFromRackOrder(tileId);
    this.rackOrder.push(tileId);
    this.reindexRackRuntimeSlots();

    this.layoutPassWaitingTiles(true);
    this.updatePassButtonState();
    this.callbacks.onSelectionChanged([...this.selectedIds]);

    const targetIndex = this.rackOrder.length;
    const targetSlot =
      this.layout.bottomTileLayout.slots[targetIndex] ??
      this.layout.bottomTileLayout.slots[this.layout.bottomTileLayout.slots.length - 1] ??
      {
        x: this.layout.bottomRack.x + this.layout.bottomRack.width / 2,
        y: this.layout.bottomRack.y + this.layout.bottomRack.height / 2,
      };

    runtime.image.setDepth(140);
    runtime.image.disableInteractive();

    const progress = { value: 0 };

    this.tweens.add({
      targets: progress,
      value: 1,
      duration: 320,
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        /**
         * Keep the tile small for the first part of travel,
         * then grow it near the rack. This avoids the current jump.
         */
        const growProgress = Phaser.Math.Clamp((progress.value - 0.55) / 0.45, 0, 1);
        const easedGrow = Phaser.Math.Easing.Sine.Out(growProgress);

        const width = Phaser.Math.Linear(startWidth, rackWidth, easedGrow);
        const height = Phaser.Math.Linear(startHeight, rackHeight, easedGrow);

        runtime.image.setDisplaySize(width, height);
      },
    });

    this.tweens.add({
      targets: runtime.image,
      x: Math.round(targetSlot.x),
      y: Math.round(targetSlot.y),
      angle: 0,
      duration: 320,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        /**
         * Now update source-of-truth state.
         * Until this point, the tile remained a PASS tile visually.
         */
        runtime.image.setAlpha(1);
        runtime.image.setDepth(30);
        runtime.image.setAngle(0);
        runtime.image.setDisplaySize(rackWidth, rackHeight);
        runtime.image.setInteractive({
          useHandCursor: true,
          draggable: true,
          pixelPerfect: false,
        });

        this.layoutRackTiles(false);
      },
    });
  }

  /**
   * Removes tile id and close button from PASS waiting state.
   */
  private removeFromPassWaiting(tileId: string): void {
    this.passFlowManager.removePassWaitingTile(tileId);

    const close = this.passCloseButtons.get(tileId);
    close?.destroy();
    this.passCloseButtons.delete(tileId);
  }

  private ensurePassCloseButton(tileId: string): void {
    if (this.passCloseButtons.has(tileId)) return;

    const radius = this.passCloseButtonRadius();

    const circle = this.add.circle(0, 0, radius, 0xff1f1f, 1);

    const label = this.add
      .text(0, 0, "×", {
        fontFamily: "Poppins, Arial",
        fontSize: `${Math.round(radius * 1.45)}px`,
        fontStyle: "700",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const button = this.add.container(0, 0, [circle, label]).setDepth(130);

    button.setInteractive(
      new Phaser.Geom.Circle(0, 0, radius),
      Phaser.Geom.Circle.Contains,
    );

    button.on("pointerdown", (event: Phaser.Input.Pointer) => {
      event.event?.stopPropagation?.();
      this.returnPassTileToRack(tileId);
    });

    this.passCloseButtons.set(tileId, button);
  }

  private passCloseButtonRadius(): number {
    const size = this.passTileDisplaySize(this.currentPassDestination);

    return Math.max(
      6,
      Math.round(Math.min(size.width, size.height) * 0.16),
    );
  }

  private resizePassCloseButton(button: Phaser.GameObjects.Container): void {
    const radius = this.passCloseButtonRadius();

    const circle = button.list[0] as Phaser.GameObjects.Arc;
    const label = button.list[1] as Phaser.GameObjects.Text;

    circle.setRadius(radius);
    label.setFontSize(Math.round(radius * 1.45));

    button.setInteractive(
      new Phaser.Geom.Circle(0, 0, radius),
      Phaser.Geom.Circle.Contains,
    );
  }

  /**
   * Draws a subtle PASS waiting drop zone in front of the destination exposure.
   * Keeps PASS waiting area logic alive without drawing visible background/border.
   * 
   * The area is still used for drag/drop hit detection through
   * passWaitingAreaRect(), but nothing is rendered on screen.
  */
  private layoutPassWaitingArea(): void {
    if (this.passWaitingAreaGraphics) {
      this.passWaitingAreaGraphics.clear();
    }
  }

  // Positions all tiles currently sitting in the PASS waiting area.
  private layoutPassWaitingTiles(animate: boolean): void {
    const ids = [...this.passWaitingTileIds];
    const targets = this.passAreaTargets(this.currentPassDestination, ids.length);
    const angle = this.passTileAngle(this.currentPassDestination);
    const size = this.passTileDisplaySize(this.currentPassDestination);
    this.animationManager.layoutPassWaitingTiles(
      ids.map((id) => ({ id, image: this.tileMap.get(id)?.image })),
      targets,
      size,
      angle,
      animate,
      (tileId) => this.positionPassCloseButton(tileId),
    );
  }

  private positionPassCloseButton(tileId: string): void {
    const runtime = this.tileMap.get(tileId);
    const close = this.passCloseButtons.get(tileId);

    if (!runtime || !close) return;

    const size = this.passTileDisplaySize(this.currentPassDestination);
    const closeRadius = this.passCloseButtonRadius();

    const corner = this.rotatedTileCorner(
      runtime.image.x,
      runtime.image.y,
      size.width,
      size.height,
      runtime.image.angle,
      "top-right",
    );

    const outwardX = corner.x - runtime.image.x;
    const outwardY = corner.y - runtime.image.y;
    const length = Math.max(1, Math.hypot(outwardX, outwardY));

    close.setPosition(
      Math.round(corner.x + (outwardX / length) * closeRadius * 0.35),
      Math.round(corner.y + (outwardY / length) * closeRadius * 0.35),
    );
  }
  /**
   * Positions the close button near the visible corner of a rotated PASS tile.
   */
  private rotatedTileCorner(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    angleDeg: number,
    corner: "top-right" | "top-left" | "bottom-right" | "bottom-left",
  ): Point {
    const local = (() => {
      switch (corner) {
        case "top-right":
          return { x: width / 2, y: -height / 2 };

        case "top-left":
          return { x: -width / 2, y: -height / 2 };

        case "bottom-right":
          return { x: width / 2, y: height / 2 };

        case "bottom-left":
          return { x: -width / 2, y: height / 2 };
      }
    })();

    const angle = Phaser.Math.DegToRad(angleDeg);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: centerX + local.x * cos - local.y * sin,
      y: centerY + local.x * sin + local.y * cos,
    };
  }

  /**
   * Checks if pointer is inside current PASS waiting drop zone.
   */
  private isInsidePassWaitingArea(x: number, y: number): boolean {
    const rect = this.passWaitingAreaRect(this.currentPassDestination);

    return this.tileInteractionManager.isPointInsideRect(rect, x, y);
  }

  private passWaitingAreaRect(seat: "top" | "right" | "bottom" | "left"): Rect {
    const size = this.passTileDisplaySize(seat);
    const padding = Math.max(8, size.width * 0.22);

    if (seat === "right") {
      const width = size.height + padding * 2;
      const height = size.width * 3 + padding * 2;

      return {
        x: this.layout.rightExposure.x - width - padding,
        y: this.layout.rightExposure.y + this.layout.rightExposure.height / 2 - height / 2,
        width,
        height,
      };
    }

    if (seat === "left") {
      const width = size.height + padding * 2;
      const height = size.width * 3 + padding * 2;

      return {
        x: this.layout.leftExposure.x + this.layout.leftExposure.width + padding,
        y: this.layout.leftExposure.y + this.layout.leftExposure.height / 2 - height / 2,
        width,
        height,
      };
    }

    if (seat === "top") {
      const width = size.width * 3 + padding * 2;
      const height = size.height + padding * 2;

      return {
        x: this.layout.topExposure.x + this.layout.topExposure.width / 2 - width / 2,
        y: this.layout.topExposure.y + this.layout.topExposure.height + padding,
        width,
        height,
      };
    }

    const width = size.width * 3 + padding * 2;
    const height = size.height + padding * 2;

    return {
      x: this.layout.bottomExposure.x + this.layout.bottomExposure.width / 2 - width / 2,
      y: this.layout.bottomExposure.y - height - padding,
      width,
      height,
    };
  }

  private passAreaTargets(
    seat: "top" | "right" | "bottom" | "left",
    count: number,
  ): readonly Point[] {
    const rect = this.passWaitingAreaRect(seat);
    const size = this.passTileDisplaySize(seat);
    const step = size.width * 0.9;

    if (seat === "right" || seat === "left") {
      const x = rect.x + rect.width / 2;
      const startY = rect.y + rect.height / 2 - step * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * step),
      }));
    }

    /**
     * TOP PASS TARGETS
     *
     * Selected pass tiles should appear above the instruction/PASS popup,
     * not over the popup.
     *
     * Do this only for top so left/right/bottom behavior remains unchanged.
     */
    if (seat === "top") {
      const card = this.layout.instructionBar;

      const gapAboveCard = Math.max(
        8,
        Math.round(size.height * 0.22),
      );

      const minY =
        this.layout.topExposure.y +
        this.layout.topExposure.height +
        size.height * 0.60;

      const preferredY =
        card.y - gapAboveCard - size.height / 2;

      const y = Math.max(minY, preferredY);

      const startX = card.x + card.width / 2 - step * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(startX + index * step),
        y: Math.round(y),
      }));
    }

    /**
     * BOTTOM / fallback behavior unchanged.
     */
    const y = rect.y + rect.height / 2;
    const startX = rect.x + rect.width / 2 - step * (count - 1) / 2;

    return Array.from({ length: count }, (_, index) => ({
      x: Math.round(startX + index * step),
      y: Math.round(y),
    }));
  }
  private passTileDisplaySize(seat: "top" | "right" | "bottom" | "left"): {
    readonly width: number;
    readonly height: number;
  } {
    const rackWidth = this.layout.bottomTileLayout.width;

    /**
     * Current size was rackWidth * 1.22.
     * This makes PASS waiting tiles clearly smaller than rack tiles.
     */
    const width = Math.round(
      Phaser.Math.Clamp(
        rackWidth * 0.82,
        rackWidth * 0.72,
        rackWidth * 0.95,
      ),
    );

    const height = Math.round(width * this.config.rack.tileAspect);

    return { width, height };
  }

  private passTileAngle(seat: "top" | "right" | "bottom" | "left"): number {
    switch (seat) {
      case "right":
        return 90;

      case "left":
        return -90;

      case "top":
        return 0;

      case "bottom":
        return 0;
    }
  }

  /**
   * PASS button becomes active only when the waiting area has 3 tiles.
   */
  private canSubmitPassWaitingTiles(): boolean {
    return this.passFlowManager.canSubmitPassWaitingTiles();
  }

  /**
   * Final submit after 3 tiles are placed in PASS waiting area.
   *
   * Current local implementation:
   * - disables the PASS area
   * - removes passed tiles from local rack
   * - notifies Angular
   *
   * Later multiplayer version:
   * - sends tile ids to server
   * - waits for all players
   * - runs Charleston exchange animation
   * - applies server rack result
   */
  private submitPassWaitingTiles(): void {
    if (!this.passFlowManager.beginSubmission()) return;

    const ids = [...this.passWaitingTileIds];

    ids.forEach((id) => {
      const runtime = this.tileMap.get(id);
      runtime?.image.disableInteractive();

      const close = this.passCloseButtons.get(id);
      close?.disableInteractive();
      close?.setVisible(false);
    });

    this.passFlowManager.requestSubmissionUiUpdate();
    this.playSfx("pass");
    this.animatePassWaitingTilesIntoSeatRack(ids, () => {
      this.applyPassWaitingResult(ids);
    });
  }
  private animatePassWaitingTilesIntoSeatRack(
    ids: readonly string[],
    onFinished: () => void,
  ): void {
    const destination = this.currentPassDestination;
    const endTargets = this.seatRackTargets(destination, ids.length);
    const endAngle = this.passTileAngle(destination);
    this.animationManager.animatePassWaitingTilesIntoSeatRack(
      ids.map((id) => ({ id, image: this.tileMap.get(id)?.image })),
      endTargets,
      this.passTileDisplaySize(destination),
      endAngle,
      (clone) => this.passAnimationClones.push(clone),
      onFinished,
    );
  }
  private createTileBackClone(
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number,
  ): Phaser.GameObjects.Container {
    const radius = Math.max(4, Math.min(width, height) * 0.12);
    const strokeWidth = Math.max(1, Math.round(Math.min(width, height) * 0.045));

    const graphics = this.add.graphics();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      radius,
    );

    graphics.lineStyle(strokeWidth, 0xd9d9d9, 1);
    graphics.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      radius,
    );

    const innerInset = Math.max(3, Math.min(width, height) * 0.08);
    const innerRadius = Math.max(3, radius - innerInset * 0.35);

    graphics.lineStyle(1, 0xf1f5f9, 1);
    graphics.strokeRoundedRect(
      -width / 2 + innerInset,
      -height / 2 + innerInset,
      width - innerInset * 2,
      height - innerInset * 2,
      innerRadius,
    );

    return this.add
      .container(x, y, [graphics])
      .setAngle(angle)
      .setDepth(180)
      .setScale(0, 1)
      .setAlpha(1);
  }

  private seatRackTargets(
    seat: "top" | "right" | "bottom" | "left",
    count: number,
  ): readonly Point[] {
    const size = this.passTileDisplaySize(seat);

    if (seat === "right") {
      const x = this.layout.rightExposure.x + this.layout.rightExposure.width / 2;
      const step = size.width * 0.82;
      const startY =
        this.layout.rightExposure.y +
        this.layout.rightExposure.height / 2 -
        (step * (count - 1)) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * step),
      }));
    }

    if (seat === "left") {
      const x = this.layout.leftExposure.x + this.layout.leftExposure.width / 2;
      const step = size.width * 0.82;
      const startY =
        this.layout.leftExposure.y +
        this.layout.leftExposure.height / 2 -
        (step * (count - 1)) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * step),
      }));
    }

    if (seat === "top") {
      const y = this.layout.topExposure.y + this.layout.topExposure.height / 2;
      const step = size.width * 0.82;
      const startX =
        this.layout.topExposure.x +
        this.layout.topExposure.width / 2 -
        (step * (count - 1)) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(startX + index * step),
        y: Math.round(y),
      }));
    }

    const y = this.layout.bottomExposure.y + this.layout.bottomExposure.height / 2;
    const step = size.width * 0.82;
    const startX =
      this.layout.bottomExposure.x +
      this.layout.bottomExposure.width / 2 -
      (step * (count - 1)) / 2;

    return Array.from({ length: count }, (_, index) => ({
      x: Math.round(startX + index * step),
      y: Math.round(y),
    }));
  }
  /**
   * Applies current local pass result.
   * In production this will be replaced by applying the server-authoritative rack.
   */
  private applyPassWaitingResult(ids: readonly string[]): void {
    this.passFlowManager.applyPassWaitingResult(ids, {
      onTileRemoved: (runtime) => runtime.image.destroy(),
      onCloseButtonRemoved: (tileId) => this.passCloseButtons.get(tileId)?.destroy(),
      onSelectionChanged: () => this.callbacks.onSelectionChanged([]),
      onPassCompleted: (payload) => this.callbacks.onPassCompleted(payload),
      onLayoutRequested: () => this.resize(this.scale.width, this.scale.height),
    });
  }

  /**
   * Updates PASS button visual state.
   */
  private updatePassButtonState(): void {
    this.uiLayoutManager.updatePassButtonState({
      layout: this.layout,
      tablePhase: this.tablePhase,
      passWaitingCount: this.passWaitingTileIds.length,
      canSubmitPass: this.canSubmitPassWaitingTiles(),
      isPassAnimating: this.isPassAnimating,
      isPickAnimating: this.isPickAnimating,
      wallTileCount: this.wallTileCount,
    });

    this.uiLayoutManager.layoutPickSeatSelector(
      this.layout,
      this.tablePhase,
      this.pickTargetSeat,
    );
  }
  


  private passDestinationForDirection(direction: PassDirection): TableSeat {
    return this.passFlowManager.destinationForDirection(direction);
  }

  private playHaptic(type: GameHapticType): void {
    this.soundManager.playHaptic(type);
    /* Legacy Scene implementation retained for reference:
    this.callbacks.onHaptic?.(type);
    */
  }

  
  private playSfx(id: TableSfxId): void {
    this.soundManager.playSfx(id);
  }
  

  private layoutPickSeatSelector(): void {
    this.uiLayoutManager.layoutPickSeatSelector(
      this.layout,
      this.tablePhase,
      this.pickTargetSeat,
    );
  }

  private updatePickSeatSelectorState(): void {
    this.uiLayoutManager.updatePickSeatSelectorState(this.pickTargetSeat);
  }


  private pickTileForSeat(seat: TableSeat): void {
    if (this.tablePhase !== "playing") return;
    if (this.isPickAnimating) return;
    if (this.wallTileCount <= 0) return;

    this.isPickAnimating = true;
    this.wallTileCount -= 1;

    this.updateWallCountText();
    this.updatePassButtonState();

    const pickedTile = seat === "bottom" ? this.createMockPickedTile() : undefined;

    this.animateWallTileToSeat(seat, pickedTile, () => {
      if (seat === "bottom" && pickedTile) {
        this.addMockPickedTileToRack(pickedTile);
      }

      this.isPickAnimating = false;
      this.updatePassButtonState();
      this.updateInstructionText();
    });
  }

  private animateWallTileToSeat(
    seat: TableSeat,
    pickedTile: TileVm | undefined,
    onComplete: () => void,
  ): void {
    const source = this.wallTileSourcePoint();
    const target = this.pickTargetPointForSeat(seat);
    const size = this.pickAnimationTileSize(seat);
    const startSize = this.wallTileBoxSize();

    const startScale = Phaser.Math.Clamp(
      startSize.height / size.height,
      0.35,
      0.72,
    );

    const clone =
      seat === "bottom" && pickedTile
        ? this.createTileFrontPickClone(
            pickedTile,
            source.x,
            source.y,
            size.width,
            size.height,
          )
        : this.createTileBackClone(
            source.x,
            source.y,
            size.width,
            size.height,
            0,
          );

    /* this.animationManager.animateWallPick(
      clone,
      target,
      this.pickTileAngleForSeat(seat),
      this.pickAnimationDurationForSeat(seat),
      startScale,
      seat === "bottom",
      onComplete,
    ); */
    this.animationManager.animateWallPick(
      clone,
      target,
      this.pickTileAngleForSeat(seat),
      this.pickAnimationDurationForSeat(seat),
      startScale,
      seat === "bottom",
      onComplete,
      this.pickAnimationFinalScaleForDevice(seat),
      this.pickAnimationGrowStartForDevice(),
    );
  }
  private pickAnimationFinalScaleForDevice(seat: TableSeat): number {
    const width = this.layout.canvas.width;
    const height = this.layout.canvas.height;

    const isPhonePortrait =
      height >= width &&
      width <= 520;

    const isPhoneLandscape =
      width > height &&
      height <= 520 &&
      width <= 980;

    const isTabletPortrait =
      height >= width &&
      width > 520 &&
      width <= 1180 &&
      height <= 1400;

    const isTabletLandscape =
      width > height &&
      width > 760 &&
      width <= 1180 &&
      height > 520 &&
      height <= 900;

    /**
     * Bottom/current-user pick animation.
     * This controls only the flying clone, not the final rack tile.
     */
    if (seat === "bottom") {
      if (isPhonePortrait) return 0.46;
      if (isPhoneLandscape) return 0.48;
      if (isTabletPortrait) return 0.64;
      if (isTabletLandscape) return 0.68;

      return 1;
    }

    /**
     * Opponent/back-tile pick animation.
     */
    if (isPhonePortrait) return 0.58;
    if (isPhoneLandscape) return 0.60;
    if (isTabletPortrait) return 0.74;
    if (isTabletLandscape) return 0.78;

    return 1;
  }

  private pickAnimationGrowStartForDevice(): number {
    const width = this.layout.canvas.width;
    const height = this.layout.canvas.height;

    const isPhone =
      (height >= width && width <= 520) ||
      (width > height && height <= 520 && width <= 980);

    const isTablet =
      (height >= width && width > 520 && width <= 1180 && height <= 1400) ||
      (width > height && width > 760 && width <= 1180 && height > 520 && height <= 900);

    if (isPhone) {
      return 0.84;
    }

    if (isTablet) {
      return 0.70;
    }

    return 0.62;
  }

  
  

  private createTileFrontPickClone(
    tile: TileVm,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Phaser.GameObjects.Image {
    const texture = this.tileTextureResolver.resolve(tile, Math.round(width));

    if (
      !this.textures.exists(texture.atlasKey) ||
      !this.textures.get(texture.atlasKey).has(texture.frameKey)
    ) {
      /**
       * Fallback only. In normal flow the atlas is already loaded by setRack().
       */
      const fallback = this.add.image(x, y, TILE_ATLAS_1X_KEY);
      fallback.setOrigin(0.5);
      fallback.setDisplaySize(width, height);
      return fallback;
    }

    const image = this.add.image(x, y, texture.atlasKey, texture.frameKey);
    image.setOrigin(0.5);
    image.setDisplaySize(width, height);
    this.applyTileTextureFilter(image);

    return image;
  }

  

  private pickTileAngleForSeat(seat: TableSeat): number {
    if (seat === "right") return 90;
    if (seat === "left") return -90;

    return 0;
  }

  private pickAnimationDurationForSeat(seat: TableSeat): number {
    if (seat === "bottom") return 420;
    if (seat === "top") return 260;
    return 340;
  }

  private pickAnimationTileSize(seat: TableSeat): {
    readonly width: number;
    readonly height: number;
  } {
    if (seat === "bottom") {
      return {
        width: Math.round(this.layout.bottomTileLayout.width),
        height: Math.round(this.layout.bottomTileLayout.height),
      };
    }

    return this.passTileDisplaySize(seat);
  }
  
  private pickTargetPointForSeat(seat: TableSeat): Point {
    if (seat === "bottom") {
      const nextLayout = this.layoutEngine.compute(
        this.scale.width,
        this.scale.height,
        //this.rackTiles.length + 1,
        Math.max(14, this.rackOrder.length + 1),
        this.config,
        this.safeAreaInsets,
      );

      const nextIndex = this.rackOrder.length;

      return (
        nextLayout.bottomTileLayout.slots[nextIndex] ??
        nextLayout.bottomTileLayout.slots[nextLayout.bottomTileLayout.slots.length - 1] ??
        {
          x: nextLayout.bottomRack.x + nextLayout.bottomRack.width / 2,
          y: nextLayout.bottomRack.y + nextLayout.bottomRack.height / 2,
        }
      );
    }

    if (seat === "top") {
      return this.topSeatPickTargetPoint();
    }

    const targets = this.seatRackTargets(seat, 1);

    return (
      targets[0] ?? {
        x: this.layout.hud.x + this.layout.hud.width / 2,
        y: this.layout.hud.y + this.layout.hud.height / 2,
      }
    );
  }


  private topSeatPickTargetPoint(): Point {
    const topRack = this.layout.topExposure;
    const size = this.pickAnimationTileSize("top");

    /**
     * Top seat PICK animation target:
     * End at the left corner of the top seat rack/exposure area.
     *
     * Source is still the wall tile box.
     * This only changes the final destination.
     */
    return {
      x: Math.round(topRack.x + size.width / 2),
      y: Math.round(topRack.y + topRack.height / 2),
    };
  }
  private createMockPickedTile(): TileVm {
    const sequence = this.nextMockTileId++;
    const rank = ((sequence - 1) % 9) + 1;

    return {
      id: `mock-pick-${sequence}`,
      label: `Dot ${rank}`,
      suit: "dot",
      asset: `assets/game/tiles/dot_${rank}.svg`,
      soundKey: `${rank}-dot`,
    } as TileVm;
  }

  private addMockPickedTileToRack(tile: TileVm): void {
    /**
     * Temporary local-only testing path.
     * Later replace this with game-engine/server draw result.
     */
    this.setRack([...this.rackTiles, tile]);
  }
}
