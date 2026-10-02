// file: src/app/module/business/game/phaser/scenes/managers/sound.ts
import Phaser from "phaser";
import { GameHapticType } from "../type";
import { TableSfxConfig, TableSfxId } from "./scenes/type";



/** Owns sound playback and haptic feedback for the table scene. */
export class PhaserSound {
  private readonly tileVoiceVolume = 0.85;
  private readonly tileVoiceKeys = ["1-bam", "2-bam", "3-bam", "4-bam", "5-bam", "6-bam", "7-bam", "8-bam", "9-bam", "1-crack", "2-crack", "3-crack", "4-crack", "5-crack", "6-crack", "7-crack", "8-crack", "9-crack", "1-dot", "2-dot", "3-dot", "4-dot", "5-dot", "6-dot", "7-dot", "8-dot", "9-dot", "east", "south", "west", "north", "red", "green", "soap", "joker", "flower"] as const;
  private readonly charlestonVoiceKeys = ["first-right", "across", "first-left", "second-left", "final-right", "optional-across", "stop-the-chaleston"] as const;
  private readonly tileVoiceSounds = new Map<string, Phaser.Sound.BaseSound>();
  private readonly charlestonVoiceSounds = new Map<string, Phaser.Sound.BaseSound>();
  private currentTileVoice?: Phaser.Sound.BaseSound;
  private currentTileVoiceKey?: string;
  private lastTileVoiceAt = 0;
  private readonly sfxConfig: Record<TableSfxId, TableSfxConfig> = {
    "tile-select": { key: "tile-select", urls: [], volume: 0.45, poolSize: 3, throttleMs: 35 },
    "tile-pass-waiting": { key: "tile-drop", urls: [], volume: 0.5, poolSize: 3, throttleMs: 35 },
    "tile-return": { key: "tile-drop", urls: [], volume: 0.45, poolSize: 2, throttleMs: 45 },
    "tile-drop": { key: "tile-drop", urls: [], volume: 0.5, poolSize: 2, throttleMs: 45 },
    pass: { key: "pass", urls: [], volume: 0.65, poolSize: 1, throttleMs: 150 },
    "pick-tile": { key: "pick-tile", urls: [], volume: 0.5, poolSize: 2, throttleMs: 45 },
    "call": { key: "call", urls: [], volume: 0.65, poolSize: 1, throttleMs: 2000 },
  };
  private readonly sfxPools = new Map<TableSfxId, Phaser.Sound.BaseSound[]>();
  private readonly sfxPoolCursor = new Map<TableSfxId, number>();
  private readonly lastSfxAt = new Map<TableSfxId, number>();
  private sfxReady = false;
  private tilesSprite?: Phaser.Sound.BaseSound | any;
  private effectsSprite?: Phaser.Sound.BaseSound | any;

  constructor(private readonly scene: Phaser.Scene, private readonly onHaptic?: (type: GameHapticType) => void) { }

  preload(): void { 
    if (!this.scene.cache.json.exists('tiles')) {
      this.scene.load.audioSprite('tiles', 'assets/sounds/tiles.json', ['assets/sounds/tiles.webm', 'assets/sounds/tiles.mp3']);
    }
    if (!this.scene.cache.json.exists('effects')) {
      this.scene.load.audioSprite('effects', 'assets/sounds/effects.json', ['assets/sounds/effects.webm', 'assets/sounds/effects.mp3']);
    }
    this.scene.load.audio('joker_exchange', 'assets/sounds/joker_exchange.mp3');
  }
  create(): void { 
    this.createSoundPools(); 
    this.tilesSprite = this.scene.sound.addAudioSprite('tiles');
    this.effectsSprite = this.scene.sound.addAudioSprite('effects');
  }
  destroy(): void { 
    if (this.tilesSprite?.isPlaying) this.tilesSprite.stop(); 
    if (this.effectsSprite?.isPlaying) this.effectsSprite.stop();
    this.tilesSprite?.destroy();
    this.effectsSprite?.destroy();
    this.currentTileVoice = undefined; 
    this.currentTileVoiceKey = undefined;
  }
  playTileDiscardVoice(soundKey?: string): void {
    if (!soundKey || !this.tilesSprite || this.scene.time.now - this.lastTileVoiceAt < 80) return; 
    this.lastTileVoiceAt = this.scene.time.now;
    if (this.currentTileVoice?.isPlaying) this.currentTileVoice.stop(); 
    this.currentTileVoice = this.tilesSprite;
    this.currentTileVoiceKey = soundKey;
    this.tilesSprite.play(soundKey, { volume: this.tileVoiceVolume });
  }

  playCharlestonVoice(key: string): void {
    if (!this.effectsSprite) return;

    if (this.currentTileVoice?.isPlaying && this.currentTileVoiceKey === "stop-the-chaleston") {
      this.currentTileVoice.once(Phaser.Sound.Events.COMPLETE, () => {
        this.playCharlestonVoice(key);
      });
      return;
    }

    if (this.currentTileVoice?.isPlaying) this.currentTileVoice.stop();
    this.currentTileVoice = this.effectsSprite;
    this.currentTileVoiceKey = key;
    this.effectsSprite.play(key, { volume: 1.0 });
  }
  playCharlestonStopVoice(): void {
    if (!this.effectsSprite) return;
    if (this.currentTileVoice?.isPlaying) this.currentTileVoice.stop();
    this.currentTileVoice = this.effectsSprite;
    this.currentTileVoiceKey = "stop-the-chaleston";
    this.effectsSprite.play("stop-the-chaleston", { volume: 1.0 });
  }
  playJokerExchange(): void {
    this.scene.sound.play('joker_exchange', { volume: 0.8 });
  }
  playSfx(id: TableSfxId): void { 
    const config = this.sfxConfig[id]; 
    const pool = this.sfxPools.get(id); 
    if (!pool?.length) return; 
    const now = this.scene.time.now; 
    const last = this.lastSfxAt.get(id) ?? 0; 
    if (config.throttleMs && now - last < config.throttleMs) return; 
    this.lastSfxAt.set(id, now); 
    const cursor = this.sfxPoolCursor.get(id) ?? 0; 
    const sound = pool[cursor] as any; 
    this.sfxPoolCursor.set(id, (cursor + 1) % pool.length); 
    if (sound.isPlaying) sound.stop(); 
    sound.play(config.key, { volume: config.volume }); 
  }
  playHaptic(type: GameHapticType): void { this.onHaptic?.(type); }
  playWebFallback(type: GameHapticType): void { const nav = navigator as Navigator & { vibrate?: (pattern: number | readonly number[]) => boolean }; if (typeof nav.vibrate !== "function") return; if (type === "pass-submit") { nav.vibrate([8, 25, 12]); return; } nav.vibrate(type === "tile-discard" ? 14 : 8); }
  private createSoundPools(): void { 
    if (this.sfxReady) return; 
    for (const [id, config] of Object.entries(this.sfxConfig) as [TableSfxId, TableSfxConfig][]) { 
      const pool: Phaser.Sound.BaseSound[] = []; 
      for (let i = 0; i < config.poolSize; i += 1) pool.push(this.scene.sound.addAudioSprite('effects') as any); 
      this.sfxPools.set(id, pool); 
      this.sfxPoolCursor.set(id, 0); 
    } 
    this.sfxReady = true; 
  }
}
