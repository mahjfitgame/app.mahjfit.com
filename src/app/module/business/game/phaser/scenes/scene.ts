// src/app/game/scenes/table.scene.ts
import Phaser from "phaser";
import { GAME_TABLE_CONFIG } from "../game-table.config";
import { GameLayoutEngine, Point, Rect, SafeAreaInsets, TableLayout } from "../game-layout.engine";
import { PassDirection, TileVm } from "../../model/tile";
import { TileTextureResolver } from "../../tiles/tile-texture.resolver";
import { selectTileAtlas, TILE_ATLAS_1X_KEY, TILE_ATLAS_2X_KEY } from "../../tiles/tile-atlas.config";
import { PassAnimationManager } from "../animations/pass-animation.manager";
import { PassAnimationItem } from "../models/pass-animation.model";
import { TablePhase } from "../../model/table-phase";
import { inject } from "@angular/core";
import { GameHapticsService, GameHapticType } from "../../platform/haptics.service";
//import { AssetTextureLoader } from "../asset-texture.loader";


interface TableSceneCallbacks {
  readonly onSelectionChanged: (ids: readonly string[]) => void;
  readonly onPassCompleted: (payload: { readonly tileIds: readonly string[]; readonly direction: PassDirection }) => void;
  onHaptic?: (type: GameHapticType) => void;
}

type TableSeat = "top" | "right" | "bottom" | "left";


interface SeatPassMove {
  readonly from: TableSeat;
  readonly to: TableSeat;
}

interface TileRuntime {
  readonly vm: TileVm;
  readonly image: Phaser.GameObjects.Image;
  slotIndex: number;
  selected: boolean;
  isDragging: boolean;
  zone: "rack" | "discard" | "pass";
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

export class TableScene extends Phaser.Scene {
  private readonly callbacks: TableSceneCallbacks;
  private readonly layoutEngine = new GameLayoutEngine();
  private readonly config = GAME_TABLE_CONFIG;

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

  private layout!: TableLayout;
  

  private graphics!: Phaser.GameObjects.Graphics;
  private hudTextObjects: Phaser.GameObjects.Text[] = [];
  private instructionText?: Phaser.GameObjects.Text;
  private passButton?: Phaser.GameObjects.Container;
  private playerLabels: Phaser.GameObjects.Text[] = [];
  private usernameText?: Phaser.GameObjects.Text;

  private wallTileBox?: Phaser.GameObjects.Container;
  private wallTileCount = 93;

  private pickTargetSeat: TableSeat = "bottom";
  private pickSeatSelector?: Phaser.GameObjects.Container;
  private pickSeatButtons: Phaser.GameObjects.Text[] = [];
  private isPickAnimating = false;
  private nextMockTileId = 1;

  private rackTiles: readonly TileVm[] = [];
  private readonly tileMap = new Map<string, TileRuntime>();
  private readonly selectedIds = new Set<string>();

  private rackOrder: string[] = [];
  private readonly discardedTileIds: string[] = [];
  private activeDragTile?: TileRuntime;
  private dragPointerId?: number;

  private renderDpr = 1;

  private hudMenuOpen = false;
  private hudMenuItems: Phaser.GameObjects.Text[] = [];

  private readonly tileTextureResolver = new TileTextureResolver();
  private readonly dragStartByTileId = new Map<string, { x: number; y: number }>();
  private readonly dragThresholdPx = 10;

  private readonly suppressTapByTileId = new Set<string>();

  private passTrayClones: Phaser.GameObjects.Image[] = [];

  private passAnimationClones: Phaser.GameObjects.GameObject[] = [];
  
  private passDirection: PassDirection = "across";
  private tablePhase: TablePhase = "playing";
  private currentPassDestination: "top" | "right" | "bottom" | "left" = "top";

  private activeSeat: TableSeat = "bottom";

  private readonly passWaitingTileIds: string[] = [];
  private readonly passCloseButtons = new Map<string, Phaser.GameObjects.Container>();

  private passWaitingAreaGraphics?: Phaser.GameObjects.Graphics;

  private readonly doubleTapMs = 280;
  private readonly lastTapAtByTileId = new Map<string, number>();

  private isPassAnimating = false;

  private readonly passWaitingTileScale = 1.08;
  private readonly passCloseButtonScale = 0.145;

  private activeRackAtlasKey?: string;
  private pendingAtlasRefresh = false;

  /**
   * Charleston animation layer.
   *
   * Independent from rack rendering.
   */
  private readonly passAnimation =
      new PassAnimationManager(this);
  
  private readonly sfxConfig: Record<TableSfxId, TableSfxConfig> = {
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
  private sfxReady = false;

  private safeAreaInsets: SafeAreaInsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  

  constructor(callbacks: TableSceneCallbacks) {
    super({ key: "table-scene" });
    this.callbacks = callbacks;
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

      
      this.destroyTileVoiceSounds();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroyTileVoiceSounds();
    });

    this.createSoundPools();
    this.createTileVoiceSounds();
  }
  public preload(): void {
    for (const config of Object.values(this.sfxConfig)) {
      if (this.cache.audio.exists(config.key)) continue;

      this.load.audio(config.key, config.urls);
    }
    this.preloadTileVoiceAudio();
  }

  private preloadTileVoiceAudio(): void {
    for (const key of this.tileVoiceKeys) {
      const audioKey = this.tileVoiceAudioKey(key);

      if (this.cache.audio.exists(audioKey)) {
        continue;
      }

      this.load.audio(audioKey, [`assets/sounds/${key}.mp3`]);
    }
  }

  private setSafeAreaInsets(insets: SafeAreaInsets): void {
    this.safeAreaInsets = insets;
  }
  private tileVoiceAudioKey(soundKey: string): string {
    return `tile-voice-${soundKey}`;
  }
  private createTileVoiceSounds(): void {
    if (this.tileVoiceSounds.size > 0) {
      return;
    }

    for (const key of this.tileVoiceKeys) {
      const audioKey = this.tileVoiceAudioKey(key);

      if (!this.cache.audio.exists(audioKey)) {
        continue;
      }

      const sound = this.sound.add(audioKey, {
        volume: this.tileVoiceVolume,
      });

      this.tileVoiceSounds.set(key, sound);
    }
  }

