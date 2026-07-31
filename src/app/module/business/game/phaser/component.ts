// src/app/game/phaser-board.component.ts
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  SimpleChanges,
  ViewChild,
  effect,
  inject,
  input,
  output,
} from "@angular/core";
import Phaser from "phaser";
import { TileVm, PassDirection } from "../model/tile";
import { TableScene } from "./scenes/scene";
import { TablePhase } from "../model/table-phase";
import { GameHapticsService, GameHapticType } from "../platform/haptics.service";
import { DeviceLayoutService } from "./device-layout.service";

@Component({
  selector: "app-phaser-board",
  standalone: true,
  template: `<div #host class="phaser-host"></div>
  <img
    class="hud-logo"
    src="assets/majhfit-logo@2x.png"
    srcset="
      assets/majhfit-logo@1x.png 1x,
      assets/majhfit-logo@2x.png 2x,
      assets/majhfit-logo@3x.png 3x
    "
    alt="MAJHFIT"
    draggable="false"
  />
  `,
  styles: [
    `
       :host {
        display: block;
        width: 100vw;
        height: 100dvh;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        background: #2f4d99;

        --safe-area-top: env(safe-area-inset-top, 0px);
        --safe-area-right: env(safe-area-inset-right, 0px);
        --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-left: env(safe-area-inset-left, 0px);
      }

      .phaser-host {
        width: 100%;
        height: 100%;
        overflow: hidden;
        touch-action: none;
      }

      .hud-logo {
        position: absolute;
        z-index: 20;
        pointer-events: none;
        user-select: none;

        left: max(56px, calc(env(safe-area-inset-left, 0px) + 56px));
        top: max(11px, calc(env(safe-area-inset-top, 0px) + 11px));

        width: clamp(86px, 7.2vw, 142px);
        height: auto;

        image-rendering: auto;
        transform: translateZ(0);
        backface-visibility: hidden;
      }

      /* Compact mobile portrait */
      @media (max-width: 680px) and (orientation: portrait) {
        .hud-logo {
          left: max(30px, calc(env(safe-area-inset-left, 0px) + 30px));
          top: max(11px, calc(env(safe-area-inset-top, 0px) + 11px));
          width: clamp(58px, 17vw, 76px);
        }
      }

      /* Small landscape phones */
      @media (max-height: 520px) and (orientation: landscape) {
        .hud-logo {
          left: max(46px, calc(env(safe-area-inset-left, 0px) + 46px));
          top: max(8px, calc(env(safe-area-inset-top, 0px) + 8px));
          width: clamp(74px, 8vw, 110px);
        }
      }

    `,
  ],
})
export class PhaserBoardComponent implements AfterViewInit {
  @ViewChild("host", { static: true })
  private readonly hostRef!: ElementRef<HTMLDivElement>;

  readonly rack = input.required<readonly TileVm[]>();
  readonly passDirection = input<PassDirection>("right");
  readonly selectionChanged = output<readonly string[]>();
  readonly passCompleted = output<{ readonly tileIds: readonly string[]; readonly direction: PassDirection }>();

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly haptics = inject(GameHapticsService);

  private game?: Phaser.Game;
  private sceneReady = false;

  readonly tablePhase = input<TablePhase>("playing");
  private readonly deviceLayout = inject(DeviceLayoutService);

  /*constructor() {
    effect(() => {
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("rack:set", this.rack());
    });

     effect(() => {
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("pass:direction", this.passDirection());
    }); 
  } */
  constructor() {
    effect(() => {
      const rack = this.rack();

      if (!this.game || !this.sceneReady) return;

      this.game.events.emit("rack:set", rack);
    });

    effect(() => {
      const direction = this.passDirection();

      if (!this.game || !this.sceneReady) return;

      console.log("[PhaserBoardComponent] emit pass:direction", direction);

      this.game.events.emit("pass:direction", direction);
    });

    effect(() => {
      const tablePhase = this.tablePhase();
      if (!this.game || !this.sceneReady) return;
      this.game.events.emit("table:phase", tablePhase);
    });
  }

  ngAfterViewInit(): void {
    const host = this.hostRef.nativeElement;

    this.zone.runOutsideAngular(() => {
      const scene = new TableScene({
        onSelectionChanged: (ids) => this.zone.run(() => this.selectionChanged.emit(ids)),
        onPassCompleted: (payload) => this.zone.run(() => this.passCompleted.emit(payload)),
        onHaptic: (type: GameHapticType) => {
          void this.haptics.play(type);
        },
        getDeviceLayout: (width, height) =>
          this.deviceLayout.forViewport(width, height),
      });

      this.game = new Phaser.Game({
        type: Phaser.WEBGL,
        parent: host,
        width: Math.max(1, host.clientWidth),
        height: Math.max(1, host.clientHeight),
        backgroundColor: "#2f4d99",

        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },

        render: {
          antialias: true,
          antialiasGL: true,
          roundPixels: true,
          pixelArt: false,
        },

        input: {
          activePointers: 4,
        },

        scene: [scene],
      });

      this.game.events.once("table:ready", () => {
        this.sceneReady = true;
        this.game?.events.emit("table:safe-area", this.readSafeAreaInsets());
        this.game?.events.emit("rack:set", this.rack());
        this.game?.events.emit("pass:direction", this.passDirection());
        this.game?.events.emit("table:phase", this.tablePhase());
        this.game?.events.on(

            "charleston:animation-complete",

            () => {

                console.log("Charleston animation finished");

                /**
                 * Development only.
                 *
                 * Here we will later replace the racks
                 * with the received tiles.
                 */
            }

        );
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!this.game) return;

      const width = Math.max(1, Math.round(host.clientWidth));
      const height = Math.max(1, Math.round(host.clientHeight));

      this.game.scale.resize(width, height);
      this.game.events.emit("table:safe-area", this.readSafeAreaInsets());
      this.game.events.emit("table:resize", width, height);
    });

    resizeObserver.observe(host);

    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
      this.game?.destroy(true);
      this.game = undefined;
      this.sceneReady = false;
    });
  }

  private readSafeAreaInsets(): {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  } {
    const styles = getComputedStyle(this.hostRef.nativeElement);

    return {
      top: this.readCssPx(styles.getPropertyValue("--safe-area-top")),
      right: this.readCssPx(styles.getPropertyValue("--safe-area-right")),
      bottom: this.readCssPx(styles.getPropertyValue("--safe-area-bottom")),
      left: this.readCssPx(styles.getPropertyValue("--safe-area-left")),
    };
  }

  private readCssPx(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
}
