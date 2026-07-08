import { inject, Service } from '@angular/core';

import { SignatureService } from '../signature/service';
import { PLATFORM_ADAPTER, type PlatformAdapter } from './adapter';
import {
  PLATFORM_NAME_ANDROID,
  PLATFORM_NAME_IOS,
  PLATFORM_NAME_WEB,
} from './const';
import { PlatformKeyboardResizeEnum } from './enum';
import { PlatformState } from './state';
import type {
  PlatformBatteryInfoType,
  PlatformDeviceInfoType,
  PlatformDeviceOperatingSystemType,
  PlatformHandshakeInfoType,
  PlatformKeyboardAccessoryBarOptionsType,
  PlatformKeyboardResizeOptionsType,
  PlatformKeyboardScrollOptionsType,
  PlatformKeyboardStyleOptionsType,
  PlatformLanguageCodeType,
  PlatformLanguageTagType,
  PlatformNetworkStatusType,
  PlatformOrientationLockType,
  PlatformOrientationType,
  PlatformPluginType,
  PlatformType,
} from './type';

/**
 * Stable application-facing façade for platform state, commands, and queries.
 * Host-specific behavior is delegated through PLATFORM_ADAPTER.
 */
@Service()
export class PlatformService {
  private readonly avatarKey = 'User-Avatar-1.0';
  private readonly adapter: PlatformAdapter = inject(PLATFORM_ADAPTER);
  private readonly sign = inject(SignatureService);

  public readonly state = inject(PlatformState);

  public async init(): Promise<void> {
    await this.state.init();
  }

  // ███ CORE ████████████████████████████████████████████████████

  public get onPlatform(): PlatformType {
    return this.adapter.platform;
  }

  public get isNative(): boolean {
    return this.adapter.isNative;
  }

  public get isWeb(): boolean {
    return this.onPlatform === PLATFORM_NAME_WEB;
  }

  public get isIos(): boolean {
    return this.onPlatform === PLATFORM_NAME_IOS;
  }

  public get isAndroid(): boolean {
    return this.onPlatform === PLATFORM_NAME_ANDROID;
  }

  public isPluginAvailable(plugin: PlatformPluginType): boolean {
    return this.adapter.isPluginAvailable(plugin);
  }

  // ███ DEVICE ██████████████████████████████████████████████████

  public async handShakeInfo(): Promise<PlatformHandshakeInfoType> {
    const runtime = this.adapter.runtimeInfo();

    return {
      from_ip_address: '0.0.0.0',
      mac_address: undefined,
      user_defined_id: '',
      user_defined_name: '',
      dtoken: await this.deviceToken(),
      dpid: await this.deviceProviderId(),
      avatar: this.sign.avtar(this.avatarKey),
      useragent: runtime.userAgent,
      platform: runtime.hostPlatform,
      language: runtime.language,
      timezone: runtime.timezone,
      screen_width: String(runtime.screenWidth),
      screen_height: String(runtime.screenHeight),
      device_pixel_ratio: String(runtime.devicePixelRatio),
      hardware_concurrency: String(runtime.hardwareConcurrency),
      max_touch_points: String(runtime.maxTouchPoints),
      device_memory: String(runtime.deviceMemory ?? 'unknown'),
    };
  }

  public async deviceToken(): Promise<string | null> {
    return this.state.dtoken();
  }

  public async deviceProviderId(): Promise<string> {
    return (await this.adapter.deviceId()).identifier;
  }

  public async deviceId(): Promise<string> {
    return '0';
  }

  public async deviceInfo(): Promise<PlatformDeviceInfoType> {
    return this.adapter.deviceInfo();
  }

  public async deviceName(): Promise<string> {
    return (await this.deviceInfo()).name ?? '';
  }

  public async deviceModel(): Promise<string> {
    return (await this.deviceInfo()).model;
  }

  public async deviceOperatingSystem(): Promise<PlatformDeviceOperatingSystemType> {
    return (await this.deviceInfo()).operatingSystem;
  }

  public async deviceOsVersion(): Promise<string> {
    return (await this.deviceInfo()).osVersion;
  }

  public async deviceManufacturer(): Promise<string> {
    return (await this.deviceInfo()).manufacturer;
  }

  public async deviceIsVirtual(): Promise<boolean> {
    return (await this.deviceInfo()).isVirtual;
  }

  public async deviceWebViewVersion(): Promise<string> {
    return (await this.deviceInfo()).webViewVersion;
  }

  public async batteryInfo(): Promise<PlatformBatteryInfoType> {
    return this.adapter.batteryInfo();
  }

  public async languageCode(): Promise<string> {
    const result: PlatformLanguageCodeType = await this.adapter.languageCode();
    return result.value;
  }

  public async languageTag(): Promise<string> {
    const result: PlatformLanguageTagType = await this.adapter.languageTag();
    return result.value;
  }

  // ███ NETWORK █████████████████████████████████████████████████

  public async networkStatus(): Promise<PlatformNetworkStatusType> {
    return this.adapter.networkStatus();
  }

  public async isOnline(): Promise<boolean> {
    return (await this.networkStatus()).connected;
  }

  // ███ SCREEN ORIENTATION ██████████████████████████████████████

  public async currentOrientation(): Promise<PlatformOrientationType> {
    return this.adapter.currentOrientation();
  }

  public async lockOrientation(orientation: PlatformOrientationLockType): Promise<void> {
    await this.adapter.lockOrientation(orientation);
  }

  public async unlockOrientation(): Promise<void> {
    await this.adapter.unlockOrientation();
  }

  public get windowWidth(): number {
    return this.adapter.displaySize().width;
  }

  public get windowHeight(): number {
    return this.adapter.displaySize().height;
  }

  public get screenWidth(): number {
    return this.adapter.screenSize().width;
  }

  public get screenHeight(): number {
    return this.adapter.screenSize().height;
  }

  // ███ KEYBOARD ████████████████████████████████████████████████

  public async showKeyboard(): Promise<void> {
    await this.adapter.showKeyboard();
  }

  public async hideKeyboard(): Promise<void> {
    await this.adapter.hideKeyboard();
  }

  public async setKeyboardAccessoryBarVisible(
    options: PlatformKeyboardAccessoryBarOptionsType,
  ): Promise<void> {
    await this.adapter.setKeyboardAccessoryBarVisible(options);
  }

  public async setKeyboardScroll(options: PlatformKeyboardScrollOptionsType): Promise<void> {
    await this.adapter.setKeyboardScroll(options);
  }

  public async setKeyboardStyle(options: PlatformKeyboardStyleOptionsType): Promise<void> {
    await this.adapter.setKeyboardStyle(options);
  }

  public async setKeyboardResizeMode(options: PlatformKeyboardResizeOptionsType): Promise<void> {
    await this.adapter.setKeyboardResizeMode(options);
  }

  public async getKeyboardResizeMode(): Promise<PlatformKeyboardResizeEnum | null> {
    return this.adapter.getKeyboardResizeMode();
  }
}
