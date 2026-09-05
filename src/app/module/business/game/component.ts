// file: src/app/module/business/game/game-shell/component.ts
import { AfterViewInit, Component, effect, inject, input, OnInit, signal, computed } from "@angular/core";
import { Router } from "@angular/router";


import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { GameService } from "./service";
import { GAME_PROVIDER } from "./provider";
import { PassDirection } from "./phaser/type";
import { GamePhaseFirstRoundDirectionEnum, GameCharlestoneStageEnum } from "@bfw/api-sdk/graphql/endpoints/business";
import { GameInstanceRoute, GameRoute } from './route';
import { GameHeptic } from "./haptics";
import { PhaserComponent } from "./phaser/component";


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
export class GameComponent implements OnInit, AfterViewInit {
  public readonly gkeyid = input<string>();

  protected readonly service = inject(GameService);
  private readonly router = inject(Router);


  readonly selectedTileIds = signal<readonly number[]>([]);
  readonly boardVisible = signal(true);
  readonly passDirection = signal<PassDirection>(GamePhaseFirstRoundDirectionEnum.RIGHT);

  constructor() {
    effect(() => {
      this.service.state.setUrlGkeyid(this.gkeyid());
    });

  }

  async ngOnInit(): Promise<void> {
    await this.service.state.whenReady();
    //this.service.state.setGkeyid(this.gkeyid());

    console.log('GAME KEY', this.gkeyid());

    if (this.gkeyid()) {
      const gameStartedResp = await this.service.state.startGame();

    } else {
      const gameCreatedResp = await this.service.state.createGame();
      console.log('gameCreatedResp', gameCreatedResp);

      if (!gameCreatedResp) return;

      if (gameCreatedResp.keyid) {
        const redirect = GameInstanceRoute.absolutePath(gameCreatedResp.keyid);
        console.log('redirect', redirect);

        // if accessing authenticated route without being authenticated then redirect to signin page
        this.router.navigateByUrl(redirect);
        return;
      }
    }
  }

  public async ngAfterViewInit(): Promise<void> {
    await this.init();
  }

  async init() {
    //await this.service.startGame();
  }



  async restartGame(): Promise<void> {
    // Destroying and recreating the board is safer than trying to reset each
    // Phaser object individually. It guarantees a clean rack and table UI.
    this.boardVisible.set(false);
    try {
      await this.service.state.startGame();
    } finally {
      this.boardVisible.set(true);
    }
  }

  async quitGame(): Promise<void> {
    // The Start Game link lives on the home page, so leaving the board returns
    // there and destroys the Phaser game cleanly.
    await this.router.navigateByUrl("/");
  }

}
