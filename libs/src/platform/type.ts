// do not add any state related type or interface in this file
// instead we have a separate file [libs/src/app-platform/state.type.ts]
import { PlatformKeyboardResizeEnum, PlatformKeyboardStyleEnum } from './enum';
import {
  PLATFORM_DEVICE_OS_ANDROID,
  PLATFORM_DEVICE_OS_IOS,
  PLATFORM_DEVICE_OS_MAC,
  PLATFORM_DEVICE_OS_LINUX,
  PLATFORM_DEVICE_OS_UNKNOWN,
  PLATFORM_DEVICE_OS_WINDOWS,
  PLATFORM_NETWORK_CONNECTION_CELLULAR,
  PLATFORM_NETWORK_CONNECTION_NONE,
  PLATFORM_NETWORK_CONNECTION_UNKNOWN,
  PLATFORM_NETWORK_CONNECTION_WIFI,
  PLATFORM_ORIENTATION_ANY,
  PLATFORM_ORIENTATION_LANDSCAPE,
  PLATFORM_ORIENTATION_LANDSCAPE_PRIMARY,
  PLATFORM_ORIENTATION_LANDSCAPE_SECONDARY,
  PLATFORM_ORIENTATION_NATURAL,
  PLATFORM_ORIENTATION_PORTRAIT,
  PLATFORM_ORIENTATION_PORTRAIT_PRIMARY,
  PLATFORM_ORIENTATION_PORTRAIT_SECONDARY,
  PLATFORM_NAME_ANDROID,
  PLATFORM_NAME_IOS,
  PLATFORM_NAME_WEB,
  PLATFORM_PLUGIN_ACTION_SHEET,
  PLATFORM_PLUGIN_APP,
  PLATFORM_PLUGIN_APP_LAUNCHER,
  PLATFORM_PLUGIN_BACKGROUND_RUNNER,
  PLATFORM_PLUGIN_BARCODE_SCANNER,
  PLATFORM_PLUGIN_BROWSER,
  PLATFORM_PLUGIN_CAMERA,
  PLATFORM_PLUGIN_CLIPBOARD,
  PLATFORM_PLUGIN_COOKIES,
  PLATFORM_PLUGIN_DEVICE,
  PLATFORM_PLUGIN_DIALOG,
  PLATFORM_PLUGIN_FILE_TRANSFER,
  PLATFORM_PLUGIN_FILE_VIEWER,
  PLATFORM_PLUGIN_FILESYSTEM,
  PLATFORM_PLUGIN_GEOLOCATION,
  PLATFORM_PLUGIN_GOOGLE_MAPS,
  PLATFORM_PLUGIN_HAPTICS,
  PLATFORM_PLUGIN_HTTP,
  PLATFORM_PLUGIN_IN_APP_BROWSER,
  PLATFORM_PLUGIN_KEYBOARD,
  PLATFORM_PLUGIN_LOCAL_NOTIFICATIONS,
  PLATFORM_PLUGIN_MOTION,
  PLATFORM_PLUGIN_NETWORK,
  PLATFORM_PLUGIN_PREFERENCES,
  PLATFORM_PLUGIN_PRIVACY_SCREEN,
  PLATFORM_PLUGIN_PUSH_NOTIFICATIONS,
  PLATFORM_PLUGIN_SCREEN_ORIENTATION,
  PLATFORM_PLUGIN_SCREEN_READER,
  PLATFORM_PLUGIN_SHARE,
  PLATFORM_PLUGIN_SPLASH_SCREEN,
  PLATFORM_PLUGIN_STATUS_BAR,
  PLATFORM_PLUGIN_SYSTEM_BARS,
  PLATFORM_PLUGIN_TEXT_ZOOM,
  PLATFORM_PLUGIN_TOAST,
  PLATFORM_PLUGIN_WATCH,
  PLATFORM_PLUGIN_COMMUNITY_ADMOB,
  PLATFORM_KBD_EVENT_WILL_SHOW,
  PLATFORM_KBD_EVENT_DID_SHOW,
  PLATFORM_KBD_EVENT_WILL_HIDE,
  PLATFORM_KBD_EVENT_DID_HIDE,
} from './const';

// ███ CORE ████████████████████████████████████████████████████
export type PlatformType =
  | typeof PLATFORM_NAME_WEB
  | typeof PLATFORM_NAME_IOS
  | typeof PLATFORM_NAME_ANDROID;

export interface PlatformDeviceIdType {
  identifier: string;
}

export interface PlatformRuntimeInfoType {
  userAgent: string;
  hostPlatform: string;
  language: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  deviceMemory: number | null;
}

export interface PlatformHandshakeInfoType {
  from_ip_address: string;
  mac_address?: string;
  user_defined_id: string;
  user_defined_name: string;
  dtoken: string | null;
  dpid: string;
  avatar: string;
  useragent: string;
  platform: string;
  language: string;
  timezone: string;
  screen_width: string;
  screen_height: string;
  device_pixel_ratio: string;
  hardware_concurrency: string;
  max_touch_points: string;
  device_memory: string;
}

export interface PlatformDeviceInfoType {
  name?: string;
  model: string;
  platform: PlatformType;
  operatingSystem: PlatformDeviceOperatingSystemType;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion: string;
}

