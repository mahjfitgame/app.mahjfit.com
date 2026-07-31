import { computed, inject, Service, signal } from '@angular/core';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';

import { type PlatformAdapter } from './adapter';
import {
  PLATFORM_KBD_EVENT_DID_HIDE,
  PLATFORM_KBD_EVENT_DID_SHOW,
  PLATFORM_KBD_EVENT_WILL_HIDE,
  PLATFORM_KBD_EVENT_WILL_SHOW,
  PLATFORM_NETWORK_CONNECTION_UNKNOWN,
  PLATFORM_ORIENTATION_NATURAL,
} from './const';
import { PlatformKeyboardResizeEnum } from './enum';
import { AppModuleStateType } from '@libs/utility/type';
import type {
  PlatformKeyboardPhase,
  PlatformNetworkConnectionType,
  PlatformNetworkStatusType,
  PlatformOrientationType,
  PlatformPluginListenerHandleType,
  PlatformScreenSizeType,
} from './type';
import { PLATFORM_ADAPTER } from './provider';

@Service()
export class PlatformState extends SignalStateService implements AppModuleStateType {

  // ████ DEPENDENCIES ████████████████████████████████████████████████

  private readonly adapter: PlatformAdapter = inject(PLATFORM_ADAPTER);
  private readonly log = inject(LogService);

  // ████ CLASS PROPERTIES ████████████████████████████████████████████

  public override readonly storeKey = 'p';

  private initPromise: Promise<void> | null = null;
  private runtimeActive = false;
  private runtimeInitialized = false;

  // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
  // n/a

  // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

  // for persistent storage params for security reasons keep names unpredictable obfuscated, such as dtoken becomes token
  private readonly _batteryLevel = signal<number | null>(null);
  public readonly batteryLevel = this._batteryLevel.asReadonly();

  private readonly _isCharging = signal<boolean | null>(null);
  public readonly isCharging = this._isCharging.asReadonly();

  private readonly _networkConnected = signal<boolean | null>(null);
  public readonly networkConnected = this._networkConnected.asReadonly();
  public readonly isOnline = computed(() => this.networkConnected() === true);

  private readonly _networkConnectionType = signal<PlatformNetworkConnectionType>(
    PLATFORM_NETWORK_CONNECTION_UNKNOWN,
  );
  public readonly networkConnectionType = this._networkConnectionType.asReadonly();

  private readonly _orientation = signal<PlatformOrientationType>(PLATFORM_ORIENTATION_NATURAL);
  public readonly orientation = this._orientation.asReadonly();

  private readonly _screenSize = signal<PlatformScreenSizeType>({ width: 0, height: 0 });
  public readonly screenSize = this._screenSize.asReadonly();

  private readonly _kbdIsVisible = signal(false);
  public readonly kbdIsVisible = this._kbdIsVisible.asReadonly();

  private readonly _kbdHeight = signal(0);
  public readonly kbdHeight = this._kbdHeight.asReadonly();

  private readonly _kbdResizeMode = signal<PlatformKeyboardResizeEnum>(
    PlatformKeyboardResizeEnum.None,
  );
  public readonly kbdResizeMode = this._kbdResizeMode.asReadonly();

  private readonly _kbdPhase = signal<PlatformKeyboardPhase>(PLATFORM_KBD_EVENT_DID_HIDE);
  public readonly kbdPhase = this._kbdPhase.asReadonly();

  private readonly _runtimeReady = signal(false);
  public readonly runtimeReady = this._runtimeReady.asReadonly();

  // ████ STATE DEBUGGER ██████████████████████████████████████████████

  public readonly debugState = computed(() => ({
      batteryLevel: this.batteryLevel(),
      isCharging: this.isCharging(),
      networkConnected: this.networkConnected(),
      isOnline: this.isOnline(),
      networkConnectionType: this.networkConnectionType(),
      orientation: this.orientation(),
      screenSize: this.screenSize(),
      kbdIsVisible: this.kbdIsVisible(),
      kbdHeight: this.kbdHeight(),
      kbdResizeMode: this.kbdResizeMode(),
      kbdPhase: this.kbdPhase(),
      runtimeReady: this.runtimeReady(),
  }));
  constructor() {
    super();
    this.initializeSignalState();
  }

  // ████ LISTENERS ███████████████████████████████████████████████████

  public override onActivate(): void {
    this.runtimeActive = true;
    void this.init();
  }

  public override onDeactivate(): void {
    this.runtimeActive = false;
    this._runtimeReady.set(false);
  }

  // ████ SIGNAL METHODS ██████████████████████████████████████████████

