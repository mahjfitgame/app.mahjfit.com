// file: ./libs/src/platform/const.ts
export const PLATFORM_STATE_VERSION: number = 1;

export const PLATFORM_NAME_WEB = 'web' as const;
export const PLATFORM_NAME_IOS = 'ios' as const;
export const PLATFORM_NAME_ANDROID = 'android' as const;

export const PLATFORM_NETWORK_CONNECTION_WIFI = 'wifi' as const;
export const PLATFORM_NETWORK_CONNECTION_CELLULAR = 'cellular' as const;
export const PLATFORM_NETWORK_CONNECTION_NONE = 'none' as const;
export const PLATFORM_NETWORK_CONNECTION_UNKNOWN = 'unknown' as const;
export const PLATFORM_NETWORK_EVENT_STATUS_CHANGE = 'networkStatusChange' as const;

export const PLATFORM_ORIENTATION_ANY = 'any' as const;
export const PLATFORM_ORIENTATION_NATURAL = 'natural' as const;
export const PLATFORM_ORIENTATION_LANDSCAPE = 'landscape' as const;
export const PLATFORM_ORIENTATION_PORTRAIT = 'portrait' as const;
export const PLATFORM_ORIENTATION_PORTRAIT_PRIMARY = 'portrait-primary' as const;
export const PLATFORM_ORIENTATION_PORTRAIT_SECONDARY = 'portrait-secondary' as const;
export const PLATFORM_ORIENTATION_LANDSCAPE_PRIMARY = 'landscape-primary' as const;
export const PLATFORM_ORIENTATION_LANDSCAPE_SECONDARY = 'landscape-secondary' as const;
export const PLATFORM_ORIENTATION_EVENT_CHANGE = 'screenOrientationChange' as const;

export const PLATFORM_DEVICE_OS_IOS = 'ios' as const;
export const PLATFORM_DEVICE_OS_ANDROID = 'android' as const;
export const PLATFORM_DEVICE_OS_WINDOWS = 'windows' as const;
export const PLATFORM_DEVICE_OS_MAC = 'mac' as const;
export const PLATFORM_DEVICE_OS_LINUX = 'linux' as const;
export const PLATFORM_DEVICE_OS_UNKNOWN = 'unknown' as const;

export const PLATFORM_KBD_EVENT_WILL_SHOW = 'keyboardWillShow' as const;
export const PLATFORM_KBD_EVENT_DID_SHOW = 'keyboardDidShow' as const;
export const PLATFORM_KBD_EVENT_WILL_HIDE = 'keyboardWillHide' as const;
export const PLATFORM_KBD_EVENT_DID_HIDE = 'keyboardDidHide' as const;

// ███ PLUGINS - KEEP IT AT TEH END ████████████████████████████████████████████████████

export const PLATFORM_PLUGIN_ACTION_SHEET = 'ActionSheet' as const;
export const PLATFORM_PLUGIN_APP_LAUNCHER = 'AppLauncher' as const;
export const PLATFORM_PLUGIN_APP = 'App' as const;
export const PLATFORM_PLUGIN_BACKGROUND_RUNNER = 'BackgroundRunner' as const;
export const PLATFORM_PLUGIN_BARCODE_SCANNER = 'BarcodeScanner' as const;
export const PLATFORM_PLUGIN_BROWSER = 'Browser' as const;
export const PLATFORM_PLUGIN_CAMERA = 'Camera' as const;
export const PLATFORM_PLUGIN_CLIPBOARD = 'Clipboard' as const;
export const PLATFORM_PLUGIN_COOKIES = 'Cookies' as const;
export const PLATFORM_PLUGIN_DEVICE = 'Device' as const;
export const PLATFORM_PLUGIN_DIALOG = 'Dialog' as const;
export const PLATFORM_PLUGIN_FILE_TRANSFER = 'FileTransfer' as const;
export const PLATFORM_PLUGIN_FILE_VIEWER = 'FileViewer' as const;
export const PLATFORM_PLUGIN_FILESYSTEM = 'Filesystem' as const;
export const PLATFORM_PLUGIN_GEOLOCATION = 'Geolocation' as const;
export const PLATFORM_PLUGIN_GOOGLE_MAPS = 'GoogleMaps' as const;
export const PLATFORM_PLUGIN_HAPTICS = 'Haptics' as const;
export const PLATFORM_PLUGIN_HTTP = 'CapacitorHttp' as const;
export const PLATFORM_PLUGIN_IN_APP_BROWSER = 'InAppBrowser' as const;
export const PLATFORM_PLUGIN_KEYBOARD = 'Keyboard' as const;
export const PLATFORM_PLUGIN_LOCAL_NOTIFICATIONS = 'LocalNotifications' as const;
export const PLATFORM_PLUGIN_MOTION = 'Motion' as const;
export const PLATFORM_PLUGIN_NETWORK = 'Network' as const;
export const PLATFORM_PLUGIN_PREFERENCES = 'Preferences' as const;
export const PLATFORM_PLUGIN_PRIVACY_SCREEN = 'PrivacyScreen' as const;
export const PLATFORM_PLUGIN_PUSH_NOTIFICATIONS = 'PushNotifications' as const;
export const PLATFORM_PLUGIN_SCREEN_ORIENTATION = 'ScreenOrientation' as const;
export const PLATFORM_PLUGIN_SCREEN_READER = 'ScreenReader' as const;
export const PLATFORM_PLUGIN_SHARE = 'Share' as const;
export const PLATFORM_PLUGIN_SPLASH_SCREEN = 'SplashScreen' as const;
export const PLATFORM_PLUGIN_STATUS_BAR = 'StatusBar' as const;
export const PLATFORM_PLUGIN_SYSTEM_BARS = 'SystemBars' as const;
export const PLATFORM_PLUGIN_TEXT_ZOOM = 'TextZoom' as const;
export const PLATFORM_PLUGIN_TOAST = 'Toast' as const;
export const PLATFORM_PLUGIN_WATCH = 'Watch' as const;

export const PLATFORM_PLUGIN_COMMUNITY_ADMOB = 'AdMob' as const;
