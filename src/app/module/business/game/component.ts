// file: src/app/module/business/game/game-shell/component.ts
import { AfterViewInit, Component, effect, inject, input, OnInit, signal, computed } from "@angular/core";
import { JsonPipe } from "@angular/common";
import { Router } from "@angular/router";
import { GameService } from "./service";
import { GAME_PROVIDER } from "./provider";
import { PassDirection } from "./phaser/type";
import { GamePhaseFirstRoundDirectionEnum } from "@bfw/api-sdk/graphql/endpoints/business";
import { GameInstanceRoute } from './route';
import { PhaserComponent } from "./phaser/component";
import { MatIconModule } from '@angular/material/icon';
import { environment } from "../../../../../env/env";


@Component({
  selector: "app-game",
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    PhaserComponent,
    JsonPipe,
    MatIconModule
  ],
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
  readonly isDebugVisible = signal(false);
  /** Debug UI is excluded from the rendered page unless the debug build enables it. */
  readonly isDebugEnvironment = environment.DEBUG === true;

  toggleDebug() {
    if (!this.isDebugEnvironment) return;
    this.isDebugVisible.set(!this.isDebugVisible());
  }

  async sendDebugEmail(): Promise<void> {
    if (!this.isDebugEnvironment) return;

    const debugJson = JSON.stringify(this.service.state.debugState(), null, 2);
    let copied = false;
    try {
      await navigator.clipboard.writeText(debugJson);
      copied = true;
    } catch {
      // Email still opens below. Clipboard access can be unavailable on an
      // insecure origin or when the browser blocks that permission.
    }

    const subject = "MahjFit debug game state";
    const fullBody = `MahjFit debug game state\n\n${debugJson}`;
    const encodedFullBody = encodeURIComponent(fullBody);
    // Mail clients impose URL-size limits. The complete snapshot is always
    // copied first; prefill it only when the mailto URL remains reliable.
    const body = encodedFullBody.length <= 60_000
      ? fullBody
      : copied
        ? "The complete MahjFit debug JSON has been copied to the clipboard. Please paste it into this email."
        : "The debug JSON is too large to add automatically, and clipboard access was unavailable.";

    window.location.href = `mailto:thatsenddev@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  constructor() {
    effect(() => {
      this.service.state.setUrlGkeyid(this.gkeyid());
    });

  }

  async ngOnInit(): Promise<void> {
    await this.service.state.whenReady();
    //this.service.state.setGkeyid(this.gkeyid());

    // console.log('GAME KEY', this.gkeyid());

    if (this.gkeyid()) {
      const gameStartedResp = await this.service.state.startGame();

    } else {
      const gameCreatedResp = await this.service.state.createGame();
      // console.log('gameCreatedResp', gameCreatedResp);

      if (!gameCreatedResp) return;

      if (gameCreatedResp.keyid) {
        const redirect = GameInstanceRoute.absolutePath(gameCreatedResp.keyid);
        // console.log('redirect', redirect);

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

    // Give Angular and the browser a moment to fully destroy the previous Phaser canvas
    // and release the WebGL context before initializing a new one.
    await new Promise(resolve => setTimeout(resolve, 100));

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
