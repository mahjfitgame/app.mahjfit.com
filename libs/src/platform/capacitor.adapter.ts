import { Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import {
  Keyboard,
  type KeyboardResizeOptions,
  type KeyboardStyleOptions,
} from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { ScreenOrientation, type OrientationLockType } from '@capacitor/screen-orientation';

import type { PlatformAdapter } from './adapter';
import {
  PLATFORM_KBD_EVENT_DID_HIDE,
  PLATFORM_KBD_EVENT_DID_SHOW,
  PLATFORM_KBD_EVENT_WILL_HIDE,
  PLATFORM_KBD_EVENT_WILL_SHOW,
  PLATFORM_NETWORK_EVENT_STATUS_CHANGE,
  PLATFORM_ORIENTATION_EVENT_CHANGE,
} from './const';
import { PlatformKeyboardResizeEnum } from './enum';
import type {
  PlatformBatteryInfoType,
  PlatformDeviceIdType,
  PlatformDeviceInfoType,
  PlatformKeyboardAccessoryBarOptionsType,
  PlatformKeyboardInfoType,
  PlatformKeyboardResizeOptionsType,
  PlatformKeyboardScrollOptionsType,
  PlatformKeyboardStyleOptionsType,
  PlatformLanguageCodeType,
  PlatformLanguageTagType,
  PlatformNetworkStatusType,
  PlatformOrientationLockType,
  PlatformOrientationType,
  PlatformPluginListenerHandleType,
  PlatformPluginType,
  PlatformRuntimeInfoType,
  PlatformScreenOrientationResultType,
  PlatformScreenSizeType,
  PlatformType,
} from './type';

interface NavigatorWithUserAgentData extends Navigator {
  readonly userAgentData?: {
    readonly platform?: string;
  };
  readonly deviceMemory?: number;
}

@Service()
export class CapacitorPlatformAdapter implements PlatformAdapter {
  public get platform(): PlatformType {
    return Capacitor.getPlatform() as PlatformType;
  }

  public get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public isPluginAvailable(plugin: PlatformPluginType): boolean {
    return Capacitor.isPluginAvailable(plugin);
  }

  public runtimeInfo(): PlatformRuntimeInfoType {
    const nav = typeof navigator === 'undefined' ? null : (navigator as NavigatorWithUserAgentData);
    const screen = typeof window === 'undefined' ? null : window.screen;

    return {
      userAgent: nav?.userAgent ?? '',
      hostPlatform: this.hostPlatform(nav),
      language: nav?.language ?? '',
      timezone:
        typeof Intl === 'undefined' ? '' : (Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''),
      screenWidth: screen?.width ?? 0,
      screenHeight: screen?.height ?? 0,
      devicePixelRatio: typeof window === 'undefined' ? 0 : window.devicePixelRatio,
      hardwareConcurrency: nav?.hardwareConcurrency ?? 0,
      maxTouchPoints: nav?.maxTouchPoints ?? 0,
      deviceMemory: nav?.deviceMemory ?? null,
    };
  }

  public async deviceId(): Promise<PlatformDeviceIdType> {
    return await Device.getId();
  }

  public async deviceInfo(): Promise<PlatformDeviceInfoType> {
    return (await Device.getInfo()) as PlatformDeviceInfoType;
  }

  public async batteryInfo(): Promise<PlatformBatteryInfoType> {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      return await Device.getBatteryInfo();
    }

    if (this.isNative) {
      return await Device.getBatteryInfo();
    }

    return {};
  }

  public async languageCode(): Promise<PlatformLanguageCodeType> {
    return await Device.getLanguageCode();
  }

  public async languageTag(): Promise<PlatformLanguageTagType> {
    return await Device.getLanguageTag();
  }

  public async networkStatus(): Promise<PlatformNetworkStatusType> {
    return (await Network.getStatus()) as PlatformNetworkStatusType;
  }

  public async onNetworkStatusChange(
    callback: (status: PlatformNetworkStatusType) => void,
  ): Promise<() => Promise<void>> {
    const listener = await Network.addListener(PLATFORM_NETWORK_EVENT_STATUS_CHANGE, (status) =>
      callback(status as PlatformNetworkStatusType),
    );

    return async () => listener.remove();
  }

  public async currentOrientation(): Promise<PlatformOrientationType> {
    const result = (await ScreenOrientation.orientation()) as PlatformScreenOrientationResultType;
    return result.type;
  }

  public async lockOrientation(orientation: PlatformOrientationLockType): Promise<void> {
    await ScreenOrientation.lock({ orientation: orientation as OrientationLockType });
  }

  public async unlockOrientation(): Promise<void> {
    await ScreenOrientation.unlock();
  }

  public async onOrientationChange(
    callback: (result: PlatformScreenOrientationResultType) => void,
  ): Promise<() => Promise<void>> {
    const listener = await ScreenOrientation.addListener(
      PLATFORM_ORIENTATION_EVENT_CHANGE,
      (result) => callback(result as PlatformScreenOrientationResultType),
    );

    return async () => listener.remove();
  }

  public screenSize(): PlatformScreenSizeType {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }

    return { width: window.innerWidth, height: window.innerHeight };
  }

  public displaySize(): PlatformScreenSizeType {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }

    return { width: window.screen.width, height: window.screen.height };
  }

  public onScreenResize(callback: (size: PlatformScreenSizeType) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const onResize = (): void => callback(this.screenSize());
    window.addEventListener('resize', onResize);
    onResize();

    return () => window.removeEventListener('resize', onResize);
  }

  public async showKeyboard(): Promise<void> {
    await Keyboard.show();
  }

  public async hideKeyboard(): Promise<void> {
    await Keyboard.hide();
  }

  public async setKeyboardAccessoryBarVisible(
    options: PlatformKeyboardAccessoryBarOptionsType,
  ): Promise<void> {
    await Keyboard.setAccessoryBarVisible(options);
  }

  public async setKeyboardScroll(options: PlatformKeyboardScrollOptionsType): Promise<void> {
    await Keyboard.setScroll(options);
  }

  public async setKeyboardStyle(options: PlatformKeyboardStyleOptionsType): Promise<void> {
    await Keyboard.setStyle(options as unknown as KeyboardStyleOptions);
  }

  public async setKeyboardResizeMode(options: PlatformKeyboardResizeOptionsType): Promise<void> {
    await Keyboard.setResizeMode(options as unknown as KeyboardResizeOptions);
  }

  public async getKeyboardResizeMode(): Promise<PlatformKeyboardResizeEnum | null> {
    if (!this.isNative) {
      return null;
    }

    const result = await Keyboard.getResizeMode();
    return result.mode as unknown as PlatformKeyboardResizeEnum;
  }

  public async addKeyboardWillShowListener(
    callback: (info: PlatformKeyboardInfoType) => void,
  ): Promise<PlatformPluginListenerHandleType | null> {
    if (!this.isNative) {
      return null;
    }

    return Keyboard.addListener(PLATFORM_KBD_EVENT_WILL_SHOW, callback);
  }

  public async addKeyboardDidShowListener(
    callback: (info: PlatformKeyboardInfoType) => void,
  ): Promise<PlatformPluginListenerHandleType | null> {
    if (!this.isNative) {
      return null;
    }

    return Keyboard.addListener(PLATFORM_KBD_EVENT_DID_SHOW, callback);
  }

  public async addKeyboardWillHideListener(
    callback: () => void,
  ): Promise<PlatformPluginListenerHandleType | null> {
    if (!this.isNative) {
      return null;
    }

    return Keyboard.addListener(PLATFORM_KBD_EVENT_WILL_HIDE, callback);
  }

  public async addKeyboardDidHideListener(
    callback: () => void,
  ): Promise<PlatformPluginListenerHandleType | null> {
    if (!this.isNative) {
      return null;
    }

    return Keyboard.addListener(PLATFORM_KBD_EVENT_DID_HIDE, callback);
  }

  private hostPlatform(nav: NavigatorWithUserAgentData | null): string {
    if (nav?.userAgentData?.platform) {
      return nav.userAgentData.platform;
    }

    if (nav?.platform) {
      return nav.platform;
    }

    const userAgent = nav?.userAgent ?? '';
    if (/Mac|iPhone|iPad|iPod/i.test(userAgent)) return 'macOS/iOS';
    if (/Win/i.test(userAgent)) return 'Windows';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  }
}
