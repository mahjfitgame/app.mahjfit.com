// file: libs/src/platform/adapter.ts
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

/**
 * Infrastructure boundary for browser, Capacitor, Electron, or another host.
 * Application code should use PlatformService/PlatformState instead of injecting
 * this adapter directly.
 */
export interface PlatformAdapter {
  readonly platform: PlatformType;
  readonly isNative: boolean;

  isPluginAvailable(plugin: PlatformPluginType): boolean;
  runtimeInfo(): PlatformRuntimeInfoType;

  deviceId(): Promise<PlatformDeviceIdType>;
  deviceInfo(): Promise<PlatformDeviceInfoType>;
  batteryInfo(): Promise<PlatformBatteryInfoType>;
  languageCode(): Promise<PlatformLanguageCodeType>;
  languageTag(): Promise<PlatformLanguageTagType>;

  networkStatus(): Promise<PlatformNetworkStatusType>;
  onNetworkStatusChange(
    callback: (status: PlatformNetworkStatusType) => void,
  ): Promise<() => Promise<void>>;

  currentOrientation(): Promise<PlatformOrientationType>;
  lockOrientation(orientation: PlatformOrientationLockType): Promise<void>;
  unlockOrientation(): Promise<void>;
  onOrientationChange(
    callback: (result: PlatformScreenOrientationResultType) => void,
  ): Promise<() => Promise<void>>;

  screenSize(): PlatformScreenSizeType;
  displaySize(): PlatformScreenSizeType;
  onScreenResize(callback: (size: PlatformScreenSizeType) => void): () => void;

  showKeyboard(): Promise<void>;
  hideKeyboard(): Promise<void>;
  setKeyboardAccessoryBarVisible(options: PlatformKeyboardAccessoryBarOptionsType): Promise<void>;
  setKeyboardScroll(options: PlatformKeyboardScrollOptionsType): Promise<void>;
  setKeyboardStyle(options: PlatformKeyboardStyleOptionsType): Promise<void>;
  setKeyboardResizeMode(options: PlatformKeyboardResizeOptionsType): Promise<void>;
  getKeyboardResizeMode(): Promise<PlatformKeyboardResizeEnum | null>;
  addKeyboardWillShowListener(
    callback: (info: PlatformKeyboardInfoType) => void,
  ): Promise<PlatformPluginListenerHandleType | null>;
  addKeyboardDidShowListener(
    callback: (info: PlatformKeyboardInfoType) => void,
  ): Promise<PlatformPluginListenerHandleType | null>;
  addKeyboardWillHideListener(
    callback: () => void,
  ): Promise<PlatformPluginListenerHandleType | null>;
  addKeyboardDidHideListener(
    callback: () => void,
  ): Promise<PlatformPluginListenerHandleType | null>;
}