  private playTileDiscardVoice(vm: TileVm): void {
    const soundKey = vm.soundKey;
    if (!soundKey) {
      return;
    }

    const sound = this.tileVoiceSounds.get(soundKey);

    if (!sound) {
      return;
    }

    const now = this.time.now;

    // Prevent accidental double-play from duplicate drop/click events.
    if (now - this.lastTileVoiceAt < 80) {
      return;
    }

    this.lastTileVoiceAt = now;

    // Spoken tile names should usually not overlap.
    if (this.currentTileVoice?.isPlaying) {
      this.currentTileVoice.stop();
    }

    this.currentTileVoice = sound;

    if (sound.isPlaying) {
      sound.stop();
    }

    sound.play({
      volume: this.tileVoiceVolume,
    });
  }
  private playWebFallback(type: GameHapticType): void {
    const nav = navigator as Navigator & {
      vibrate?: (pattern: number | readonly number[]) => boolean;
    };

    if (typeof nav.vibrate !== "function") {
      return;
    }

    if (type === "pass-submit") {
      nav.vibrate([8, 25, 12]);
      return;
    }

    nav.vibrate(type === "tile-discard" ? 14 : 8);
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
    }
  }
  private updatePhaseUi(): void {
    this.updateInstructionText();
    this.updatePassButtonState();
    this.layoutPickSeatSelector();

    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
  }
  private updatePhaseUiOLD(): void {
    this.updatePassButtonState();

    if (this.tablePhase === "passing") {
      this.layoutPassWaitingArea();
      this.layoutPassWaitingTiles(false);
      return;
    }

    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
  }
  private isPassingPhase(): boolean {
    return this.tablePhase === "passing";
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
  private setPassDirectionOLD(direction: PassDirection): void {
    this.passDirection = direction;
    this.updateInstructionText();
  }
  private setPassDirectionOLDW(direction: PassDirection): void {
    console.log('direction ========', direction);
    
    this.passDirection = direction;
    this.currentPassDestination = this.passDestinationForDirection(direction);

    console.log('this.currentPassDestination', this.currentPassDestination)

    this.updateInstructionText();
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(true);
    this.updatePassButtonState();
  }

  private setPassDirection(direction: PassDirection): void {
    this.passDirection = direction;
    this.currentPassDestination = this.passDestinationForDirection(direction);

    console.log("[TableScene] pass direction received:", {
      direction: this.passDirection,
      destination: this.currentPassDestination,
    });

    this.updateInstructionText();
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(false);
    this.updatePassButtonState();
  }

  /* private setRack(tiles: readonly TileVm[]): void {
    this.validateTiles(tiles);
    this.rackTiles = [...tiles];

    const requiredTextureKeys = tiles
      .filter((tile) => !this.textures.exists(this.textureKey(tile)))
      .map((tile) => ({ key: this.textureKey(tile), asset: tile.asset }));

    if (requiredTextureKeys.length > 0) {
      for (const item of requiredTextureKeys) {
        this.load.image(item.key, item.asset);
      }

      this.load.once(Phaser.Loader.Events.COMPLETE, () => this.reconcileRackTiles());
      if (!this.load.isLoading()) this.load.start();
      return;
    }

    this.reconcileRackTiles();
  } */
 private setRack(tiles: readonly TileVm[]): void {
  this.validateTiles(tiles);
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
 private setRackOLDW(tiles: readonly TileVm[]): void {
  this.validateTiles(tiles);
  this.rackTiles = [...tiles];

  const tileW = Math.ceil(this.layout.bottomTileLayout.width * window.devicePixelRatio);
  const tileH = Math.ceil(this.layout.bottomTileLayout.height * window.devicePixelRatio);

  const missing = tiles.filter((tile) => !this.textures.exists(this.textureKey(tile)));

  if (missing.length === 0) {
    this.reconcileRackTiles();
    return;
  }

  /* for (const tile of missing) {
    this.load.svg(this.textureKey(tile), tile.asset, {
      width: tileW,
      height: tileH,
    });
  } */

  this.load.on("loaderror", (file: Phaser.Loader.File) => {
    console.error("[PHASER LOAD ERROR]", file.key, file.src);
  });

  this.load.atlas(
    TILE_ATLAS_1X_KEY,
    "assets/game/tiles/1xnew/tiles_1x.png",
    "assets/game/tiles/1xnew/tiles_1x.json",
  );

  this.load.atlas(
    TILE_ATLAS_2X_KEY,
    "assets/game/tiles/2xnew/tiles_2x.png",
    "assets/game/tiles/2xnew/tiles_2x.json",
  );

  this.load.once(Phaser.Loader.Events.COMPLETE, () => {
    this.reconcileRackTiles();
  });

  this.load.start();
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

      /* const image = this.add.image(0, 0, this.textureKey(tile))
        .setInteractive({ draggable: true, useHandCursor: true })
        .setDepth(30); */

      // const texture = this.tileTextureResolver.resolve(tile);
      /* const tileWidth = Math.round(this.layout.bottomTileLayout.width);
      const tileHeight = Math.round(this.layout.bottomTileLayout.height);
      const texture = this.tileTextureResolver.resolve(tile, tileWidth);

      const image = this.add.image(0, 0, texture.atlasKey, texture.frameKey);
      image.setOrigin(0.5);
      image.setDisplaySize(tileWidth, tileHeight);
      //image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.applyTileTextureFilter(image); */


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

    /* runtime.image.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.activeDragTile = runtime;
      this.suppressTapByTileId.delete(runtime.vm.id);

      this.dragStartByTileId.set(runtime.vm.id, {
        x: pointer.worldX,
        y: pointer.worldY,
      });

      runtime.isDragging = false;
      runtime.image.setDepth(100);
    }); */

    runtime.image.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
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

      this.dragStartByTileId.set(runtime.vm.id, {
        x: pointer.worldX,
        y: pointer.worldY,
      });

      runtime.isDragging = false;
      runtime.image.setDepth(100);
    });

    runtime.image.on("dragstart", () => {
      runtime.image.setDepth(100);
    });

    runtime.image.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const start = this.dragStartByTileId.get(runtime.vm.id);
      if (!start) return;

      const distance = Phaser.Math.Distance.Between(
        start.x,
        start.y,
        pointer.worldX,
        pointer.worldY,
      );

      if (!runtime.isDragging && distance < this.dragThresholdPx) return;

      if (!runtime.isDragging) {
        runtime.isDragging = true;

        runtime.selected = false;
        this.selectedIds.delete(runtime.vm.id);
        runtime.image.clearTint();

        this.callbacks.onSelectionChanged([...this.selectedIds]);
      }

      runtime.image.setPosition(Math.round(dragX), Math.round(dragY));

      /* if (
        this.tablePhase === "passing" &&
        runtime.zone === "rack" &&
        this.isInsidePassWaitingArea(pointer.worldX, pointer.worldY)
      ) {
        return;
      } */
     /* if (
      this.tablePhase === "passing" &&
      runtime.zone === "rack" &&
      (
        this.isInsidePassWaitingArea(pointer.worldX, pointer.worldY) ||
        this.isInsidePlayableDiscardArea(pointer.worldX, pointer.worldY)
      )
    ) {
      return;
    }

      if (
        this.tablePhase !== "passing" &&
        runtime.zone === "rack" &&
        this.isInsideRackArea(pointer.worldX, pointer.worldY)
      ) {
        const newIndex = this.rackIndexFromX(pointer.worldX);
        const currentIndex = this.rackOrder.indexOf(runtime.vm.id);

        if (newIndex !== currentIndex && newIndex >= 0) {
          this.moveRackTileToIndex(runtime.vm.id, newIndex);
          this.layoutRackTiles(true);
          runtime.image.setDepth(100);
        }
      } */
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
          /* const newIndex = this.rackIndexFromX(pointer.worldX);
          const currentIndex = this.rackOrder.indexOf(runtime.vm.id);

          if (newIndex !== currentIndex && newIndex >= 0) {
            this.moveRackTileToIndex(runtime.vm.id, newIndex);
            this.layoutRackTiles(true);
            runtime.image.setDepth(100);
          } */
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

    runtime.image.on("dragend", (pointer: Phaser.Input.Pointer) => {
      runtime.image.setDepth(30);

      if (!runtime.isDragging) {
        this.returnTileToSlot(runtime);
        return;
      }

      this.suppressTapByTileId.add(runtime.vm.id);
      runtime.isDragging = false;

      /* if (
        this.tablePhase === "passing" &&
        runtime.zone === "rack" &&
        this.isInsidePassWaitingArea(pointer.worldX, pointer.worldY)
      ) {
        this.dragStartByTileId.delete(runtime.vm.id);
        this.snapTileToPassWaiting(runtime);
        return;
      } */
     
     if (
        this.tablePhase === "passing" &&
        runtime.zone === "rack" &&
        (
          this.isInsidePassWaitingArea(pointer.worldX, pointer.worldY) ||
          this.isInsidePlayableDiscardArea(pointer.worldX, pointer.worldY)
        )
      ) {
        this.dragStartByTileId.delete(runtime.vm.id);
        this.snapTileToPassWaiting(runtime);
        return;
      }

      if (
        this.tablePhase !== "passing" &&
        this.isInsidePlayableDiscardArea(pointer.worldX, pointer.worldY)
      ) {
        this.dragStartByTileId.delete(runtime.vm.id);
        this.snapTileToDiscard(runtime);
        return;
      }

      this.dragStartByTileId.delete(runtime.vm.id);
      this.returnTileToSlot(runtime);
    });

    /* runtime.image.on("pointerup", () => {
      this.activeDragTile = undefined;

      const shouldSuppressTap = this.suppressTapByTileId.delete(runtime.vm.id);
      this.dragStartByTileId.delete(runtime.vm.id);

      if (shouldSuppressTap) return;
      if (runtime.isDragging) return;
      if (runtime.zone !== "rack") return;

      if (this.tablePhase === "passing") {
        const now = this.time.now;
        const previous = this.lastTapAtByTileId.get(runtime.vm.id) ?? 0;

        this.lastTapAtByTileId.set(runtime.vm.id, now);

        if (now - previous <= this.doubleTapMs) {
          this.snapTileToPassWaiting(runtime);
        }

        return;
      }

      this.toggleTile(runtime);
    }); */

    runtime.image.on("pointerup", () => {
      this.activeDragTile = undefined;

      const shouldSuppressTap = this.suppressTapByTileId.delete(runtime.vm.id);
      this.dragStartByTileId.delete(runtime.vm.id);

      if (shouldSuppressTap) return;
      if (runtime.isDragging) return;

      if (runtime.zone !== "rack") return;

      if (this.tablePhase === "passing") {
        const now = this.time.now;
        const previous = this.lastTapAtByTileId.get(runtime.vm.id) ?? 0;

        this.lastTapAtByTileId.set(runtime.vm.id, now);

        this.playHaptic("tile-tap");
        if (now - previous <= this.doubleTapMs) {
          this.snapTileToPassWaiting(runtime);
        }

        return;
      }

      this.playHaptic("tile-tap");
      this.toggleTile(runtime);
    });
  }
  private toggleTile(runtime: TileRuntime): void {
    if (runtime.zone !== "rack") return;

    if (runtime.selected) {
      runtime.selected = false;
      this.selectedIds.delete(runtime.vm.id);
      runtime.image.clearTint();
      this.applyTileSelection(runtime);
      this.playSfx("tile-select");
      this.callbacks.onSelectionChanged([...this.selectedIds]);
      return;
    }

    if (this.selectedIds.size >= 3) return;

    runtime.selected = true;
    this.selectedIds.add(runtime.vm.id);
    this.applyTileSelection(runtime);
    this.playSfx("tile-select");
    this.callbacks.onSelectionChanged([...this.selectedIds]);
  }

  private applyTileSelection(runtime: TileRuntime): void {
    const slot = this.slotFor(runtime);
    const selectedOffset = runtime.selected ? -this.layout.bottomTileLayout.height * 0.18 : 0;

    this.tweens.killTweensOf(runtime.image);

    this.tweens.add({
      targets: runtime.image,
      x: slot.x,
      y: slot.y + selectedOffset,
      angle: 0,
      duration: 110,
      ease: "Sine.easeOut",
    });

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

    this.tweens.killTweensOf(runtime.image);

    this.tweens.add({
      targets: runtime.image,
      x: Math.round(slot.x),
      y: Math.round(slot.y + selectedOffset),
      angle: 0,
      duration: this.config.animation.dragReturnMs,
      ease: "Back.easeOut",
    });
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
    const instruction = this.layout.instructionBar;

    /**
     * PSD colors.
     */
    const pageColor = 0x151d3b;
    const tableColor = 0xb832a6;
    const tableBorderDark = 0x111827;
    const tableBorderLight = 0xd34fbd;
    const panelColor = 0x172447;
    const cardColor = 0xffffff;

    g.fillStyle(pageColor, 1);
    g.fillRect(0, 0, canvas.width, canvas.height);

    /**
     * Top HUD.
     */
    g.fillStyle(0x121a36, 1);
    g.fillRect(hud.x, hud.y, hud.width, hud.height);

    /**
     * Main PSD board.
     */
    const tableRadius = this.layout.metrics.isMobile ? 14 : 24;

    g.fillStyle(tableBorderDark, 1);
    g.fillRoundedRect(
      table.x,
      table.y,
      table.width,
      table.height,
      tableRadius,
    );

    g.fillStyle(tableBorderLight, 1);
    g.fillRoundedRect(
      table.x + 5,
      table.y + 5,
      table.width - 10,
      table.height - 10,
      Math.max(8, tableRadius - 4),
    );

    g.fillStyle(tableColor, 1);
    g.fillRoundedRect(
      table.x + 12,
      table.y + 12,
      table.width - 24,
      table.height - 24,
      Math.max(8, tableRadius - 8),
    );

    /**
     * Player exposure/rack panels.
     */
    this.drawPsdPanel(this.layout.leftExposure, panelColor, true);
    this.drawPsdPanel(this.layout.rightExposure, panelColor, true);
    this.drawPsdPanel(this.layout.topExposure, panelColor, false);
    this.drawPsdPanel(this.layout.bottomExposure, panelColor, false);

    this.drawActiveSeatExposureHighlight();

    /**
     * Discard area is intentionally transparent in PSD.
     * Keep a very subtle invisible structure only for readability/testing.
     */
    g.fillStyle(0xffffff, 0.035);
    g.fillRoundedRect(
      this.layout.discardArea.x,
      this.layout.discardArea.y,
      this.layout.discardArea.width,
      this.layout.discardArea.height,
      14,
    );

    /**
     * Center instruction card.
     */
    g.fillStyle(0x000000, 0.16);
    g.fillRoundedRect(
      instruction.x + 4,
      instruction.y + 6,
      instruction.width,
      instruction.height,
      20,
    );

    g.fillStyle(cardColor, 1);
    g.fillRoundedRect(
      instruction.x,
      instruction.y,
      instruction.width,
      instruction.height,
      20,
    );

    g.lineStyle(1, 0xe5e7eb, 1);
    g.strokeRoundedRect(
      instruction.x,
      instruction.y,
      instruction.width,
      instruction.height,
      20,
    );
  }
  private drawPsdPanel(rect: Rect, color: number, vertical: boolean): void {
    const g = this.graphics;
    const radius = this.layout.metrics.isMobile ? 8 : 14;

    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(
      rect.x + 4,
      rect.y + 5,
      rect.width,
      rect.height,
      radius,
    );

    g.fillStyle(color, 1);
    g.fillRoundedRect(
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      radius,
    );

    g.lineStyle(2, 0x263b6b, 1);
    g.strokeRoundedRect(
      rect.x + 1,
      rect.y + 1,
      rect.width - 2,
      rect.height - 2,
      radius,
    );

    /**
     * Small inner guide line like the PSD rack slots.
     */
    g.lineStyle(1, 0xffffff, 0.08);

    if (vertical) {
      g.lineBetween(
        rect.x + rect.width / 2,
        rect.y + 12,
        rect.x + rect.width / 2,
        rect.y + rect.height - 12,
      );
    } else {
      g.lineBetween(
        rect.x + 12,
        rect.y + rect.height / 2,
        rect.x + rect.width - 12,
        rect.y + rect.height / 2,
      );
    }
  }
  private drawTableOLD(): void {
    const c = this.config.colors;
    const g = this.graphics;

    g.clear();

    g.fillStyle(c.page, 1);
    g.fillRect(0, 0, this.layout.canvas.width, this.layout.canvas.height);

    g.fillStyle(c.exposure, 1);
    g.fillRect(
      this.layout.leftExposure.x,
      this.layout.leftExposure.y,
      this.layout.leftExposure.width,
      this.layout.leftExposure.height,
    );
    g.fillRect(
      this.layout.rightExposure.x,
      this.layout.rightExposure.y,
      this.layout.rightExposure.width,
      this.layout.rightExposure.height,
    );
    g.fillRect(
      this.layout.topExposure.x,
      this.layout.topExposure.y,
      this.layout.topExposure.width,
      this.layout.topExposure.height,
    );
    g.fillRect(
      this.layout.bottomExposure.x,
      this.layout.bottomExposure.y,
      this.layout.bottomExposure.width,
      this.layout.bottomExposure.height,
    );

    this.drawActiveSeatExposureHighlight();

    g.fillStyle(c.discard, 1);
    g.fillRect(
      this.layout.discardArea.x,
      this.layout.discardArea.y,
      this.layout.discardArea.width,
      this.layout.discardArea.height,
    );

    g.fillStyle(c.panel, 1);
    g.fillRect(
      this.layout.hud.x,
      this.layout.hud.y,
      this.layout.hud.width,
      this.layout.hud.height,
    );
    g.fillRect(
      this.layout.instructionBar.x,
      this.layout.instructionBar.y,
      this.layout.instructionBar.width,
      this.layout.instructionBar.height,
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
    g.lineStyle(lineWidth + 5, 0xffd166, 0.16);
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
    );

    /**
     * Main active border.
     */
    g.lineStyle(lineWidth, 0xfff3a3, 0.95);
    g.strokeRoundedRect(
      rect.x + 5,
      rect.y + 5,
      rect.width - 10,
      rect.height - 10,
      radius,
    );

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
  private drawTableOLDW(): void {
    const c = this.config.colors;
    const g = this.graphics;

    g.clear();

    g.fillStyle(c.page, 1);
    g.fillRect(0, 0, this.layout.canvas.width, this.layout.canvas.height);

    g.fillStyle(c.exposure, 1);
    g.fillRect(this.layout.leftExposure.x, this.layout.leftExposure.y, this.layout.leftExposure.width, this.layout.leftExposure.height);
    g.fillRect(this.layout.rightExposure.x, this.layout.rightExposure.y, this.layout.rightExposure.width, this.layout.rightExposure.height);
    g.fillRect(this.layout.topExposure.x, this.layout.topExposure.y, this.layout.topExposure.width, this.layout.topExposure.height);
    g.fillRect(this.layout.bottomExposure.x, this.layout.bottomExposure.y, this.layout.bottomExposure.width, this.layout.bottomExposure.height);

    g.fillStyle(c.discard, 1);
    g.fillRect(this.layout.discardArea.x, this.layout.discardArea.y, this.layout.discardArea.width, this.layout.discardArea.height);

    g.fillStyle(c.panel, 1);
    g.fillRect(this.layout.hud.x, this.layout.hud.y, this.layout.hud.width, this.layout.hud.height);
    g.fillRect(this.layout.instructionBar.x, this.layout.instructionBar.y, this.layout.instructionBar.width, this.layout.instructionBar.height);
  }
  private createStaticUi(): void {

    this.hudTextObjects = [
      this.add.text(0, 0, "☰", this.hudIconStyle()).setOrigin(0.5),
      this.add.text(0, 0, "xx Points", this.hudTextStyle()).setOrigin(0, 0.5),
      this.add.text(0, 0, "93 left", this.hudCenterStyle()).setOrigin(0.5),
      this.add.text(0, 0, "⟳   ♦   ☝   ⚙   ?", this.hudIconStyle()).setOrigin(1, 0.5),
    ];

    this.hudTextObjects[3].setInteractive({ useHandCursor: true });
    this.hudTextObjects[3].on("pointerdown", () => {
      if (!this.layout.isMobile) return;
      this.hudMenuOpen = !this.hudMenuOpen;
      this.layoutMobileHudMenu();
    });
    /* this.hudTextObjects = [
      this.add.text(0, 0, "☰", this.hudIconStyle()).setOrigin(0.5),
      this.add.text(0, 0, "xx Points", this.hudTextStyle()).setOrigin(0, 0.5),
      this.add.text(0, 0, "93 left", this.hudCenterStyle()).setOrigin(0.5),
      this.add.text(0, 0, "⟳   ♦   ☝   ⚙   ?", this.hudIconStyle()).setOrigin(1, 0.5),
    ]; */

    this.instructionText = this.add.text(0, 0, "", {
      fontFamily: "Poppins, Arial",
      fontSize: "22px",
      fontStyle: "700",
      color: this.config.colors.white,
    }).setOrigin(0.5);

    this.playerLabels = [
      this.add.text(0, 0, "PLAYER 1", this.labelStyle()).setOrigin(0.5),
      this.add.text(0, 0, "PLAYER 2", this.labelStyle()).setOrigin(0.5),
      this.add.text(0, 0, "PLAYER 3", this.labelStyle()).setOrigin(0.5),
    ];

    this.usernameText = this.add.text(0, 0, "USERNAME", this.labelStyle()).setOrigin(0.5);

    this.wallTileBox = this.createWallTileBox();
    this.pickSeatSelector = this.createPickSeatSelector();

    this.passButton = this.createPassButton();
    this.layoutStaticUi();
  }

  private ensureMobileHudMenu(): void {
    if (this.hudMenuItems.length > 0) return;

    const labels = ["Sort By Rank", "Sort By Suit", "Undo", "Help"];

    this.hudMenuItems = labels.map((label) =>
      this.add.text(0, 0, label, {
        fontFamily: "Poppins, Arial",
        fontSize: "11px",
        color: this.config.colors.white,
        backgroundColor: "#6675ac",
        padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(80).setVisible(false),
    );
  }

  private layoutMobileHudMenu(): void {
    this.ensureMobileHudMenu();

    const hud = this.layout.hud;
    const itemGap = 3;

    this.hudMenuItems.forEach((item, index) => {
      item
        .setPosition(hud.x + hud.width - 6, hud.y + hud.height + 5 + index * (item.height + itemGap))
        .setVisible(this.layout.isMobile && this.hudMenuOpen);
    });
  }
  private layoutStaticUi(): void {
    if (!this.layout || this.hudTextObjects.length < 4) return;

    const hud = this.layout.hud;
    const metrics = this.layout.metrics;

    const iconLeft = this.hudTextObjects[0];
    const points = this.hudTextObjects[1];
    const tilesLeft = this.hudTextObjects[2];
    const actions = this.hudTextObjects[3];

    iconLeft.setFontSize(metrics.hudIconFont);
    points.setFontSize(metrics.hudFont);
    tilesLeft.setFontSize(metrics.hudCounterFont);
    actions.setFontSize(metrics.hudIconFont);

    points.setFontStyle("500");
    tilesLeft.setFontStyle("500");
    actions.setFontStyle("500");

    /* iconLeft.setPosition(
      hud.x + hud.width * 0.018,
      hud.y + hud.height / 2,
    );

    points.setPosition(
      hud.x + hud.width * 0.055,
      hud.y + hud.height / 2,
    ); */

    iconLeft
    .setText("☰  MAJHFIT")
    .setOrigin(0, 0.5)
    .setPosition(
      hud.x + Math.max(16, hud.height * 0.32),
      hud.y + hud.height / 2,
    );

  points
    .setText("1,000 POINTS")
    .setOrigin(0, 0.5)
    .setPosition(
      hud.x + hud.width - Math.max(420, hud.width * 0.33),
      hud.y + hud.height / 2,
    );

    /* tilesLeft.setPosition(
      hud.x + hud.width / 2,
      hud.y + hud.height / 2,
    ); */
    this.layoutWallTileBox();

    if (this.layout.isMobile) {
      actions.setText("⚙");
      actions.setPosition(
        hud.x + hud.width - hud.height * 0.45,
        hud.y + hud.height / 2,
      );
    } else {
      actions.setText("⟳  ♦  ☝  ⚙  ?");
      actions.setPosition(
        hud.x + hud.width * 0.982,
        hud.y + hud.height / 2,
      );
      this.hudMenuOpen = false;
    }

    /* this.instructionText
      ?.setPosition(
        this.layout.instructionBar.x + this.layout.instructionBar.width / 2,
        this.layout.instructionBar.y + this.layout.instructionBar.height / 2,
      )
      .setFontSize(metrics.instructionFont)
      .setFontStyle("400"); */

    this.instructionText
    ?.setPosition(
      this.layout.instructionBar.x + this.layout.instructionBar.width / 2,
      this.layout.instructionBar.y + this.layout.instructionBar.height * 0.36,
    )
    .setFontSize(metrics.instructionFont)
    .setFontStyle("700")
    .setColor("#172447");

    this.updateInstructionText();

    this.playerLabels[0]
      ?.setPosition(this.layout.topLabel.x, this.layout.topLabel.y)
      .setFontSize(metrics.playerLabelFont)
      .setFontStyle("400")
      .setAngle(0);

    this.playerLabels[1]
      ?.setPosition(this.layout.rightLabel.x, this.layout.rightLabel.y)
      .setFontSize(metrics.playerLabelFont)
      .setFontStyle("400")
      .setAngle(90);

    this.playerLabels[2]
      ?.setPosition(this.layout.leftLabel.x, this.layout.leftLabel.y)
      .setFontSize(metrics.playerLabelFont)
      .setFontStyle("400")
      .setAngle(-90);

    /* this.usernameText
      ?.setPosition(this.layout.username.x, this.layout.username.y)
      .setFontSize(metrics.usernameFont)
      .setFontStyle("400"); */

    this.usernameText
      ?.setPosition(this.layout.username.x, this.layout.username.y)
      .setFontSize(metrics.usernameFont)
      .setFontStyle("700")
      .setColor("#ffe94a");

    /* for (const text of [
      iconLeft,
      points,
      tilesLeft,
      actions,
      this.instructionText,
      this.playerLabels[0],
      this.playerLabels[1],
      this.playerLabels[2],
      this.usernameText,
    ]) {
      text?.setResolution(this.renderDpr);
    } */
    for (const text of [
      ...this.hudTextObjects,
      this.instructionText,
      ...this.playerLabels,
      this.usernameText,
    ]) {
      text?.setResolution(this.renderDpr);
    }
    this.layoutPassButton();
    this.layoutPickSeatSelector();
    this.layoutMobileHudMenu();
  }
  private hudBg?: Phaser.GameObjects.Rectangle;

  
  private addOrUpdateHudBackground(): void {
    const hud = this.layout.hud;

    if (!this.hudBg) {
      this.hudBg = this.add.rectangle(0, 0, 1, 1, this.config.colors.panel, 1).setOrigin(0, 0).setDepth(10);
      this.hudTextObjects.forEach((item) => item.setDepth(11));
    }

    this.hudBg.setPosition(hud.x, hud.y);
    this.hudBg.setSize(hud.width, hud.height);
  }
  private createWallTileBox(): Phaser.GameObjects.Container {
    const graphics = this.add.graphics();

    const container = this.add
      .container(0, 0, [graphics])
      .setDepth(12);

    return container;
  }

  private layoutWallTileBox(): void {
    if (!this.wallTileBox || this.hudTextObjects.length < 3) return;

    const hud = this.layout.hud;
    const metrics = this.layout.metrics;
    const tilesLeft = this.hudTextObjects[2];

    this.updateWallCountText();

    tilesLeft
      .setOrigin(0, 0.5)
      .setFontSize(metrics.hudCounterFont)
      .setFontStyle("700")
      .setColor("#ffffff");

    const size = this.wallTileBoxSize();
    const gap = Math.max(7, Math.round(size.width * 0.34));

    /**
     * PSD: wall icon + 93 LEFT sits in the top HUD, right of center.
     */
    const groupLeft = hud.x + hud.width - Math.max(650, hud.width * 0.48);

    this.wallTileBox.setPosition(
      Math.round(groupLeft + size.width / 2),
      Math.round(hud.y + hud.height / 2),
    );

    tilesLeft.setPosition(
      Math.round(groupLeft + size.width + gap),
      Math.round(hud.y + hud.height / 2),
    );

    const graphics = this.wallTileBox.list[0] as Phaser.GameObjects.Graphics;
    const radius = Math.max(3, Math.round(Math.min(size.width, size.height) * 0.14));

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(
      -size.width / 2,
      -size.height / 2,
      size.width,
      size.height,
      radius,
    );

    graphics.lineStyle(1, 0xd9d9d9, 1);
    graphics.strokeRoundedRect(
      -size.width / 2,
      -size.height / 2,
      size.width,
      size.height,
      radius,
    );

    const inset = Math.max(2, Math.round(Math.min(size.width, size.height) * 0.12));

    graphics.lineStyle(1, 0xf1f5f9, 1);
    graphics.strokeRoundedRect(
      -size.width / 2 + inset,
      -size.height / 2 + inset,
      size.width - inset * 2,
      size.height - inset * 2,
      Math.max(2, radius - 1),
    );
  }
  private layoutWallTileBoxOLD(): void {
    if (!this.wallTileBox || this.hudTextObjects.length < 3) return;

    const hud = this.layout.hud;
    const metrics = this.layout.metrics;
    const tilesLeft = this.hudTextObjects[2];

    this.updateWallCountText();

    tilesLeft
      .setOrigin(0, 0.5)
      .setFontSize(metrics.hudCounterFont)
      .setFontStyle("500");

    const size = this.wallTileBoxSize();
    const gap = Math.max(6, Math.round(size.width * 0.28));

    const textWidth = tilesLeft.width;
    const groupWidth = size.width + gap + textWidth;
    const groupLeft = hud.x + hud.width / 2 - groupWidth / 2;

    this.wallTileBox.setPosition(
      Math.round(groupLeft + size.width / 2),
      Math.round(hud.y + hud.height / 2),
    );

    tilesLeft.setPosition(
      Math.round(groupLeft + size.width + gap),
      Math.round(hud.y + hud.height / 2),
    );

    const graphics = this.wallTileBox.list[0] as Phaser.GameObjects.Graphics;
    const radius = Math.max(3, Math.round(Math.min(size.width, size.height) * 0.14));

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(
      -size.width / 2,
      -size.height / 2,
      size.width,
      size.height,
      radius,
    );

    graphics.lineStyle(1, 0xd9d9d9, 1);
    graphics.strokeRoundedRect(
      -size.width / 2,
      -size.height / 2,
      size.width,
      size.height,
      radius,
    );

    const inset = Math.max(2, Math.round(Math.min(size.width, size.height) * 0.12));

    graphics.lineStyle(1, 0xf1f5f9, 1);
    graphics.strokeRoundedRect(
      -size.width / 2 + inset,
      -size.height / 2 + inset,
      size.width - inset * 2,
      size.height - inset * 2,
      Math.max(2, radius - 1),
    );
  }

  private wallTileBoxSize(): { readonly width: number; readonly height: number } {
    const hudHeight = this.layout.hud.height;

    const height = Math.round(
      Phaser.Math.Clamp(
        hudHeight * 0.58,
        this.layout.metrics.isMobile ? 14 : 18,
        this.layout.metrics.isMobile ? 24 : 30,
      ),
    );

    const width = Math.round(height * 0.72);

    return { width, height };
  }

  private wallTileSourcePoint(): Point {
    if (this.wallTileBox) {
      return {
        x: this.wallTileBox.x,
        y: this.wallTileBox.y,
      };
    }

    return {
      x: this.layout.hud.x + this.layout.hud.width / 2,
      y: this.layout.hud.y + this.layout.hud.height / 2,
    };
  }

  private updateWallCountText(): void {
    const tilesLeft = this.hudTextObjects[2];
    if (!tilesLeft) return;

    tilesLeft.setText(`${this.wallTileCount} left`);
  }
  private createPassButton(): Phaser.GameObjects.Container {
    const bg = this.add.graphics();

    const text = this.add
      .text(0, 0, "PICK", {
        fontFamily: "Poppins, Arial",
        fontSize: "13px",
        fontStyle: "700",
        color: this.config.colors.white,
      })
      .setOrigin(0.5);

    const container = this.add.container(0, 0, [bg, text]).setDepth(20);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-70, -32, 140, 64),
      Phaser.Geom.Rectangle.Contains,
    );

    container.on("pointerdown", () => {
      if (this.tablePhase === "playing") {
        this.playHaptic("pick");
        this.pickTileForSeat(this.pickTargetSeat);
        return;
      }

      if (!this.canSubmitPassWaitingTiles()) return;
      if (this.isPassAnimating) return;

      this.playHaptic("pass-submit");
      this.submitPassWaitingTiles();
    });

    return container;
  }
  private createPassButtonOLD(): Phaser.GameObjects.Container {
    const bg = this.add.graphics();
    const text = this.add.text(0, 0, "PASS", {
      fontFamily: "Poppins, Arial",
      fontSize: "13px",
      fontStyle: "700",
      color: this.config.colors.white,
    }).setOrigin(0.5);

    const container = this.add.container(0, 0, [bg, text]).setDepth(20);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-70, -32, 140, 64),
      Phaser.Geom.Rectangle.Contains,
    );

    container.on("pointerdown", () => {
      if (!this.canSubmitPassWaitingTiles()) return;
      if (this.isPassAnimating) return;

      this.submitPassWaitingTiles();
    });

    return container;
  }

  private layoutPassButton(): void {
    if (!this.passButton) return;

    const button = this.layout.passButton;
    const metrics = this.layout.metrics;

    const bg = this.passButton.list[0] as Phaser.GameObjects.Graphics;
    const text = this.passButton.list[1] as Phaser.GameObjects.Text;

    this.passButton.setPosition(
      button.x + button.width / 2,
      button.y + button.height / 2,
    );

    bg.clear();
    //bg.fillStyle(this.config.colors.accent, 1);
    bg.fillStyle(0xcb2aa3, 1);
    bg.fillRoundedRect(
      -button.width / 2,
      -button.height / 2,
      button.width,
      button.height,
      Math.min(12, button.height * 0.28),
    );

    text
      .setFontSize(metrics.passFont)
      .setFontStyle("700")
      .setColor("#ffffff")
      .setPosition(0, 0);

    this.passButton.setInteractive(
      new Phaser.Geom.Rectangle(
        -button.width / 2,
        -button.height / 2,
        button.width,
        button.height,
      ),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  private updateInstructionText(): void {
    if (this.tablePhase === "playing") {
      const seatLabel =
        this.pickTargetSeat === "bottom"
          ? "YOUR RACK"
          : this.pickTargetSeat === "top"
            ? "TOP SEAT"
            : this.pickTargetSeat === "left"
              ? "LEFT SEAT"
              : "RIGHT SEAT";

      this.instructionText?.setText(`YOUR TURN\nPick a tile to ${seatLabel}`);
      return;
    }

    const label =
      this.passDirection === "right"
        ? "YOUR TURN\nSelect 3 tiles to pass to the right."
        : this.passDirection === "left"
          ? "YOUR TURN\nSelect 3 tiles to pass to the left."
          : "YOUR TURN\nSelect 3 tiles to pass across.";

    this.instructionText?.setText(label);
  }
  private updateInstructionTextOLD(): void {
  if (this.tablePhase === "playing") {
    const seatLabel =
      this.pickTargetSeat === "bottom"
        ? "your rack"
        : this.pickTargetSeat === "top"
          ? "top seat"
          : this.pickTargetSeat === "left"
            ? "left seat"
            : "right seat";

    this.instructionText?.setText(`Pick a tile from the wall to ${seatLabel}`);
    return;
  }

  const label =
    this.passDirection === "right"
      ? "Select 3 tiles to pass to the right"
      : this.passDirection === "left"
        ? "Select 3 tiles to pass to the left"
        : "Select 3 tiles to pass across";

  this.instructionText?.setText(label);
}

  private validateTiles(tiles: readonly TileVm[]): void {
    const ids = new Set<string>();

    for (const tile of tiles) {
      if (!tile.id || !tile.asset || !tile.label) {
        throw new Error(`Invalid tile data: ${JSON.stringify(tile)}`);
      }

      if (ids.has(tile.id)) {
        throw new Error(`Duplicate tile id: ${tile.id}`);
      }

      ids.add(tile.id);
    }
  }

  private textureKey(tile: TileVm): string {
    return `tile-${tile.id}`;
  }

  private hudTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Poppins, Arial",
      fontSize: "18px",
      fontStyle: "700",
      color: this.config.colors.white,
    };
  }

  private hudCenterStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Poppins, Arial",
      fontSize: "24px",
      fontStyle: "700",
      color: this.config.colors.white,
    };
  }

  private hudIconStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Poppins, Arial",
      fontSize: "24px",
      fontStyle: "700",
      color: "#ffffff",
    };
  }

  private labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Poppins, Arial",
      fontSize: "13px",
      fontStyle: "400",
      color: this.config.colors.lime,
    };
  }
  private discardSlotFor(
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
  private discardGrid(): {
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
  } {
    const area = this.layout.discardArea;
    const rackTile = this.layout.bottomTileLayout;
    const metrics = this.layout.metrics;

    const tileAspect = rackTile.height / rackTile.width;

    /**
     * IMPORTANT:
     * discardArea is already below the HUD and above the pass button.
     * Do not add hud.height here.
     * Do not subtract instructionBar.height here.
     */
    const paddingX = metrics.isMobile ? 6 : 10;
    const paddingY = metrics.isMobile ? 4 : 6;

    const gapX = metrics.isMobile ? 4 : 6;
    const gapY = metrics.isMobile ? 4 : 6;

    /**
     * Discard tiles should be smaller than rack tiles.
     * This keeps rack readability unchanged while allowing many discards.
     */
    const rackScale = metrics.isMobile
      ? metrics.isPortrait
        ? 0.48
        : 0.52
      : metrics.isTablet
        ? 0.58
        : 0.6;

    const targetRows = metrics.isMobile
      ? metrics.isPortrait
        ? 6
        : 4
      : 5;

    const targetColumns = metrics.isMobile
      ? metrics.isPortrait
        ? 8
        : 12
      : metrics.isTablet
        ? 14
        : 18;

    const widthFromRack = rackTile.width * rackScale;

    const widthFromRows =
      (area.height - paddingY * 2 - gapY * (targetRows - 1)) /
      targetRows /
      tileAspect;

    const widthFromColumns =
      (area.width - paddingX * 2 - gapX * (targetColumns - 1)) /
      targetColumns;

    const tileWidth = Math.round(
      Math.max(
        24,
        Math.min(widthFromRack, widthFromRows, widthFromColumns),
      ),
    );

    const tileHeight = Math.round(tileWidth * tileAspect);

    const columns = Math.max(
      1,
      Math.floor(
        (area.width - paddingX * 2 + gapX) / (tileWidth + gapX),
      ),
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
  private discardSlotForOLD(index: number): Point {
    const tile = this.layout.bottomTileLayout;

    const playable = new Phaser.Geom.Rectangle(
      this.layout.discardArea.x,
      this.layout.discardArea.y + this.layout.hud.height,
      this.layout.discardArea.width,
      this.layout.discardArea.height -
        this.layout.hud.height -
        this.layout.instructionBar.height,
    );

    const paddingX = Math.max(12, tile.width * 0.4);
    const paddingY = Math.max(12, tile.height * 0.35);
    const gapX = Math.max(8, tile.width * 0.22);
    const gapY = Math.max(8, tile.height * 0.16);

    const columns = Math.max(
      1,
      Math.floor((playable.width - paddingX * 2 + gapX) / (tile.width + gapX)),
    );

    const row = Math.floor(index / columns);
    const col = index % columns;

    return {
      x: playable.x + paddingX + tile.width / 2 + col * (tile.width + gapX),
      y: playable.y + paddingY + tile.height / 2 + row * (tile.height + gapY),
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
    return Phaser.Geom.Rectangle.Contains(
      new Phaser.Geom.Rectangle(
        this.layout.bottomRack.x,
        this.layout.bottomRack.y,
        this.layout.bottomRack.width,
        this.layout.bottomRack.height,
      ),
      x,
      y,
    );
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
    runtime.image.setDepth(45);

    const grid = this.discardGrid();
    const slot = this.discardSlotFor(
      this.discardedTileIds.indexOf(runtime.vm.id),
      grid,
    );

    runtime.image.setDisplaySize(grid.tileWidth, grid.tileHeight);

    this.tweens.killTweensOf(runtime.image);
    this.tweens.add({
      targets: runtime.image,
      x: Math.round(slot.x),
      y: Math.round(slot.y),
      angle: 0,
      duration: 160,
      ease: "Sine.easeOut",
    });

    this.playHaptic("tile-discard");
    this.playTileDiscardVoice(runtime.vm);

    this.layoutRackTiles(true);
    this.callbacks.onSelectionChanged([...this.selectedIds]);
  }
  private snapTileToDiscardOLD(runtime: TileRuntime): void {
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
    runtime.image.setDepth(45);

    const slot = this.discardSlotFor(this.discardedTileIds.indexOf(runtime.vm.id));

    this.tweens.killTweensOf(runtime.image);
    console.log("snapTileToDiscard", runtime.vm.id, slot.x, slot.y, runtime.vm);
    this.tweens.add({
      targets: runtime.image,
      x: Math.round(slot.x),
      y: Math.round(slot.y),
      angle: 0,
      duration: 160,
      ease: "Sine.easeOut",
    });
    this.playTileDiscardVoice(runtime.vm); // spoken tile name
    this.layoutRackTiles(true);
    this.callbacks.onSelectionChanged([...this.selectedIds]);
  }

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

  private destroyTileVoiceSounds(): void {
    if (this.currentTileVoice?.isPlaying) {
      this.currentTileVoice.stop();
    }

    this.currentTileVoice = undefined;

    for (const sound of this.tileVoiceSounds.values()) {
      sound.destroy();
    }

    this.tileVoiceSounds.clear();
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

      runtime.image.setDisplaySize(tileWidth, tileHeight);

      this.tweens.killTweensOf(runtime.image);

      if (animate) {
        this.tweens.add({
          targets: runtime.image,
          x: targetX,
          y: targetY,
          angle: 0,
          duration: 140,
          ease: "Sine.easeOut",
        });
      } else {
        runtime.image.setPosition(targetX, targetY);
        runtime.image.setAngle(0);
      }
    }

    this.layoutDiscardTiles(animate);
    this.layoutPassWaitingArea();
    this.layoutPassWaitingTiles(animate);
    this.updatePassButtonState();
  }
  private layoutRackTilesOLD(animate: boolean): void {
    this.reindexRackRuntimeSlots();

    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);

    for (const runtime of this.tileMap.values()) {
      if (runtime.zone === "discard" || runtime.zone === "pass") continue;

      runtime.image.setDisplaySize(tileWidth, tileHeight);

      const slot = this.slotFor(runtime);
      const selectedOffset = runtime.selected ? -tileHeight * 0.18 : 0;

      const targetX = Math.round(slot.x);
      const targetY = Math.round(slot.y + selectedOffset);

      if (animate) {
        this.tweens.add({
          targets: runtime.image,
          x: targetX,
          y: targetY,
          angle: 0,
          duration: 140,
          ease: "Sine.easeOut",
        });
      } else {
        runtime.image.setPosition(targetX, targetY);
        runtime.image.setAngle(0);
      }
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

      runtime.image.setDisplaySize(grid.tileWidth, grid.tileHeight);

      if (animate) {
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
  private layoutDiscardTilesOLD(animate: boolean): void {
    this.discardedTileIds.forEach((id, index) => {
      const runtime = this.tileMap.get(id);
      if (!runtime) return;

      const slot = this.discardSlotFor(index);

      runtime.image.setDisplaySize(
        this.layout.bottomTileLayout.width,
        this.layout.bottomTileLayout.height,
      );

      if (animate) {
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


  private isInsidePlayableDiscardArea(x: number, y: number): boolean {
    const playableDiscardArea = new Phaser.Geom.Rectangle(
      this.layout.discardArea.x,
      this.layout.discardArea.y + this.layout.hud.height,
      this.layout.discardArea.width,
      this.layout.discardArea.height -
        this.layout.hud.height -
        this.layout.instructionBar.height,
    );

    return Phaser.Geom.Rectangle.Contains(playableDiscardArea, x, y);
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
    this.passAnimation.play(
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

    this.passWaitingTileIds.push(runtime.vm.id);
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
    
    console.log("RETURN AFTER REMOVE", {
      tileId,
      zone: runtime.zone,
      passWaitingTileIds: [...this.passWaitingTileIds],
      rackOrder: [...this.rackOrder],
      hasCloseButton: this.passCloseButtons.has(tileId),
    });

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
        /* this.removeFromPassWaiting(tileId);

        runtime.zone = "rack";
        runtime.selected = false;
        runtime.isDragging = false;

        runtime.image.setAlpha(1);
        runtime.image.setDepth(30);
        runtime.image.setAngle(0);
        runtime.image.setDisplaySize(rackWidth, rackHeight);
        runtime.image.setInteractive({
          useHandCursor: true,
          draggable: true,
          pixelPerfect: false,
        });

        this.removeFromRackOrder(tileId);
        this.rackOrder.push(tileId);
        this.reindexRackRuntimeSlots();

        this.layoutPassWaitingTiles(true);
        this.layoutRackTiles(false);
        this.updatePassButtonState();
        this.callbacks.onSelectionChanged([...this.selectedIds]); */
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
   * Returns a tile from PASS waiting area back to the end of the rack.
   */
  private returnPassTileToRackOLD(tileId: string): void {
    const runtime = this.tileMap.get(tileId);
    if (!runtime) return;

    this.removeFromPassWaiting(tileId);

    runtime.zone = "rack";
    runtime.selected = false;
    runtime.isDragging = false;

    runtime.image.setAngle(0);
    runtime.image.setAlpha(1);
    runtime.image.setDepth(30);
    runtime.image.setInteractive({
      useHandCursor: true,
      draggable: true,
      pixelPerfect: false,
    });

    this.removeFromRackOrder(tileId);
    this.rackOrder.push(tileId);
    this.reindexRackRuntimeSlots();

    this.returnTileToSlot(runtime);
    this.layoutPassWaitingTiles(true);
    this.layoutRackTiles(true);
    this.updatePassButtonState();
  }

  /**
   * Removes tile id and close button from PASS waiting state.
   */
  private removeFromPassWaiting(tileId: string): void {
    const index = this.passWaitingTileIds.indexOf(tileId);
    if (index >= 0) this.passWaitingTileIds.splice(index, 1);

    const close = this.passCloseButtons.get(tileId);
    close?.destroy();
    this.passCloseButtons.delete(tileId);
  }

  /**
   * Creates the red close button for a PASS waiting tile.
   */
  private ensurePassCloseButtonOLD(tileId: string): void {
    if (this.passCloseButtons.has(tileId)) return;

    const radius = Math.max(8, Math.round(this.layout.bottomTileLayout.width * 0.22));

    const circle = this.add.circle(0, 0, radius, 0xff1f1f, 1);
    const label = this.add.text(0, 0, "×", {
      fontFamily: "Poppins, Arial",
      fontSize: `${Math.round(radius * 1.5)}px`,
      fontStyle: "700",
      color: "#ffffff",
    }).setOrigin(0.5);

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

    ids.forEach((tileId, index) => {
      const runtime = this.tileMap.get(tileId);
      if (!runtime) return;

      const target = targets[index];
      const size = this.passTileDisplaySize(this.currentPassDestination);

      runtime.image.setDisplaySize(size.width, size.height);
      runtime.image.setDepth(95);

      if (animate) {
        this.tweens.killTweensOf(runtime.image);

        this.tweens.add({
          targets: runtime.image,
          x: target.x,
          y: target.y,
          angle,
          duration: 180,
          ease: "Sine.easeOut",
          onUpdate: () => this.positionPassCloseButton(tileId),
          onComplete: () => this.positionPassCloseButton(tileId),
        });
      } else {
        runtime.image.setPosition(target.x, target.y);
        runtime.image.setAngle(angle);
        this.positionPassCloseButton(tileId);
      }
    });
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
  private positionPassCloseButtonOLD(tileId: string): void {
    const runtime = this.tileMap.get(tileId);
    const close = this.passCloseButtons.get(tileId);

    if (!runtime || !close) return;

    const size = this.passTileDisplaySize(this.currentPassDestination);
    const closeRadius = Math.max(8, Math.round(this.layout.bottomTileLayout.width * 0.22));

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

    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
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

    /* const y = rect.y + rect.height / 2;
    const startX = rect.x + rect.width / 2 - step * (count - 1) / 2;

    return Array.from({ length: count }, (_, index) => ({
      x: Math.round(startX + index * step),
      y: Math.round(y),
    })); */
    const topPassYOffset = seat === "top"
      ? Math.round(size.height * 0.55)
      : 0;

    const y = rect.y + rect.height / 2 + topPassYOffset;
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
  private passTileDisplaySizeOLD(seat: "top" | "right" | "bottom" | "left"): {
    readonly width: number;
    readonly height: number;
  } {
    const rackWidth = this.layout.bottomTileLayout.width;
    
    const width = Math.round(Phaser.Math.Clamp(rackWidth * 1.22, rackWidth, rackWidth * 1.55));
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
    if (!this.isPassingPhase()) return false;
    return this.passWaitingTileIds.length === 3;
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
  private submitPassWaitingTilesOLD(): void {
    if (!this.canSubmitPassWaitingTiles()) return;

    this.isPassAnimating = true;

    const ids = [...this.passWaitingTileIds];

    ids.forEach((id) => {
      const runtime = this.tileMap.get(id);
      runtime?.image.disableInteractive();
    });

    this.time.delayedCall(220, () => {
      this.applyPassWaitingResult(ids);
    });
  }
  private submitPassWaitingTiles(): void {
    if (!this.canSubmitPassWaitingTiles()) return;
    if (this.isPassAnimating) return;

    this.isPassAnimating = true;

    const ids = [...this.passWaitingTileIds];

    ids.forEach((id) => {
      const runtime = this.tileMap.get(id);
      runtime?.image.disableInteractive();

      const close = this.passCloseButtons.get(id);
      close?.disableInteractive();
      close?.setVisible(false);
    });

    this.updatePassButtonState();
    this.playSfx("pass");
    this.animatePassWaitingTilesIntoSeatRack(ids, () => {
      this.applyPassWaitingResult(ids);
    });
  }
  private animatePassWaitingTilesIntoSeatRack(
    ids: readonly string[],
    onFinished: () => void,
  ): void {
    if (!ids.length) {
      onFinished();
      return;
    }

    const destination = this.currentPassDestination;
    const endTargets = this.seatRackTargets(destination, ids.length);
    const endAngle = this.passTileAngle(destination);

    let completed = 0;

    const completeOne = (): void => {
      completed++;

      if (completed === ids.length) {
        onFinished();
      }
    };

    ids.forEach((id, index) => {
      const runtime = this.tileMap.get(id);

      if (!runtime) {
        completeOne();
        return;
      }

      const size = this.passTileDisplaySize(destination);
      const startX = runtime.image.x;
      const startY = runtime.image.y;
      const startAngle = runtime.image.angle;
      const target = endTargets[index];

      const tileBack = this.createTileBackClone(
        startX,
        startY,
        size.width,
        size.height,
        startAngle,
      );

      this.passAnimationClones.push(tileBack);

      runtime.image.setDepth(181);

      this.tweens.add({
        targets: runtime.image,
        scaleX: 0,
        duration: 110,
        ease: "Sine.easeIn",
        onComplete: () => {
          runtime.image.setVisible(false);

          this.tweens.add({
            targets: tileBack,
            scaleX: 1,
            duration: 110,
            ease: "Sine.easeOut",
            onComplete: () => {
              this.tweens.add({
                targets: tileBack,
                x: target.x,
                y: target.y,
                angle: endAngle,
                alpha: 0,
                scaleX: 0.82,
                scaleY: 0.82,
                duration: 520,
                ease: "Cubic.easeInOut",
                onComplete: () => {
                  tileBack.destroy();
                  completeOne();
                },
              });
            },
          });
        },
      });
    });
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
  private seatRackTargetsOLD(
    seat: "top" | "right" | "bottom" | "left",
    count: number,
  ): readonly Point[] {
    const size = this.passTileDisplaySize(seat);
    const step = size.width * 0.82;

    if (seat === "right") {
      const x = this.layout.rightExposure.x + this.layout.rightExposure.width / 2;
      const startY = this.layout.rightExposure.y
        + this.layout.rightExposure.height / 2
        - step * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * step),
      }));
    }

    if (seat === "left") {
      const x = this.layout.leftExposure.x + this.layout.leftExposure.width / 2;
      const startY = this.layout.leftExposure.y
        + this.layout.leftExposure.height / 2
        - step * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(x),
        y: Math.round(startY + index * step),
      }));
    }

    if (seat === "top") {
      const y = this.layout.topExposure.y + this.layout.topExposure.height / 2;
      const startX = this.layout.topExposure.x
        + this.layout.topExposure.width / 2
        - step * (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => ({
        x: Math.round(startX + index * step),
        y: Math.round(y),
      }));
    }

    const y = this.layout.bottomExposure.y + this.layout.bottomExposure.height / 2;
    const startX = this.layout.bottomExposure.x
      + this.layout.bottomExposure.width / 2
      - step * (count - 1) / 2;

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
    ids.forEach((id) => {
      const runtime = this.tileMap.get(id);
      if (!runtime) return;

      runtime.image.destroy();
      this.tileMap.delete(id);

      const close = this.passCloseButtons.get(id);
      close?.destroy();
      this.passCloseButtons.delete(id);
    });

    this.passWaitingTileIds.length = 0;
    this.selectedIds.clear();

    this.rackTiles = this.rackTiles.filter((tile) => !ids.includes(tile.id));

    this.callbacks.onSelectionChanged([]);
    this.callbacks.onPassCompleted({
      tileIds: ids,
      direction: this.passDirection,
    });

    this.isPassAnimating = false;

    this.resize(this.scale.width, this.scale.height);
  }

  /**
   * Updates PASS button visual state.
   */
  private updatePassButtonState(): void {
    if (!this.passButton) return;

    const bg = this.passButton.list[0] as Phaser.GameObjects.Graphics;
    const text = this.passButton.list[1] as Phaser.GameObjects.Text;

    const button = this.layout.passButton;

    bg.clear();

    if (this.tablePhase === "playing") {
      const enabled = this.wallTileCount > 0 && !this.isPickAnimating;

      text.setText("PICK");
      this.passButton.setAlpha(enabled ? 1 : 0.65);

      bg.fillStyle(enabled ? this.config.colors.accent : 0x777777, 1);
      bg.fillRoundedRect(
        -button.width / 2,
        -button.height / 2,
        button.width,
        button.height,
        Math.min(12, button.height * 0.28),
      );

      this.layoutPickSeatSelector();
      return;
    }

    const enabled = this.canSubmitPassWaitingTiles();

    text.setText(enabled ? "PASS" : `${this.passWaitingTileIds.length}/3`);
    this.passButton.setAlpha(enabled ? 1 : 0.65);

    bg.fillStyle(enabled ? this.config.colors.accent : 0x777777, 1);
    bg.fillRoundedRect(
      -button.width / 2,
      -button.height / 2,
      button.width,
      button.height,
      Math.min(12, button.height * 0.28),
    );

    this.layoutPickSeatSelector();
  }
  private updatePassButtonStateOLD(): void {
    if (!this.passButton) return;

    const enabled = this.canSubmitPassWaitingTiles();

    const bg = this.passButton.list[0] as Phaser.GameObjects.Graphics;
    const text = this.passButton.list[1] as Phaser.GameObjects.Text;

    text.setText(enabled ? "PASS" : `${this.passWaitingTileIds.length}/3`);

    this.passButton.setAlpha(enabled ? 1 : 0.65);

    bg.clear();
    bg.fillStyle(enabled ? this.config.colors.accent : 0x777777, 1);

    const button = this.layout.passButton;

    bg.fillRoundedRect(
      -button.width / 2,
      -button.height / 2,
      button.width,
      button.height,
      Math.min(12, button.height * 0.28),
    );
  }



  private passDestinationForDirection(direction: PassDirection): TableSeat {
    switch (direction) {
      case "right":
        return "right";

      case "left":
        return "left";

      case "across":
        return "top";
    }
  }

  private createSoundPools(): void {
    if (this.sfxReady) return;

    for (const [id, config] of Object.entries(this.sfxConfig) as [TableSfxId, TableSfxConfig][]) {
      if (!this.cache.audio.exists(config.key)) continue;

      const pool: Phaser.Sound.BaseSound[] = [];

      for (let index = 0; index < config.poolSize; index += 1) {
        pool.push(
          this.sound.add(config.key, {
            volume: config.volume,
          }),
        );
      }

      this.sfxPools.set(id, pool);
      this.sfxPoolCursor.set(id, 0);
    }

    this.sfxReady = true;
  }

  private playHaptic(type: GameHapticType): void {
    this.callbacks.onHaptic?.(type);
  }

  
  private playSfx(id: TableSfxId): void {
    const config = this.sfxConfig[id];
    const pool = this.sfxPools.get(id);

    if (!pool?.length) return;

    const now = this.time.now;
    const lastPlayedAt = this.lastSfxAt.get(id) ?? 0;

    if (config.throttleMs && now - lastPlayedAt < config.throttleMs) {
      return;
    }

    this.lastSfxAt.set(id, now);

    const cursor = this.sfxPoolCursor.get(id) ?? 0;
    const sound = pool[cursor];

    this.sfxPoolCursor.set(id, (cursor + 1) % pool.length);

    if (sound.isPlaying) {
      sound.stop();
    }

    sound.play({
      volume: config.volume,
    });
  }
  private createPickSeatSelector(): Phaser.GameObjects.Container {
    const labels: readonly { readonly seat: TableSeat; readonly label: string }[] = [
      { seat: "bottom", label: "Bottom" },
      { seat: "left", label: "Left" },
      { seat: "top", label: "Top" },
      { seat: "right", label: "Right" },
    ];

    this.pickSeatButtons = labels.map((item) => {
      const text = this.add
        .text(0, 0, item.label, {
          fontFamily: "Poppins, Arial",
          fontSize: "11px",
          fontStyle: "700",
          color: this.config.colors.white,
          backgroundColor: "#64748b",
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(22)
        .setInteractive({ useHandCursor: true });

      text.setData("seat", item.seat);

      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        this.pickTargetSeat = item.seat;
        this.setActiveSeat(item.seat);

        this.updatePickSeatSelectorState();
        this.updateInstructionText();
      });

      return text;
    });

    const container = this.add
      .container(0, 0, this.pickSeatButtons)
      .setDepth(22)
      .setVisible(false);

    this.updatePickSeatSelectorState();

    return container;
  }

  private layoutPickSeatSelector(): void {
    if (!this.pickSeatSelector || this.pickSeatButtons.length === 0 || !this.layout) {
      return;
    }

    const visible = this.tablePhase === "playing";

    this.pickSeatSelector.setVisible(visible);

    for (const button of this.pickSeatButtons) {
      button.setVisible(visible);
    }

    if (!visible) {
      return;
    }

    const passButton = this.layout.passButton;
    const gap = this.layout.metrics.isMobile ? 4 : 6;

    let totalWidth = 0;

    for (const button of this.pickSeatButtons) {
      totalWidth += button.width;
    }

    totalWidth += gap * (this.pickSeatButtons.length - 1);

    let x = -totalWidth / 2;

    this.pickSeatButtons.forEach((button) => {
      button.setPosition(
        Math.round(x + button.width / 2),
        0,
      );

      x += button.width + gap;
    });

    this.pickSeatSelector.setPosition(
      Math.round(passButton.x + passButton.width / 2),
      Math.round(passButton.y - Math.max(14, passButton.height * 0.42)),
    );

    this.updatePickSeatSelectorState();
  }

  private updatePickSeatSelectorState(): void {
    for (const button of this.pickSeatButtons) {
      const seat = button.getData("seat") as TableSeat;
      const active = seat === this.pickTargetSeat;

      button.setBackgroundColor(active ? "#cb2aa3" : "#64748b");
      button.setAlpha(active ? 1 : 0.78);
    }
  }
  /* private pickTileForSeatOLD(seat: TableSeat): void {
    if (this.tablePhase !== "playing") return;
    if (this.isPickAnimating) return;
    if (this.wallTileCount <= 0) return;

    this.isPickAnimating = true;
    this.wallTileCount -= 1;

    this.updateWallCountText();
    this.updatePassButtonState();

    const pickedTile = seat === "bottom" ? this.createMockPickedTile() : undefined;

    this.animateWallTileToSeat(seat, () => {
      if (seat === "bottom" && pickedTile) {
        this.addMockPickedTileToRack(pickedTile);
      }

      this.isPickAnimating = false;
      this.updatePassButtonState();
      this.updateInstructionText();
    });
  } */


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

    clone.setScale(startScale);
    clone.setAlpha(1);
    clone.setDepth(190);

    const progress = { value: 0 };

    this.tweens.add({
      targets: progress,
      value: 1,
      duration: this.pickAnimationDurationForSeat(seat),
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        /**
         * Bottom/current player:
         * keep tile small while travelling from HUD,
         * then grow only when it gets near the rack.
         */
        if (seat === "bottom") {
          const growProgress = Phaser.Math.Clamp(
            (progress.value - 0.62) / 0.38,
            0,
            1,
          );

          const easedGrow = Phaser.Math.Easing.Sine.Out(growProgress);
          const scale = Phaser.Math.Linear(startScale, 1, easedGrow);

          clone.setScale(scale);
          return;
        }

        /**
         * Other seats:
         * keep normal grow behavior because the travel distance is shorter
         * and the tile is a hidden back tile.
         */
        const easedGrow = Phaser.Math.Easing.Sine.Out(progress.value);
        const scale = Phaser.Math.Linear(startScale, 1, easedGrow);

        clone.setScale(scale);
      },
    });

    this.tweens.add({
      targets: clone,
      x: Math.round(target.x),
      y: Math.round(target.y),
      angle: this.pickTileAngleForSeat(seat),
      duration: this.pickAnimationDurationForSeat(seat),
      ease: "Cubic.easeInOut",
      onComplete: () => {
        clone.destroy();
        onComplete();
      },
    });
  }
  private animateWallTileToSeatOLDW(
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

    clone.setScale(startScale);
    clone.setAlpha(1);
    clone.setDepth(190);

    this.tweens.add({
      targets: clone,
      x: Math.round(target.x),
      y: Math.round(target.y),
      angle: this.pickTileAngleForSeat(seat),
      scaleX: 1,
      scaleY: 1,
      duration: this.pickAnimationDurationForSeat(seat),
      ease: "Cubic.easeInOut",
      onComplete: () => {
        clone.destroy();
        onComplete();
      },
    });
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

  private animateWallTileToSeatOLD(
    seat: TableSeat,
    onComplete: () => void,
  ): void {
    const source = this.wallTileSourcePoint();
    const target = this.pickTargetPointForSeat(seat);
    const size = this.pickAnimationTileSize(seat);
    /* const startSize = this.wallTileBoxSize();

    const startScale = Phaser.Math.Clamp(
      startSize.height / size.height,
      0.35,
      0.75,
    ); */

    const clone = this.createTileBackClone(
      source.x,
      source.y,
      size.width,
      size.height,
      0,
    );

    //clone.setScale(startScale);
    clone.setScale(1);
    clone.setAlpha(1);
    clone.setDepth(190);

    this.tweens.add({
      targets: clone,
      x: Math.round(target.x),
      y: Math.round(target.y),
      //angle: this.passTileAngle(seat),
      angle: this.pickTileAngleForSeat(seat),
      //scaleX: 1,
      //scaleY: 1,
      duration: this.pickAnimationDurationForSeat(seat),
      ease: "Cubic.easeInOut",
      onComplete: () => {
        clone.destroy(true);
        onComplete();
      },
    });
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