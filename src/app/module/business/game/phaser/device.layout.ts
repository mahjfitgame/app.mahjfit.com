// device-layout.service.ts
import { Injectable, OnDestroy, Service } from "@angular/core";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";
import {
  ScreenOrientation,
  type OrientationLockType,
  type ScreenOrientationResult,
} from "@capacitor/screen-orientation";
import type { PluginListenerHandle } from "@capacitor/core";
import { DeviceLayoutMode, DeviceLayoutState, NativeOrientation } from "./type";

@Service({ autoProvided: false })
export class DeviceLayout implements OnDestroy {
  private readonly stateSubject = new BehaviorSubject<DeviceLayoutState>(
    this.readState(),
  );

  readonly state$ = this.stateSubject.pipe(
    distinctUntilChanged(
      (a, b) =>
        a.width === b.width &&
        a.height === b.height &&
        a.orientation === b.orientation &&
        a.nativeOrientation === b.nativeOrientation &&
        a.layout === b.layout,
    ),
  );

  private nativeOrientation?: NativeOrientation;
  private nativeListener?: PluginListenerHandle;
  private animationFrame?: number;

  constructor() {
    this.start();
  }

  get current(): DeviceLayoutState {
    return this.stateSubject.value;
  }

  public forViewport(width: number, height: number): DeviceLayoutState {
    const normalizedWidth = Math.max(1, Math.round(width));
    const normalizedHeight = Math.max(1, Math.round(height));

    return {
      width: normalizedWidth,
      height: normalizedHeight,
      orientation:
        normalizedHeight >= normalizedWidth ? "portrait" : "landscape",
      nativeOrientation: this.nativeOrientation,
      layout: this.resolveDeviceLayout(normalizedWidth, normalizedHeight),
    };
  }
  public resolveDeviceLayout(width: number, height: number): DeviceLayoutMode {
    const orientation = height >= width ? "portrait" : "landscape";

    if (orientation === "portrait" && width <= 520) return "phone-portrait";
    if (orientation === "landscape" && height <= 520 && width <= 980) {
      return "phone-landscape";
    }
    if (orientation === "portrait" && width <= 1180 && height <= 1400) {
      return "tablet-portrait";
    }
    if (
      orientation === "landscape" &&
      width > 760 && width <= 1180 && height > 520 && height <= 900
    ) {
      return "tablet-landscape";
    }

    return "desktop";
  }

  async lock(orientation: OrientationLockType): Promise<void> {
    await ScreenOrientation.lock({ orientation });
  }

  async unlock(): Promise<void> {
    await ScreenOrientation.unlock();
  }

  private async start(): Promise<void> {
    if (typeof window === "undefined") return;

    window.addEventListener("resize", this.scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener("resize", this.scheduleUpdate, {
      passive: true,
    });

    try {
      const result = await ScreenOrientation.orientation();
      this.nativeOrientation = result.type;

      this.nativeListener = await ScreenOrientation.addListener(
        "screenOrientationChange",
        ({ type }) => {
          this.nativeOrientation = type;

          // Wait for the WebView viewport to finish resizing.
          this.scheduleUpdate();
        },
      );
    } catch {
      // Browser/unsupported-platform fallback still works through resize events.
    }

    this.update();
  }

  private readonly scheduleUpdate = (): void => {
    if (typeof window === "undefined") return;

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = undefined;
      this.update();
    });
  };

  private update(): void {
    this.stateSubject.next(this.readState());
  }

  private readState(): DeviceLayoutState {
    if (typeof window === "undefined") {
      return {
        width: 0,
        height: 0,
        orientation: "portrait",
        layout: "desktop",
      };
    }

    const viewport = window.visualViewport;
    return this.forViewport(
      viewport?.width ?? window.innerWidth,
      viewport?.height ?? window.innerHeight,
    );
  }

  async ngOnDestroy(): Promise<void> {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.scheduleUpdate);
      window.visualViewport?.removeEventListener(
        "resize",
        this.scheduleUpdate,
      );
    }

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }

    await this.nativeListener?.remove();
  }



  get layout(): DeviceLayoutMode {
    return this.current.layout;
  }

  get width(): number {
    return this.current.width;
  }

  get height(): number {
    return this.current.height;
  }

  get isPhonePortrait(): boolean {
    return this.layout === "phone-portrait";
  }

  get isPhoneLandscape(): boolean {
    return this.layout === "phone-landscape";
  }

  get isTabletPortrait(): boolean {
    return this.layout === "tablet-portrait";
  }

  get isTabletLandscape(): boolean {
    return this.layout === "tablet-landscape";
  }

  get isDesktop(): boolean {
    return this.layout === "desktop";
  }
}
