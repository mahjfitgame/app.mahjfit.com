// file: src/app/module/business/game/game-shell/component.ts
import { Component, effect, inject, input, signal } from "@angular/core";
import { Router } from "@angular/router";
import { PhaserComponent } from "./phaser/component";
import { DeadHandClaim, DemoDiscardRequest, JoinTableRequest, JoinTableRequestDecision, MahjongWinCelebration, PlayerAwayNotice, PlayerRemovalRequest, TileCallDecision, TileCallOffer } from "./phaser/type";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { GameService } from "./service";
import { GAME_PROVIDER } from "./provider";
import { TablePhase } from "./phaser/type";
import { PassDirection, TileVm } from "./type";


@Component({
  selector: "app-game",
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [PhaserComponent],
  providers: [
    GAME_PROVIDER
  ]
})
export class GameComponent {
  public readonly gkeyid = input<string>();

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
    this.service.createTileVm({ id: "t1", code: 'D1', label: "Dot 1", suit: "dot", asset: "assets/game/tiles/dot_1.svg" }),
    this.service.createTileVm({ id: "t2", code: 'B2', label: "Bamboo 2", suit: "bam", asset: "assets/game/tiles/bam_2.svg" }),
    this.service.createTileVm({ id: "t3", code: 'C4', label: "Character 4", suit: "char", asset: "assets/game/tiles/char_4.svg" }),
    this.service.createTileVm({ id: "t4", code: 'J1', label: "Joker", suit: "joker", asset: "assets/game/tiles/joker_1.svg" }),
    this.service.createTileVm({ id: "t5", code: 'D2', label: "Dot 2", suit: "dot", asset: "assets/game/tiles/dot_2.svg" }),
    this.service.createTileVm({ id: "t6", code: 'D1', label: "Dot 1", suit: "dot", asset: "assets/game/tiles/dot_1.svg" }),
    this.service.createTileVm({ id: "t7", code: 'C2', label: "Character 2", suit: "char", asset: "assets/game/tiles/char_2.svg" }),
    this.service.createTileVm({ id: "t8", code: 'C4', label: "Character 4", suit: "char", asset: "assets/game/tiles/char_4.svg" }),
    this.service.createTileVm({ id: "t9", code: 'F1', label: "Flower", suit: "flower", asset: "assets/game/tiles/flower_1.svg" }),
    this.service.createTileVm({ id: "t10", code: 'B4', label: "Bamboo 4", suit: "bam", asset: "assets/game/tiles/bam_4.svg" }),
    this.service.createTileVm({ id: "t11", code: 'B6', label: "Bamboo 6", suit: "bam", asset: "assets/game/tiles/bam_6.svg" }),
    this.service.createTileVm({ id: "t12", code: 'B8', label: "Bamboo 8", suit: "bam", asset: "assets/game/tiles/bam_8.svg" }),
    this.service.createTileVm({ id: "t13", code: 'DR', label: "Dragon Red", suit: "dragon", asset: "assets/game/tiles/dragon_red.svg" }),
    this.service.createTileVm({ id: "t14", code: 'WS', label: "South", suit: "wind", asset: "assets/game/tiles/wind_s.svg" }),
  ]);

  constructor() {
    effect(() => {
      this.service.state.setGkeyid(this.gkeyid());
    });
  }

  public async ngAfterViewInit(): Promise<void> {
    await this.init();
  }

  async init() {
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