  /** Resolves after the initial runtime snapshot and listeners have been initialized. */
  public async init(): Promise<void> {
    if (this.runtimeInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeRuntime().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  private async initializeRuntime(): Promise<void> {
    this.setScreenSize(this.adapter.screenSize());

    await this.initializeRuntimeListeners();
    await Promise.all([this.refreshRuntimeSnapshot(), this.waitForPersistedState()]);

    if (this.runtimeActive) {
      this.runtimeInitialized = true;
      this._runtimeReady.set(true);
    }
  }

  private async initializeRuntimeListeners(): Promise<void> {
    const removeScreenResize = this.adapter.onScreenResize((size) => this.setScreenSize(size));
    this.registerDeactivationCleanup(removeScreenResize);

    await Promise.all([
      this.initializeNetworkListener(),
      this.initializeOrientationListener(),
      this.initializeKeyboardListeners(),
    ]);
  }

  private async initializeNetworkListener(): Promise<void> {
    const remove = await this.safeInvoke(
      () => this.adapter.onNetworkStatusChange((status) => this.setNetworkStatus(status)),
      'onNetworkStatusChange',
    );

    if (remove) {
      this.registerAsyncCleanup(remove, 'network listener');
    }
  }

  private async initializeOrientationListener(): Promise<void> {
    const remove = await this.safeInvoke(
      () => this.adapter.onOrientationChange((result) => this.setOrientation(result.type)),
      'onOrientationChange',
    );

    if (remove) {
      this.registerAsyncCleanup(remove, 'orientation listener');
    }
  }

  private async initializeKeyboardListeners(): Promise<void> {
    const listeners = await Promise.all([
      this.safeInvoke(
        () =>
          this.adapter.addKeyboardWillShowListener((info) => {
            this.setKeyboardShown(info.keyboardHeight, PLATFORM_KBD_EVENT_WILL_SHOW);
          }),
        'addKeyboardWillShowListener',
      ),
      this.safeInvoke(
        () =>
          this.adapter.addKeyboardDidShowListener((info) => {
            this.setKeyboardShown(info.keyboardHeight, PLATFORM_KBD_EVENT_DID_SHOW);
          }),
        'addKeyboardDidShowListener',
      ),
      this.safeInvoke(
        () =>
          this.adapter.addKeyboardWillHideListener(() => {
            this._kbdPhase.set(PLATFORM_KBD_EVENT_WILL_HIDE);
          }),
        'addKeyboardWillHideListener',
      ),
      this.safeInvoke(
        () => this.adapter.addKeyboardDidHideListener(() => this.setKeyboardHidden()),
        'addKeyboardDidHideListener',
      ),
    ]);

    for (const listener of listeners) {
      if (listener) {
        this.registerPluginListenerCleanup(listener);
      }
    }
  }

  private async refreshRuntimeSnapshot(): Promise<void> {
    await Promise.all([
      this.refreshBatteryInfo(),
      this.refreshNetworkStatus(),
      this.refreshOrientation(),
      this.refreshKeyboardResizeMode(),
    ]);
  }

  private async refreshBatteryInfo(): Promise<void> {
    const info = await this.safeInvoke(() => this.adapter.batteryInfo(), 'batteryInfo');
    if (!info || !this.runtimeActive) {
      return;
    }

    if (info.batteryLevel !== undefined) {
      const percentage = info.batteryLevel <= 1 ? info.batteryLevel * 100 : info.batteryLevel;
      this._batteryLevel.set(Math.max(0, Math.min(100, Math.round(percentage))));
    }

    if (info.isCharging !== undefined) {
      this._isCharging.set(info.isCharging);
    }
  }

  private async refreshNetworkStatus(): Promise<void> {
    const status = await this.safeInvoke(() => this.adapter.networkStatus(), 'networkStatus');
    if (status && this.runtimeActive) {
      this.setNetworkStatus(status);
    }
  }

  private async refreshOrientation(): Promise<void> {
    const orientation = await this.safeInvoke(
      () => this.adapter.currentOrientation(),
      'currentOrientation',
    );
    if (orientation && this.runtimeActive) {
      this.setOrientation(orientation);
    }
  }

  private async refreshKeyboardResizeMode(): Promise<void> {
    const mode = await this.safeInvoke(
      () => this.adapter.getKeyboardResizeMode(),
      'getKeyboardResizeMode',
    );
    if (mode !== null && this.runtimeActive) {
      this._kbdResizeMode.set(mode);
    }
  }

  private async waitForPersistedState(): Promise<void> {
    while (this.runtimeActive && !this.ready()) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }

  private setNetworkStatus(status: PlatformNetworkStatusType): void {
    if (!this.runtimeActive) {
      return;
    }

    this._networkConnected.set(status.connected);
    this._networkConnectionType.set(status.connectionType);
  }

  private setOrientation(orientation: PlatformOrientationType): void {
    if (this.runtimeActive) {
      this._orientation.set(orientation);
    }
  }

  private setScreenSize(size: PlatformScreenSizeType): void {
    if (!this.runtimeActive) {
      return;
    }

    const current = this._screenSize();
    if (current.width !== size.width || current.height !== size.height) {
      this._screenSize.set(size);
    }
  }

  private setKeyboardShown(height: number, phase: PlatformKeyboardPhase): void {
    if (!this.runtimeActive) {
      return;
    }

    this._kbdIsVisible.set(true);
    this._kbdHeight.set(height);
    this._kbdPhase.set(phase);
  }

  private setKeyboardHidden(): void {
    if (!this.runtimeActive) {
      return;
    }

    this._kbdIsVisible.set(false);
    this._kbdHeight.set(0);
    this._kbdPhase.set(PLATFORM_KBD_EVENT_DID_HIDE);
  }

  // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
  // n/a

  // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

  private registerPluginListenerCleanup(listener: PlatformPluginListenerHandleType): void {
    this.registerAsyncCleanup(() => listener.remove(), 'plugin listener');
  }

  private registerAsyncCleanup(cleanup: () => Promise<void>, name: string): void {
    this.registerDeactivationCleanup(() => {
      void cleanup().catch((error) => {
        this.log.warn(`[PlatformState] ${name} cleanup failed`, error);
      });
    });
  }

  private async safeInvoke<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.log.warn(`[PlatformState] ${operationName} failed`, error);
      return null;
    }
  }

  // ████ API CALLS ███████████████████████████████████████████████████
  // n/a

  // ████ WEB SOCKET CALLS ████████████████████████████████████████████
  // n/a
}
