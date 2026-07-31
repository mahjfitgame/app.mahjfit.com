// file: src/app/module/business/game/phaser/scenes/managers/sound.ts
import Phaser from "phaser";
import type { TileVm } from "../../../model/tile";
import type { GameHapticType } from "../../../platform/haptics.service";

type TableSfxId = "tile-select" | "tile-pass-waiting" | "tile-return" | "tile-drop" | "pass";

type TableSfxConfig = {
  key: string;
  urls: string[];
  volume: number;
  poolSize: number;
  throttleMs?: number;
};

/** Owns sound playback and haptic feedback for the table scene. */
export class SoundManager {
  private readonly tileVoiceVolume = 0.85;
  private readonly tileVoiceKeys = ["1-bam", "2-bam", "3-bam", "4-bam", "5-bam", "6-bam", "7-bam", "8-bam", "9-bam", "1-crack", "2-crack", "3-crack", "4-crack", "5-crack", "6-crack", "7-crack", "8-crack", "9-crack", "1-dot", "2-dot", "3-dot", "4-dot", "5-dot", "6-dot", "7-dot", "8-dot", "9-dot", "east", "south", "west", "north", "red", "green", "soap", "joker", "flower"] as const;
  private readonly tileVoiceSounds = new Map<string, Phaser.Sound.BaseSound>();
  private currentTileVoice?: Phaser.Sound.BaseSound;
  private lastTileVoiceAt = 0;
  private readonly sfxConfig: Record<TableSfxId, TableSfxConfig> = {
    "tile-select": { key: "sfx-tile-select", urls: ["assets/sounds/tile-select.mp3"], volume: 0.45, poolSize: 3, throttleMs: 35 },
    "tile-pass-waiting": { key: "sfx-tile-pass-waiting", urls: ["assets/sounds/tile-drop.mp3"], volume: 0.5, poolSize: 3, throttleMs: 35 },
    "tile-return": { key: "sfx-tile-return", urls: ["assets/sounds/tile-drop.mp3"], volume: 0.45, poolSize: 2, throttleMs: 45 },
    "tile-drop": { key: "sfx-tile-drop", urls: ["assets/sounds/tile-drop.mp3"], volume: 0.5, poolSize: 2, throttleMs: 45 },
    pass: { key: "sfx-pass", urls: ["assets/sounds/pass.mp3"], volume: 0.65, poolSize: 1, throttleMs: 150 },
  };
  private readonly sfxPools = new Map<TableSfxId, Phaser.Sound.BaseSound[]>();
  private readonly sfxPoolCursor = new Map<TableSfxId, number>();
  private readonly lastSfxAt = new Map<TableSfxId, number>();
  private sfxReady = false;

  constructor(private readonly scene: Phaser.Scene, private readonly onHaptic?: (type: GameHapticType) => void) {}

  preload(): void { for (const config of Object.values(this.sfxConfig)) if (!this.scene.cache.audio.exists(config.key)) this.scene.load.audio(config.key, config.urls); for (const key of this.tileVoiceKeys) { const audioKey = this.tileVoiceAudioKey(key); if (!this.scene.cache.audio.exists(audioKey)) this.scene.load.audio(audioKey, [`assets/sounds/${key}.wav`]); } }
  create(): void { this.createSoundPools(); this.createTileVoiceSounds(); }
  destroy(): void { if (this.currentTileVoice?.isPlaying) this.currentTileVoice.stop(); this.currentTileVoice = undefined; for (const sound of this.tileVoiceSounds.values()) sound.destroy(); this.tileVoiceSounds.clear(); }
  playTileDiscardVoice(vm: TileVm): void { const key = vm.soundKey; const sound = key ? this.tileVoiceSounds.get(key) : undefined; if (!sound || this.scene.time.now - this.lastTileVoiceAt < 80) return; this.lastTileVoiceAt = this.scene.time.now; if (this.currentTileVoice?.isPlaying) this.currentTileVoice.stop(); this.currentTileVoice = sound; if (sound.isPlaying) sound.stop(); sound.play({ volume: this.tileVoiceVolume }); }
  playSfx(id: TableSfxId): void { const config = this.sfxConfig[id]; const pool = this.sfxPools.get(id); if (!pool?.length) return; const now = this.scene.time.now; const last = this.lastSfxAt.get(id) ?? 0; if (config.throttleMs && now - last < config.throttleMs) return; this.lastSfxAt.set(id, now); const cursor = this.sfxPoolCursor.get(id) ?? 0; const sound = pool[cursor]; this.sfxPoolCursor.set(id, (cursor + 1) % pool.length); if (sound.isPlaying) sound.stop(); sound.play({ volume: config.volume }); }
  playHaptic(type: GameHapticType): void { this.onHaptic?.(type); }
  playWebFallback(type: GameHapticType): void { const nav = navigator as Navigator & { vibrate?: (pattern: number | readonly number[]) => boolean }; if (typeof nav.vibrate !== "function") return; if (type === "pass-submit") { nav.vibrate([8, 25, 12]); return; } nav.vibrate(type === "tile-discard" ? 14 : 8); }
  private tileVoiceAudioKey(key: string): string { return `tile-voice-${key}`; }
  private createTileVoiceSounds(): void { if (this.tileVoiceSounds.size) return; for (const key of this.tileVoiceKeys) { const audioKey = this.tileVoiceAudioKey(key); if (this.scene.cache.audio.exists(audioKey)) this.tileVoiceSounds.set(key, this.scene.sound.add(audioKey, { volume: this.tileVoiceVolume })); } }
  private createSoundPools(): void { if (this.sfxReady) return; for (const [id, config] of Object.entries(this.sfxConfig) as [TableSfxId, TableSfxConfig][]) { if (!this.scene.cache.audio.exists(config.key)) continue; const pool: Phaser.Sound.BaseSound[] = []; for (let i = 0; i < config.poolSize; i += 1) pool.push(this.scene.sound.add(config.key, { volume: config.volume })); this.sfxPools.set(id, pool); this.sfxPoolCursor.set(id, 0); } this.sfxReady = true; }
}
