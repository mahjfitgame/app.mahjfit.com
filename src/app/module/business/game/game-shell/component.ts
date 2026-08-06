// file: src/app/module/business/game/game-shell/component.ts
import { NgIf } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { PhaserBoardComponent } from "../phaser/component";
import { PassDirection, TileSoundKey, TileSuit, TileVm } from "../model/tile";
import { resolveTileSoundKey } from "../model/tile-sound.resolver";
import { TablePhase } from "../model/table-phase";
import { DeadHandClaim, DemoDiscardRequest, JoinTableRequest, JoinTableRequestDecision, MahjongWinCelebration, PlayerAwayNotice, PlayerRemovalRequest, TileCallDecision, TileCallOffer } from "../phaser/scenes/type";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { GameService } from "../service";


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
  imports: [NgIf, PhaserBoardComponent],
  template: `
    <button
      class="phase-debug-toggle"
      type="button"
      [attr.aria-label]="debugPanelCollapsed() ? 'Show game test controls' : 'Hide game test controls'"
      (click)="toggleDebugPanel()"
    >
      {{ debugPanelCollapsed() ? '‹' : '›' }}
    </button>
    <div class="phase-debug-panel" [class.is-collapsed]="debugPanelCollapsed()">
      <label>
        Phase
        <select
          [value]="debugPhase()"
          (change)="setDebugPhase($any($event.target).value)"
        >
          <option value="playing">Playing</option>
          <option value="passing">Passing</option>
          <option value="discard">Discard</option>
        </select>
      </label>
      <div class="discard-test-actions">
        <button type="button" (click)="testMahjongWin()">Test Mah Jongg</button>
        <button type="button" (click)="testPlayerAway()">Test away player</button>
        <button type="button" (click)="testJoinRequest()">Test join request</button>
      </div>
    </div>
    <!-- <button class="haptic-test-button"
      (click)="testHaptic()"
    >
      Test Haptic
    </button> -->
    <app-phaser-board
      *ngIf="boardVisible()"
      [rack]="rack()"
      [passDirection]="passDirection()"
      [tablePhase]="tablePhase()"
      [tileCallOffer]="tileCallOffer()"
      [demoDiscard]="demoDiscard()"
      [mahjongWin]="mahjongWin()"
      [playerAway]="playerAway()"
      [joinTableRequest]="joinTableRequest()"
      (tileCallDecision)="handleTileCallDecision($event)"
      (playerRemovalRequested)="handlePlayerRemoval($event)"
      (deadHandClaimed)="handleDeadHandClaim($event)"
      (temporaryDiscardCompleted)="endDiscardTest()"
      (joinTableRequestDecision)="handleJoinRequestDecision($event)"
      (restartGame)="restartGame()"
      (quitGame)="quitGame()"
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
        top: max(100px, env(safe-area-inset-top));
        right: max(12px, env(safe-area-inset-left));
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
        font: 600 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #0f172a;
        user-select: none;
        transition: transform 180ms ease, opacity 180ms ease;
      }

      /* The panel moves completely outside the table. The arrow remains at
         the right exposure area so it can always be used to restore it. */
      .phase-debug-panel.is-collapsed {
        transform: translateX(calc(100% + 20px));
        opacity: 0;
        pointer-events: none;
      }

      .phase-debug-toggle {
        position: fixed;
        z-index: 10000;
        top: 50%;
        right: max(4px, env(safe-area-inset-right));
        transform: translateY(-50%);
        width: 28px;
        height: 48px;
        border: 0;
        border-radius: 10px 0 0 10px;
        background: #b92a90;
        color: #ffffff;
        cursor: pointer;
        font: 700 30px/1 system-ui, sans-serif;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.28);
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

      .discard-test-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .discard-test-actions button {
        border: 0;
        border-radius: 6px;
        background: #b92a90;
        color: #fff;
        cursor: pointer;
        font: inherit;
        padding: 5px 7px;
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

  protected readonly service = inject(GameService);
  private readonly router = inject(Router);


  readonly selectedTileIds = signal<readonly string[]>([]);
  /** Controls the temporary test panel only; it does not change game state. */
  readonly debugPanelCollapsed = signal(false);
  /** Recreating the Phaser board clears every local tile, discard and popup. */
  readonly boardVisible = signal(true);
  readonly passDirection = signal<PassDirection>("right");
  readonly tablePhase = signal<TablePhase>("playing");
  readonly debugPhase = signal<TablePhase>("playing");
  readonly tileCallOffer = signal<TileCallOffer | null>(null);
  readonly demoDiscard = signal<DemoDiscardRequest | null>(null);
  readonly mahjongWin = signal<MahjongWinCelebration | null>(null);
  readonly playerAway = signal<PlayerAwayNotice | null>(null);
  readonly joinTableRequest = signal<JoinTableRequest | null>(null);
  private demoDiscardRequestId = 0;
  private mahjongWinRequestId = 0;
  private playerAwayRequestId = 0;
  private joinRequestId = 0;
  

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

  public async ngAfterViewInit(): Promise<void> {
      await this.init();
  }

  async init(){
    //await this.service.startGame();
  }

  setDebugPhase(phase: TablePhase): void {
    // "discard" is a temporary local test phase. The real game receives its
    // phases from the backend in the same way as playing and passing.
    this.debugPhase.set(phase);
    this.tablePhase.set(phase);
  }

  toggleDebugPanel(): void {
    this.debugPanelCollapsed.update((collapsed) => !collapsed);
  }

  endDiscardTest(): void {
    // The Phaser scene calls this after one opponent test discard. Returning
    // to Playing keeps Call, exposure editing, and Joker Swap available.
    this.debugPhase.set("playing");
    this.tablePhase.set("playing");
  }

  async restartGame(): Promise<void> {
    // Destroying and recreating the board is safer than trying to reset each
    // Phaser object individually. It guarantees a clean rack and table UI.
    this.boardVisible.set(false);
    try {
      await this.service.startGame();
    } finally {
      this.boardVisible.set(true);
    }
  }

  async quitGame(): Promise<void> {
    // The Start Game link lives on the home page, so leaving the board returns
    // there and destroys the Phaser game cleanly.
    await this.router.navigateByUrl("/");
  }

  testMahjongWin(): void {
    this.mahjongWin.set({ winner: "bottom", requestId: ++this.mahjongWinRequestId });
  }

  testPlayerAway(): void {
    this.playerAway.set({
      seat: "top",
      playerName: "PLAYER 1",
      awaySinceMs: Date.now() - 2 * 60 * 1000,
      requestId: ++this.playerAwayRequestId,
    });
  }

  testJoinRequest(): void {
    this.joinTableRequest.set({ requestId: `join-${++this.joinRequestId}`, playerName: "NEW PLAYER" });
  }

  handleJoinRequestDecision(decision: JoinTableRequestDecision): void {
    console.log("[Join request decision]", decision);
    this.joinTableRequest.set(null);
  }

  handlePlayerRemoval(request: PlayerRemovalRequest): void {
    console.log("[Player removal requested]", request);
    this.playerAway.set(null);
  }

  handleDeadHandClaim(claim: DeadHandClaim): void {
    console.log("[Dead hand claim]", claim);
  }

  handleTileCallDecision(decision: TileCallDecision): void {
    console.log("[Tile call decision]", decision);
    this.tileCallOffer.set(null);
  }
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
