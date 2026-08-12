import { Injectable, Service } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import {
  Haptics,
  ImpactStyle,
  NotificationType,
} from "@capacitor/haptics";
import { GameHapticType } from "./type";



@Service({ autoProvided: false })
export class GameHeptic {
  private lastAt = 0;
  private readonly throttleMs = 45;

  async play(type: GameHapticType): Promise<void> {
    const now = performance.now();

    if (now - this.lastAt < this.throttleMs) {
      return;
    }

    this.lastAt = now;

    try {
      if (Capacitor.isNativePlatform()) {
        await this.playNative(type);
        return;
      }

      this.playWebFallback(type);
    } catch {
      // Never throw from gameplay/input paths.
    }
  }

  private async playNative(type: GameHapticType): Promise<void> {
    switch (type) {
      case "tile-tap":
        await Haptics.selectionChanged();
        return;

      case "tile-discard":
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;

      case "tile-pass":
      case "tile-return":
      case "pick":
        await Haptics.impact({ style: ImpactStyle.Light });
        return;

      case "pass-submit":
        await Haptics.notification({ type: NotificationType.Success });
        return;
    }
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
}
/* import { Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import {
  Haptics,
  ImpactStyle,
  NotificationType,
} from "@capacitor/haptics";

export type GameHapticType =
  | "tile-tap"
  | "tile-discard"
  | "tile-pass"
  | "tile-return"
  | "pick"
  | "pass-submit";

@Injectable({ providedIn: "root" })
export class GameHapticsService {
  private readonly isNative = Capacitor.isNativePlatform();
  private lastAt = 0;
  private readonly throttleMs = 45;

  async play(type: GameHapticType): Promise<void> {
    const now = performance.now();

    if (now - this.lastAt < this.throttleMs) {
      return;
    }

    this.lastAt = now;

    try {
      if (this.isNative) {
        await this.playNative(type);
        return;
      }

      this.playWebFallback(type);
    } catch {
      // Do not throw from input/gameplay paths.
    }
  }

  private async playNative(type: GameHapticType): Promise<void> {
    switch (type) {
      case "tile-tap":
        await Haptics.selectionChanged();
        return;

      case "tile-discard":
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;

      case "tile-pass":
      case "tile-return":
      case "pick":
        await Haptics.impact({ style: ImpactStyle.Light });
        return;

      case "pass-submit":
        await Haptics.notification({ type: NotificationType.Success });
        return;
    }
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
} */