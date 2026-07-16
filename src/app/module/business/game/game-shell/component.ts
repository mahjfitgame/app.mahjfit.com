// file: src/app/module/business/game/game-shell/component.ts
import { Component, signal } from "@angular/core";
import { PhaserBoardComponent } from "../phaser/component";
import { PassDirection, TileSoundKey, TileSuit, TileVm } from "../model/tile";
import { resolveTileSoundKey } from "../model/tile-sound.resolver";
import { TablePhase } from "../model/table-phase";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

interface TileVmInput {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly suit: TileSuit;
  readonly rank?: number;
  readonly asset: string;
}


function createTileVm(input: TileVmInput): TileVm {
  return {
    id: input.id,
    label: input.label,
    suit: input.suit,
    asset: input.asset,
    soundKey: resolveTileSoundKey(input),
  };
}
@Component({
  selector: "app-game-shell",
  standalone: true,
  imports: [PhaserBoardComponent],
  template: `
    <div class="phase-debug-panel">
      <label>
        Phase
        <select
          [value]="tablePhase()"
          (change)="tablePhase.set($any($event.target).value)"
        >
          <option value="playing">Playing</option>
          <option value="passing">Passing</option>
        </select>
      </label>
    </div>
    <button class="haptic-test-button"
      (click)="testHaptic()"
    >
      Test Haptic
    </button>
    <app-phaser-board
      [rack]="rack()"
      [passDirection]="passDirection()"
      [tablePhase]="tablePhase()"
      (selectionChanged)="selectedTileIds.set($event)"
      (passCompleted)="handlePassCompleted($event)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100vw;
        height: 100dvh;
        overflow: hidden;
      }

      .phase-debug-panel {
        position: fixed;
        z-index: 9999;
        top: max(12px, env(safe-area-inset-top));
        left: max(12px, env(safe-area-inset-left));
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
        font: 600 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #0f172a;
        user-select: none;
      }

      .phase-debug-panel label {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .phase-debug-panel select {
        height: 28px;
        border-radius: 8px;
        border: 1px solid rgba(15, 23, 42, 0.18);
        background: white;
        padding: 0 8px;
        font: inherit;
        color: inherit;
      }

      .haptic-test-button {
        position: fixed;
        top: max(80px, env(safe-area-inset-top));
        right: 20px;
        z-index: 2147483647;
        pointer-events: auto;
        padding: 12px 16px;
        border: 2px solid red;
        border-radius: 10px;
        background: yellow;
        color: black;
        font-size: 16px;
        font-weight: 800;
      }
    `,
  ],
})
export class GameShellComponent {
  readonly selectedTileIds = signal<readonly string[]>([]);
  readonly passDirection = signal<PassDirection>("right");
  readonly tablePhase = signal<TablePhase>("playing");
  

  readonly rack = signal<readonly TileVm[]>([
    createTileVm({ id: "t1", code:'D1', label: "Dot 1", suit: "dot", asset: "assets/game/tiles/dot_1.svg" }),
    createTileVm({ id: "t2", code:'B2', label: "Bamboo 2", suit: "bam", asset: "assets/game/tiles/bam_2.svg" }),
    createTileVm({ id: "t3", code:'C4', label: "Character 4", suit: "char", asset: "assets/game/tiles/char_4.svg" }),
    createTileVm({ id: "t4", code:'J1', label: "Joker", suit: "joker", asset: "assets/game/tiles/joker_1.svg" }),
    createTileVm({ id: "t5", code:'D2', label: "Dot 2", suit: "dot", asset: "assets/game/tiles/dot_2.svg" }),
    createTileVm({ id: "t6", code:'D1', label: "Dot 1", suit: "dot", asset: "assets/game/tiles/dot_1.svg" }),
    createTileVm({ id: "t7", code:'C2', label: "Character 2", suit: "char", asset: "assets/game/tiles/char_2.svg" }),
    createTileVm({ id: "t8", code:'C4', label: "Character 4", suit: "char", asset: "assets/game/tiles/char_4.svg" }),
    createTileVm({ id: "t9", code:'F1', label: "Flower", suit: "flower", asset: "assets/game/tiles/flower_1.svg" }),
    createTileVm({ id: "t10", code:'B4', label: "Bamboo 4", suit: "bam", asset: "assets/game/tiles/bam_4.svg" }),
    createTileVm({ id: "t11", code:'B6', label: "Bamboo 6", suit: "bam", asset: "assets/game/tiles/bam_6.svg" }),
    createTileVm({ id: "t12", code:'B8', label: "Bamboo 8", suit: "bam", asset: "assets/game/tiles/bam_8.svg" }),
    createTileVm({ id: "t13", code:'DR', label: "Dragon Red", suit: "dragon", asset: "assets/game/tiles/dragon_red.svg" }),
    createTileVm({ id: "t14", code:'WS', label: "South", suit: "wind", asset: "assets/game/tiles/wind_s.svg" }),
  ]);

  async testHaptic(): Promise<void> {
    console.log("TEST HAPTIC CLICKED");

    await Haptics.impact({ style: ImpactStyle.Heavy });

    setTimeout(() => {
      void Haptics.notification({ type: NotificationType.Success });
    }, 500);

    setTimeout(() => {
      void Haptics.vibrate({ duration: 400 });
    }, 1000);
  }
  handlePassCompletedOLD(event: { readonly tileIds: readonly string[]; readonly direction: PassDirection }): void {
    const passedIds = new Set(event.tileIds);
    this.rack.update((tiles) => tiles.filter((tile) => !passedIds.has(tile.id)));
    this.selectedTileIds.set([]);
  }

  resolveTileSoundKey(tile: {
    suit: TileSuit;
    rank?: number;
    name?: string;
    isJoker?: boolean;
    isFlower?: boolean;
  }): TileSoundKey {
    if (tile.isJoker) return "joker";
    if (tile.isFlower) return "flower";

    if (tile.name === "soap") return "soap";
    if (tile.name === "east") return "east";
    if (tile.name === "south") return "south";
    if (tile.name === "west") return "west";
    if (tile.name === "north") return "north";
    if (tile.name === "red") return "red";
    if (tile.name === "green") return "green";

    if (!tile.rank) {
      throw new Error(`Missing tile rank for sound key: ${JSON.stringify(tile)}`);
    }

    if (tile.suit === "bam") return `${tile.rank}-bam` as TileSoundKey;
    if (tile.suit === "char") return `${tile.rank}-char` as TileSoundKey;
    if (tile.suit === "dot") return `${tile.rank}-dot` as TileSoundKey;

    throw new Error(`Unsupported tile sound: ${JSON.stringify(tile)}`);
  }

  handlePassCompleted(event: {
    readonly tileIds: readonly string[];
    readonly direction: PassDirection;
  }): void {
    const passedIds = new Set(event.tileIds);

    this.rack.update((tiles) =>
      tiles.filter((tile) => !passedIds.has(tile.id)),
    );

    this.selectedTileIds.set([]);

    if (event.direction === "right") {
      this.passDirection.set("across");
      return;
    }

    if (event.direction === "across") {
      this.passDirection.set("left");
      return;
    }

    if (event.direction === "left") {
      this.passDirection.set("right");
    }
  }
}