export interface PlatformBatteryInfoType {
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface PlatformLanguageCodeType {
  value: string;
}

export interface PlatformLanguageTagType {
  value: string;
}

// ███ DEVICE ██████████████████████████████████████████████████
export type PlatformDeviceOperatingSystemType =
  | typeof PLATFORM_DEVICE_OS_IOS
  | typeof PLATFORM_DEVICE_OS_ANDROID
  | typeof PLATFORM_DEVICE_OS_WINDOWS
  | typeof PLATFORM_DEVICE_OS_MAC
  | typeof PLATFORM_DEVICE_OS_LINUX
  | typeof PLATFORM_DEVICE_OS_UNKNOWN;

// ███ NETWORK █████████████████████████████████████████████████
export type PlatformNetworkConnectionType =
  | typeof PLATFORM_NETWORK_CONNECTION_WIFI
  | typeof PLATFORM_NETWORK_CONNECTION_CELLULAR
  | typeof PLATFORM_NETWORK_CONNECTION_NONE
  | typeof PLATFORM_NETWORK_CONNECTION_UNKNOWN;

export interface PlatformNetworkStatusType {
  connected: boolean;
  connectionType: PlatformNetworkConnectionType;
}

// ███ SCREEN ORIENTATION ██████████████████████████████████████
export type PlatformOrientationLockType =
  | typeof PLATFORM_ORIENTATION_ANY
  | typeof PLATFORM_ORIENTATION_NATURAL
  | typeof PLATFORM_ORIENTATION_LANDSCAPE
  | typeof PLATFORM_ORIENTATION_PORTRAIT
  | typeof PLATFORM_ORIENTATION_PORTRAIT_PRIMARY
  | typeof PLATFORM_ORIENTATION_PORTRAIT_SECONDARY
  | typeof PLATFORM_ORIENTATION_LANDSCAPE_PRIMARY
  | typeof PLATFORM_ORIENTATION_LANDSCAPE_SECONDARY;

export type PlatformOrientationType = PlatformOrientationLockType;

export interface PlatformScreenOrientationResultType {
  type: PlatformOrientationType;
}

export interface PlatformScreenSizeType {
  width: number;
  height: number;
}

// ███ KEY BOARD ███████████████████████████████████████████████

export interface PlatformKeyboardInfoType {
  keyboardHeight: number;
}

export type PlatformKeyboardPhase =
  | typeof PLATFORM_KBD_EVENT_WILL_SHOW
  | typeof PLATFORM_KBD_EVENT_DID_SHOW
  | typeof PLATFORM_KBD_EVENT_WILL_HIDE
  | typeof PLATFORM_KBD_EVENT_DID_HIDE;

export interface PlatformKeyboardStyleOptionsType {
  style: PlatformKeyboardStyleEnum;
}

export interface PlatformKeyboardResizeOptionsType {
  mode: PlatformKeyboardResizeEnum;
}

export interface PlatformKeyboardAccessoryBarOptionsType {
  isVisible: boolean;
}

export interface PlatformKeyboardScrollOptionsType {
  isDisabled: boolean;
}

export interface PlatformPluginListenerHandleType {
  remove: () => Promise<void>;
}

// ███ PLUGINS - KEEP IT AT THE END ████████████████████████████████████████████████████
export type PlatformPluginType =
  | typeof PLATFORM_PLUGIN_ACTION_SHEET
  | typeof PLATFORM_PLUGIN_APP_LAUNCHER
  | typeof PLATFORM_PLUGIN_APP
  | typeof PLATFORM_PLUGIN_BACKGROUND_RUNNER
  | typeof PLATFORM_PLUGIN_BARCODE_SCANNER
  | typeof PLATFORM_PLUGIN_BROWSER
  | typeof PLATFORM_PLUGIN_CAMERA
  | typeof PLATFORM_PLUGIN_CLIPBOARD
  | typeof PLATFORM_PLUGIN_COOKIES
  | typeof PLATFORM_PLUGIN_DEVICE
  | typeof PLATFORM_PLUGIN_DIALOG
  | typeof PLATFORM_PLUGIN_FILE_TRANSFER
  | typeof PLATFORM_PLUGIN_FILE_VIEWER
  | typeof PLATFORM_PLUGIN_FILESYSTEM
  | typeof PLATFORM_PLUGIN_GEOLOCATION
  | typeof PLATFORM_PLUGIN_GOOGLE_MAPS
  | typeof PLATFORM_PLUGIN_HAPTICS
  | typeof PLATFORM_PLUGIN_HTTP
  | typeof PLATFORM_PLUGIN_IN_APP_BROWSER
  | typeof PLATFORM_PLUGIN_KEYBOARD
  | typeof PLATFORM_PLUGIN_LOCAL_NOTIFICATIONS
  | typeof PLATFORM_PLUGIN_MOTION
  | typeof PLATFORM_PLUGIN_NETWORK
  | typeof PLATFORM_PLUGIN_PREFERENCES
  | typeof PLATFORM_PLUGIN_PRIVACY_SCREEN
  | typeof PLATFORM_PLUGIN_PUSH_NOTIFICATIONS
  | typeof PLATFORM_PLUGIN_SCREEN_ORIENTATION
  | typeof PLATFORM_PLUGIN_SCREEN_READER
  | typeof PLATFORM_PLUGIN_SHARE
  | typeof PLATFORM_PLUGIN_SPLASH_SCREEN
  | typeof PLATFORM_PLUGIN_STATUS_BAR
  | typeof PLATFORM_PLUGIN_SYSTEM_BARS
  | typeof PLATFORM_PLUGIN_TEXT_ZOOM
  | typeof PLATFORM_PLUGIN_TOAST
  | typeof PLATFORM_PLUGIN_WATCH
  | typeof PLATFORM_PLUGIN_COMMUNITY_ADMOB;
