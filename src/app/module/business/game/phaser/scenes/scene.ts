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
import { StateManager } from "./managers/state";
import { TileInteractionManager } from "./managers/tile-interaction";
import { UiLayoutManager } from "./managers/ui-layout";
import {
  type ExposurePanelMode,
  exposureLipRatio,
  exposureNameStripRatio,
} from "../exposure-panel.tokens";
import { COLOR_AVOCADO_NUM, COLOR_BLUE_NUM, COLOR_FUSHIA, COLOR_GRAY_NUM, COLOR_LAVENDER_NUM, FONT_FAMILY, ICON_DEADHAND_HOVER, ICON_DEADHAND_NORMAL, ICON_DEADHAND_PRESSED, ICON_HELP_HOVER, ICON_HELP_NORMAL, ICON_HELP_PRESSED, ICON_HINT_HOVER, ICON_HINT_NORMAL, ICON_HINT_PRESSED, ICON_SETTINGS_HOVER, ICON_SETTINGS_NORMAL, ICON_SETTINGS_PRESSED, ICON_SORT_HOVER, ICON_SORT_NORMAL, ICON_SORT_PRESSED } from "../const";
import { HudActionKey, HamburgerMenuActionKey, TableSeat, TileRuntime, BotPassVisualTile, TableSceneCallbacks, TableSfxId, TableSfxConfig, DiscardGrid, CharlestonVisualTransfer } from "./type";

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
  private mobileHeaderCollapsed = true;
  private mobileHeaderToggle?: Phaser.GameObjects.Container;
  private mobileHeaderToggleLabel?: Phaser.GameObjects.Text;

  private readableRenderDpr(): number {
    return Phaser.Math.Clamp(window.devicePixelRatio || 1, 1, 2);
  }

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
  private safeAreaInsets: SafeAreaInsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  private readonly botPassVisualTiles: BotPassVisualTile[] = [];
  private botPassVisualSequence = 0;
  private isBotPassVisualAnimating = false;
  
  private hasCompletedFirstCharlestonVisualPass = false;

  private lastSubmittedPassDestination?: TableSeat;
  private botAutoStagedDestination?: TableSeat;

  private readonly botPassWaitingPauseMs = 320;
  private readonly botPassMoveDurationMs = 620;
  private readonly botPassCommitDurationMs = 520;


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
    this.input.setTopOnly(true);
    this.input.dragDistanceThreshold = 4;
    this.input.dragTimeThreshold = 60;
    this.game.events.on("rack:set", this.setRack, this);
    this.game.events.on("pass:direction", this.setPassDirection, this);
    this.game.events.on("table:resize", this.resize, this);
    this.game.events.on("table:phase", this.setTablePhase, this);
    this.game.events.on("table:safe-area", this.setSafeAreaInsets, this);
    this.game.events.on("table:active-seat", this.setActiveSeat, this);
    
    
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

      this.clearBotPassVisualTiles();
      this.isBotPassVisualAnimating = false;
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

    // Hud action ICONS
    this.load.image(ICON_SORT_NORMAL, "assets/game/icons/icon_sort_default.png");
    this.load.image(ICON_SORT_HOVER, "assets/game/icons/icon_sort_hover.png");
    this.load.image(ICON_SORT_PRESSED, "assets/game/icons/icon_sort_pressed.png");

    this.load.image(ICON_HINT_NORMAL, "assets/game/icons/icon_hint_default.png");
    this.load.image(ICON_HINT_HOVER, "assets/game/icons/icon_hint_hover.png");
    this.load.image(ICON_HINT_PRESSED, "assets/game/icons/icon_hint_pressed.png");

    this.load.image(ICON_DEADHAND_NORMAL, "assets/game/icons/icon_deadhand_default.png");
    this.load.image(ICON_DEADHAND_HOVER, "assets/game/icons/icon_deadhand_hover.png");
    this.load.image(ICON_DEADHAND_PRESSED, "assets/game/icons/icon_deadhand_pressed.png");

    this.load.image(ICON_SETTINGS_NORMAL, "assets/game/icons/icon_settings_default.png");
    this.load.image(ICON_SETTINGS_HOVER, "assets/game/icons/icon_settings_hover.png");
    this.load.image(ICON_SETTINGS_PRESSED, "assets/game/icons/icon_settings_pressed.png");

    this.load.image(ICON_HELP_NORMAL, "assets/game/icons/icon_help_default.png");
    this.load.image(ICON_HELP_HOVER, "assets/game/icons/icon_help_hover.png");
    this.load.image(ICON_HELP_PRESSED, "assets/game/icons/icon_help_pressed.png");
  }

  private setSafeAreaInsets(insets: SafeAreaInsets): void {
    this.safeAreaInsets = insets;
  }
  private playTileDiscardVoice(vm: TileVm): void {
    this.soundManager.playTileDiscardVoice(vm);
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
    if (this.isBotPassVisualAnimating) return;

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

    if (phase !== "passing") {
      this.clearBotPassVisualTiles();
      this.isBotPassVisualAnimating = false;
      this.hasCompletedFirstCharlestonVisualPass = false;
      this.lastSubmittedPassDestination = undefined;
      this.botAutoStagedDestination = undefined;
    }

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
    this.renderDpr = this.readableRenderDpr();

    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);

    this.layout = this.layoutEngine.compute(
      this.callbacks.getDeviceLayout(width, height),
      this.activeRackLayoutTileCount(),
      this.config,
      this.safeAreaInsets,
    );
    this.callbacks.onMobileHeaderChanged(
      this.layout.metrics.isMobile && this.mobileHeaderCollapsed,
    );

    this.drawTable();
    this.layoutStaticUi();
    this.layoutMobileHeaderToggle();
    this.layoutRackTiles(false);
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
    this.relayoutBotPassVisualTilesAfterResize();
    this.updatePassButtonState();
    this.refreshRackTexturesIfAtlasChanged();
  }

  private activeRackLayoutTileCount(): number {    
    return Math.max(14, this.rackOrder.length);
  }

  private resizeW(width: number, height: number): void {
    this.renderDpr = this.readableRenderDpr();

    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);

    this.layout = this.layoutEngine.compute(
      this.callbacks.getDeviceLayout(width, height),
      this.rackTiles.length || 14,
      this.config,
    );

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
    this.time.delayedCall(120, () => {
      this.tryAutoStageBotPassTilesForCurrentDirection();
    });
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
      this.relayoutBotPassVisualTilesAfterResize();
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
              this.isInsidePlayablePassDropArea(pointer.worldX, pointer.worldY)
            );
        
        if (isPassingDropTarget) {
          return;
        }

        
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
          this.isInsidePlayablePassDropArea(pointer.worldX, pointer.worldY)
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
      if (runtime.zone === "discard") return;
      if (runtime.zone !== "rack") return;

      const now = this.time.now;
      const previous = this.lastTapAtByTileId.get(runtime.vm.id) ?? 0;
      const isDoubleTap = now - previous <= this.doubleTapMs;

      this.lastTapAtByTileId.set(runtime.vm.id, now);
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
        this.snapTileToDiscard(runtime);
      }
    });
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

    const pageColor = COLOR_BLUE_NUM; //0x121a36; //0xDAB6D6
    const hudColor = COLOR_BLUE_NUM; //0x121a36;
    const tableBorderDark = 0x0b1228;
    const tableBorderInnerShadowGray = COLOR_GRAY_NUM;
    const tableBorderMid = 0x27314f;
    const tableBorderPink = 0xd64abf;
    const feltColor = COLOR_LAVENDER_NUM;//0xc783b8;
    const panelColor = 0x162449;
    const panelInner = 0x253a78;

    g.fillStyle(pageColor, 1);
    g.fillRect(0, 0, canvas.width, canvas.height);

    // Header.
    g.fillStyle(hudColor, 1);
    g.fillRect(hud.x, hud.y, hud.width, hud.height);


    
    const borderSize = Math.max(
      6,
      Math.round(Math.min(table.width, table.height) * 0.009),
    );

    g.fillStyle(tableBorderDark, 1);
    g.fillRoundedRect(
      table.x,
      table.y,
      table.width,
      table.height,
      0,
    );

    
    const feltX = table.x + borderSize;
    const feltY = table.y + borderSize;
    const feltWidth = table.width - borderSize * 2;
    const feltHeight = table.height - borderSize * 2;

    g.fillStyle(feltColor, 1);
    g.fillRoundedRect(
      feltX,
      feltY,
      feltWidth,
      feltHeight,
      0,
    );

    
    
    const insetShadowWidth = Math.max(
      2,
      Math.round(borderSize * 0.26),
    );

    g.lineStyle(
      insetShadowWidth,
      0x000000,
      0.13,
    );

    g.strokeRoundedRect(
      feltX + insetShadowWidth / 2,
      feltY + insetShadowWidth / 2,
      feltWidth - insetShadowWidth,
      feltHeight - insetShadowWidth,
      0,
    );

    
    const liftWidth = Math.max(1, Math.round(borderSize * 0.10));

    g.lineStyle(
      liftWidth,
      0xffffff,
      0.03,
    );

    g.strokeRoundedRect(
      feltX + liftWidth / 2,
      feltY + liftWidth / 2,
      feltWidth - liftWidth,
      feltHeight - liftWidth,
      0,
    );

    g.fillStyle(0xffffff, 0.035);
    g.fillRoundedRect(
      this.layout.discardArea.x,
      this.layout.discardArea.y,
      this.layout.discardArea.width,
      this.layout.discardArea.height,
      14,
    );

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

    const card = this.layout.instructionBar;

    const cardRadius = Math.round(
      Phaser.Math.Clamp(card.height * 0.22, 16, 34),
    );

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

    g.fillStyle(0xffffff, 0.98);
    g.fillRoundedRect(
      card.x,
      card.y,
      card.width,
      card.height,
      cardRadius,
    );

    g.fillStyle(0xfffbf2, 0.20);
    g.fillRoundedRect(
      card.x + 2,
      card.y + 2,
      card.width - 4,
      card.height - 4,
      Math.max(10, cardRadius - 2),
    );

    g.lineStyle(
      Math.max(2, Math.round(card.height * 0.018)),
      COLOR_AVOCADO_NUM,
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

    const compactMobile = this.layout.metrics.isMobile;

    
    const modeKey = this.exposurePanelMode();

    
    const lipRatio = exposureLipRatio(modeKey);

    const nameStripRatio =  exposureNameStripRatio(modeKey);

    const lipW = Math.max(
      compactMobile ? 4 : 8,
      Math.round(w * lipRatio),
    );

    const nameStripW = Math.max(
      compactMobile ? 3 : 8,
      Math.round(w * nameStripRatio),
    );

    const dividerW = 1;

    const stripFill = active ? 0xd7d33a : 0x22488f;
    const stripHighlight = active ? 0xf0eb78 : 0x3c63bb;
    const dividerFill = active ? 0x9b9722 : 0x8ea4d0;

    
    const shadowOffsetX = 2;
    const shadowOffsetY = 3;
    const shadowSpread = 2;
    
    // --- FIXED SHADOW SYSTEM ---
    // Draw the shadow elements directly onto the graphics pipeline.
    // We draw multiple overlapping rectangles with decreasing alphas to create a "soft blur" effect.
    
    const shadowAlphaBase = 0.08;
    const shadowColor = 0x000000;

    // Layer 1: Broad, faint outer glow/spread
    g.fillStyle(shadowColor, shadowAlphaBase * 0.5);
    g.fillRect(
      x + shadowOffsetX - shadowSpread,
      y + shadowOffsetY - shadowSpread,
      w + (shadowSpread * 2),
      h + (shadowSpread * 2)
    );

    // Layer 2: Core drop shadow box
    g.fillStyle(shadowColor, shadowAlphaBase * 1.5);
    g.fillRect(
      x + shadowOffsetX,
      y + shadowOffsetY,
      w,
      h
    );

    // Layer 3: Soft ambient edge reinforcement
    g.fillStyle(shadowColor, shadowAlphaBase * 0.8);
    g.fillRect(
      x + shadowOffsetX - 1,
      y + shadowOffsetY - 1,
      w + 2,
      h + 2
    );
    
    
    g.fillStyle(0x17336f, 1);
    g.fillRect(x, y, w, h);

    
    g.lineStyle(1, 0x07142f, 0.45);
    g.strokeRect(x, y, w, h);

    if (side === "left") {
      
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

      

      g.fillStyle(stripHighlight, active ? 0.34 : 0.24);
      g.fillRect(
        stripX + Math.max(1, Math.round(nameStripW * 0.10)),
        y + Math.max(3, Math.round(h * 0.01)),
        Math.max(1, Math.round(nameStripW * (compactMobile ? 0.08 : 0.12))),
        h - Math.max(6, Math.round(h * 0.02)),
      );

      return;
    }

    
    const stripX = x;
    const dividerX = stripX + nameStripW;
    const contentX = dividerX + dividerW;
    const contentW = w - nameStripW - dividerW - lipW;
    const rightLipX = contentX + contentW;

    g.fillStyle(stripFill, 1);
    g.fillRect(stripX, y, nameStripW, h);

    
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

    
    const stripFill = active ? 0xd7d33a : 0x22488f;
    const stripHighlight = active ? 0xf0eb78 : 0x3c63bb;
    const dividerFill = active ? 0x9b9722 : 0x8ea4d0;

    
    const shadowOffsetX = 2;
    const shadowOffsetY = 3;
    const shadowSpread = 2;

    const shadowAlphaBase = 0.08;
    const shadowColor = 0x000000;

    // Layer 1: Broad, faint outer glow/spread
    g.fillStyle(shadowColor, shadowAlphaBase * 0.5);
    g.fillRect(
      x + shadowOffsetX - shadowSpread,
      y + shadowOffsetY - shadowSpread,
      w + (shadowSpread * 2),
      h + (shadowSpread * 2)
    );

    // Layer 2: Core drop shadow box
    g.fillStyle(shadowColor, shadowAlphaBase * 1.5);
    g.fillRect(
      x + shadowOffsetX,
      y + shadowOffsetY,
      w,
      h
    );

    // Layer 3: Soft ambient edge reinforcement
    g.fillStyle(shadowColor, shadowAlphaBase * 0.8);
    g.fillRect(
      x + shadowOffsetX - 1,
      y + shadowOffsetY - 1,
      w + 2,
      h + 2
    );

    
    g.fillStyle(0x17336f, 1);
    g.fillRect(x, y, w, h);

    
    g.lineStyle(1, 0x07142f, 0.45);
    g.strokeRect(x, y, w, h);

    
    g.fillStyle(0x3159aa, 1);
    g.fillRect(x, y, w, topLipH);

    
    g.fillStyle(0x5e82d5, 0.42);
    g.fillRect(
      x + Math.max(4, Math.round(w * 0.01)),
      y + Math.max(2, Math.round(topLipH * 0.18)),
      w - Math.max(8, Math.round(w * 0.02)),
      Math.max(2, Math.round(topLipH * 0.16)),
    );

    
    g.fillStyle(0x172c61, 1);
    g.fillRect(contentX, contentY, contentW, contentH);

    
    g.fillStyle(0x1f3b83, 0.76);
    g.fillRect(
      contentX + Math.max(4, Math.round(w * 0.01)),
      contentY + Math.max(3, Math.round(contentH * 0.045)),
      contentW - Math.max(8, Math.round(w * 0.02)),
      contentH - Math.max(6, Math.round(contentH * 0.09)),
    );

    
    g.fillStyle(0x07122d, 0.18);
    g.fillRect(
      contentX,
      contentY,
      contentW,
      Math.max(3, Math.round(contentH * 0.06)),
    );

    
    g.fillStyle(dividerFill, isBottom ? 0.72 : 0.58);
    g.fillRect(x, dividerY, w, dividerH);

    
    g.fillStyle(stripFill, 1);
    g.fillRect(x, stripY, w, nameStripH);

    if (nameStripH >= 8) {
      g.fillStyle(stripHighlight, active ? 0.22 : 0.16);
      g.fillRect(
        x + Math.max(3, Math.round(w * 0.01)),
        stripY + Math.max(1, Math.round(nameStripH * 0.18)),
        w - Math.max(6, Math.round(w * 0.02)),
        Math.max(1, Math.round(nameStripH * 0.06)),
      );
    }

    
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
    this.createMobileHeaderToggle();
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
    this.uiLayoutManager.setMobileHeaderVisible(
      !this.mobileHeaderCollapsed || !this.layout.metrics.isMobile,
    );
  }

  private createMobileHeaderToggle(): void {
    const label = this.add
      .text(0, 0, "keyboard_arrow_up", {
        // This web font is loaded globally in index.html. Its ligature names
        // render the rounded Material keyboard-arrow icons in Phaser canvas.
        fontFamily: "Material Symbols Rounded",
        fontSize: "28px",
        fontStyle: "normal",
        color: COLOR_FUSHIA,
      })
      .setOrigin(0.5);

    this.mobileHeaderToggleLabel = label;
    this.mobileHeaderToggle = this.add
      .container(0, 0, [label])
      .setDepth(300)
      .setSize(38, 38)
      .setInteractive({ useHandCursor: true });

    this.mobileHeaderToggle.on("pointerup", () => {
      if (!this.layout?.metrics.isMobile) return;

      this.mobileHeaderCollapsed = !this.mobileHeaderCollapsed;
      this.callbacks.onMobileHeaderChanged(this.mobileHeaderCollapsed);
      this.resize(this.scale.width, this.scale.height);
    });
  }

  private layoutMobileHeaderToggle(): void {
    if (!this.mobileHeaderToggle || !this.layout) return;

    const isMobile = this.layout.metrics.isMobile;
    this.mobileHeaderToggle.setVisible(isMobile);

    if (!isMobile) return;

    const table = this.layout.tableOuter;
    const topExposure = this.layout.topExposure;
    const toggleX = Math.round(Math.max(table.x + 22, topExposure.x - 24));
    // The up-arrow belongs below the expanded header, not over its controls.
    // Keep the collapsed down-arrow aligned to the top exposure.
    const toggleY = this.mobileHeaderCollapsed
      ? topExposure.y + topExposure.height / 2
      : this.layout.hud.y + this.layout.hud.height + 14;
    this.mobileHeaderToggle.setPosition(
      toggleX,
      Math.round(toggleY),
    );
    this.mobileHeaderToggleLabel?.setText(
      this.mobileHeaderCollapsed ? "keyboard_arrow_down" : "keyboard_arrow_up",
    );
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
    
    const farSideThreshold = tileWidth * 0.35;
    let targetIndex = currentIndex;
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
private isInsidePlayablePassDropArea(x: number, y: number): boolean {
  if (this.tablePhase !== "passing") {
    return false;
  }

  return Phaser.Geom.Rectangle.Contains(
    this.playableDiscardDropRect(),
    x,
    y,
  );
}
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

  public debugPlayCharleston(): void {
      this.playCharlestonRound([
          { from: "top", to: "right", tileCount: 3, },
          { from: "right", to: "bottom", tileCount: 3,},
          { from: "bottom", to: "left", tileCount: 3,},
          { from: "left", to: "top", tileCount: 3, }
      ]);
  }

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

    this.removeFromPassWaiting(tileId);
  
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
        fontFamily: FONT_FAMILY,
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
    const minSide = Math.min(size.width, size.height);

    return Phaser.Math.Clamp(
      Math.round(minSide * 0.12),
      5,
      10,
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
      Math.round(corner.x),
      Math.round(corner.y),
    );

    this.resizePassCloseButton(close);
  }
  
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
  private isInsidePassWaitingArea(x: number, y: number): boolean {
    const rect = this.passDropRectForSeat(this.currentPassDestination);

    return this.tileInteractionManager.isPointInsideRect(rect, x, y);
  }

  private passDropRectForSeat(seat: TableSeat): Rect {
    
    const targets = this.passAreaTargets(seat, 3);
    const size = this.passTileDisplaySize(seat);

    if (targets.length === 0) {
      return this.passWaitingAreaRect(seat);
    }

    const padding = Math.max(
      14,
      Math.round(Math.max(size.width, size.height) * 0.42),
    );

    const halfWidth =
      seat === "left" || seat === "right"
        ? size.height / 2
        : size.width / 2;

    const halfHeight =
      seat === "left" || seat === "right"
        ? size.width / 2
        : size.height / 2;

    const minX =
      Math.min(...targets.map((target) => target.x - halfWidth)) -
      padding;

    const maxX =
      Math.max(...targets.map((target) => target.x + halfWidth)) +
      padding;

    const minY =
      Math.min(...targets.map((target) => target.y - halfHeight)) -
      padding;

    const maxY =
      Math.max(...targets.map((target) => target.y + halfHeight)) +
      padding;

    return {
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(maxX - minX),
      height: Math.round(maxY - minY),
    };
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
  private passAreaTargets(seat: TableSeat, count: number): readonly Point[] {
    const rect = this.passWaitingAreaRect(seat);
    const size = this.passTileDisplaySize(seat);
    const step = size.width * 0.9;

    if (seat === "right" || seat === "left") {
      const x = rect.x + rect.width / 2;
      const startY = rect.y + rect.height / 2 - step * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x,
        y: startY + index * step,
      }));
    }

    const y =
      seat === "top"
        ? this.layout.topExposure.y +
          this.layout.topExposure.height +
          Math.round(size.height * 0.82)
        : rect.y + rect.height / 2;

    const startX = rect.x + rect.width / 2 - step * (count - 1) / 2;

    return Array.from({ length: count }, (_, index) => ({
      x: startX + index * step,
      y,
    }));
  }

  private passTileDisplaySize(seat: "top" | "right" | "bottom" | "left"): {
    readonly width: number;
    readonly height: number;
  } {
    const rackWidth = this.layout.bottomTileLayout.width;

    
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

  private canSubmitPassWaitingTiles(): boolean {
    return this.passFlowManager.canSubmitPassWaitingTiles();
  }
  private submitPassWaitingTiles(): void {
    if (this.isBotPassVisualAnimating) return;
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

    let selectedTilesFinished = false;
    let botVisualsFinished = false;

    const finishWhenBothAnimationsComplete = (): void => {
      if (!selectedTilesFinished || !botVisualsFinished) return;

      this.lastSubmittedPassDestination = this.currentPassDestination;
      this.botAutoStagedDestination = undefined;

      this.applyPassWaitingResult(ids);

      this.hasCompletedFirstCharlestonVisualPass = true;

      this.time.delayedCall(260, () => {
        this.tryAutoStageBotPassTilesForCurrentDirection();
      });
    };

    
    this.animatePassWaitingTilesIntoSeatRack(ids, () => {
      selectedTilesFinished = true;
      finishWhenBothAnimationsComplete();
    });

    
    this.animateBotPassVisualsForSubmit(() => {
      botVisualsFinished = true;
      finishWhenBothAnimationsComplete();
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
  private animateBotPassVisualsForSubmit(onFinished: () => void): void {
    if (
      this.botPassVisualTiles.length > 0 &&
      this.botAutoStagedDestination === this.currentPassDestination
    ) {
      this.commitBotPassVisualTilesToRacks(onFinished);
      return;
    }
    this.animateOpponentPassToWaitingThenRack(onFinished);
  }

  private tryAutoStageBotPassTilesForCurrentDirection(): void {
    if (this.tablePhase !== "passing") return;
    if (!this.hasCompletedFirstCharlestonVisualPass) return;
    if (this.isPassAnimating) return;
    if (this.isBotPassVisualAnimating) return;

    if (this.currentPassDestination === this.lastSubmittedPassDestination) return;

    if (this.passWaitingTileIds.length > 0) return;

    if (
      this.botPassVisualTiles.length > 0 &&
      this.botAutoStagedDestination === this.currentPassDestination
    ) {
      return;
    }

    this.stageBotPassTilesToWaitingAreaForCurrentDirection();
  }

  private stageBotPassTilesToWaitingAreaForCurrentDirection(): void {
    const transfers = this.charlestonTransfersForCurrentDirection()
      .filter((transfer) => transfer.from !== "bottom");

    if (transfers.length === 0) return;

    this.clearBotPassVisualTiles();

    this.isBotPassVisualAnimating = true;
    this.botAutoStagedDestination = this.currentPassDestination;

    let transfersFinished = 0;

    const finishOneTransfer = (): void => {
      transfersFinished += 1;

      if (transfersFinished < transfers.length) return;

      this.isBotPassVisualAnimating = false;
      this.updatePassButtonState();
    };

    transfers.forEach((transfer) => {
      this.animateBotTransferToWaitingArea(
        transfer.from,
        transfer.to,
        finishOneTransfer,
      );
    });
  }

  private animateOpponentPassToWaitingThenRack(onFinished: () => void): void {
    const transfers = this.charlestonTransfersForCurrentDirection()
      .filter((transfer) => transfer.from !== "bottom");

    if (transfers.length === 0) {
      onFinished();
      return;
    }

    this.clearBotPassVisualTiles();
    this.isBotPassVisualAnimating = true;

    let transfersFinished = 0;

    const finishOneTransfer = (): void => {
      transfersFinished += 1;

      if (transfersFinished < transfers.length) return;

      this.time.delayedCall(this.botPassWaitingPauseMs, () => {
        this.commitBotPassVisualTilesToRacks(() => {
          this.isBotPassVisualAnimating = false;
          onFinished();
        });
      });
    };

    transfers.forEach((transfer) => {
      this.animateBotTransferToWaitingArea(
        transfer.from,
        transfer.to,
        finishOneTransfer,
      );
    });
  }

  private animateBotTransferToWaitingArea(
    from: TableSeat,
    to: TableSeat,
    onFinished: () => void,
  ): void {
    const count = 3;
    const sourceTargets = this.passAreaTargets(from, count);
    const targetPoints = this.passAreaTargets(to, count);
    const size = this.passTileDisplaySize(to);
    const startAngle = this.passTileAngle(from);
    const endAngle = this.passTileAngle(to);

    let completedTiles = 0;

    const finishOneTile = (): void => {
      completedTiles += 1;

      if (completedTiles === count) {
        onFinished();
      }
    };

    targetPoints.forEach((target, index) => {
      const source =
        sourceTargets[index] ??
        this.seatPassVisualSourcePoint(from);

      const tile = this.createTileBackClone(
        Math.round(source.x),
        Math.round(source.y),
        size.width,
        size.height,
        startAngle,
      );

      tile.setScale(0.74);
      tile.setAlpha(0);
      tile.setDepth(178);

      this.botPassVisualTiles.push({
        id: `bot-pass-${this.botPassVisualSequence++}`,
        from,
        to,
        image: tile,
      });

      this.passAnimationClones.push(tile);

      this.tweens.add({
        targets: tile,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 160,
        delay: index * 55,
        ease: "Sine.easeOut",
      });

      this.tweens.add({
        targets: tile,
        x: Math.round(target.x),
        y: Math.round(target.y),
        angle: endAngle,
        duration: this.botPassMoveDurationMs,
        delay: index * 55,
        ease: "Sine.easeInOut",
        onComplete: finishOneTile,
      });
    });
  }

  private commitBotPassVisualTilesToRacks(onFinished: () => void): void {
    const tiles = [...this.botPassVisualTiles];

    if (tiles.length === 0) {
      onFinished();
      return;
    }

    this.isBotPassVisualAnimating = true;

    const byDestination = new Map<TableSeat, BotPassVisualTile[]>();

    tiles.forEach((tile) => {
      const group = byDestination.get(tile.to) ?? [];
      group.push(tile);
      byDestination.set(tile.to, group);
    });

    let groupsFinished = 0;

    const finishOneGroup = (): void => {
      groupsFinished += 1;

      if (groupsFinished < byDestination.size) return;

      this.clearBotPassVisualTiles();
      this.isBotPassVisualAnimating = false;
      onFinished();
    };

    byDestination.forEach((group, seat) => {
      const targets = this.seatRackTargets(seat, group.length);
      const endAngle = this.passTileAngle(seat);

      let completedTiles = 0;

      const finishOneTile = (): void => {
        completedTiles += 1;

        if (completedTiles === group.length) {
          finishOneGroup();
        }
      };

      group.forEach((tile, index) => {
        const target = targets[index];

        if (!target) {
          tile.image.destroy();
          finishOneTile();
          return;
        }

        this.tweens.killTweensOf(tile.image);

        this.tweens.add({
          targets: tile.image,
          x: Math.round(target.x),
          y: Math.round(target.y),
          angle: endAngle,
          scaleX: 0.74,
          scaleY: 0.74,
          alpha: 0,
          duration: this.botPassCommitDurationMs,
          delay: index * 45,
          ease: "Sine.easeInOut",
          onComplete: () => {
            tile.image.destroy();
            finishOneTile();
          },
        });
      });
    });
  }

  private charlestonTransfersForCurrentDirection(): readonly CharlestonVisualTransfer[] {
    const seats: readonly TableSeat[] = ["bottom", "right", "top", "left"];

    return seats.map((from) => ({
      from,
      to: this.charlestonDestinationForSeat(from, this.currentPassDestination),
      includeBottom: from === "bottom",
    }));
  }

  private charlestonDestinationForSeat(
    seat: TableSeat,
    direction: TableSeat,
  ): TableSeat {
    if (direction === "right") {
      switch (seat) {
        case "bottom": return "right";
        case "right": return "top";
        case "top": return "left";
        case "left": return "bottom";
      }
    }

    if (direction === "left") {
      switch (seat) {
        case "bottom": return "left";
        case "left": return "top";
        case "top": return "right";
        case "right": return "bottom";
      }
    } 
    switch (seat) {
      case "bottom": return "top";
      case "top": return "bottom";
      case "left": return "right";
      case "right": return "left";
    }
  }

  private seatPassVisualSourcePoint(seat: TableSeat): Point {
    const points = this.passAreaTargets(seat, 3);
    return points[1] ?? {
      x: this.layout.tableOuter.x + this.layout.tableOuter.width / 2,
      y: this.layout.tableOuter.y + this.layout.tableOuter.height / 2,
    };
  }

  private relayoutBotPassVisualTilesAfterResize(): void {
    if (this.botPassVisualTiles.length === 0) return;
    const groups = new Map<string, BotPassVisualTile[]>();

    for (const tile of this.botPassVisualTiles) {
      const key = `${tile.from}:${tile.to}`;
      const group = groups.get(key) ?? [];

      group.push(tile);
      groups.set(key, group);
    }

    groups.forEach((group, key) => {
      const [, to] = key.split(":") as [TableSeat, TableSeat];

      const targets = this.passAreaTargets(to, group.length);
      const angle = this.passTileAngle(to);

      group.forEach((tile, index) => {
        const target = targets[index];

        if (!target) return;

        this.tweens.killTweensOf(tile.image);

        tile.image
          .setVisible(true)
          .setActive(true)
          .setAlpha(1)
          .setScale(1)
          .setDepth(178)
          .setAngle(angle)
          .setPosition(
            Math.round(target.x),
            Math.round(target.y),
          );
      });
    });
  }
  private clearBotPassVisualTiles(): void {
    const images = new Set<Phaser.GameObjects.GameObject>(
      this.botPassVisualTiles.map((tile) => tile.image),
    );

    this.botPassVisualTiles.forEach((tile) => {
      this.tweens.killTweensOf(tile.image);

      if (tile.image.scene) {
        tile.image.destroy();
      }
    });

    this.passAnimationClones = this.passAnimationClones.filter(
      (clone) => !images.has(clone),
    );

    this.botPassVisualTiles.length = 0;
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
  
  private applyPassWaitingResult(ids: readonly string[]): void {
    this.passFlowManager.applyPassWaitingResult(ids, {
      onTileRemoved: (runtime) => runtime.image.destroy(),
      onCloseButtonRemoved: (tileId) => this.passCloseButtons.get(tileId)?.destroy(),
      onSelectionChanged: () => this.callbacks.onSelectionChanged([]),
      onPassCompleted: (payload) => this.callbacks.onPassCompleted(payload),
      onLayoutRequested: () => this.resize(this.scale.width, this.scale.height),
    });
  }

  
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
  private playHaptic(type: GameHapticType): void {
    this.soundManager.playHaptic(type);
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

    if (seat === "bottom") {
      if (isPhonePortrait) return 0.46;
      if (isPhoneLandscape) return 0.48;
      if (isTabletPortrait) return 0.64;
      if (isTabletLandscape) return 0.68;

      return 1;
    }

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
        this.callbacks.getDeviceLayout(this.scale.width, this.scale.height),
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
    
    this.setRack([...this.rackTiles, tile]);
  }
}
