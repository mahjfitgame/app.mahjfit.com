// file: libs/src/notification/enum.ts
export enum NotificationProviderEnum {
  FIREBASE = 'FIREBASE',
  ONESIGNAL = 'ONESIGNAL',
  NOOP = 'NOOP',
}

export enum NotificationPlatformEnum {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
  UNKNOWN = 'UNKNOWN',
}

export enum NotificationEnvironmentEnum {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

export enum NotificationTypeEnum {
  MARKETING_CAMPAIGN = 'MARKETING_CAMPAIGN',

  GAME_INVITE = 'GAME_INVITE',
  GAME_PLAY_REMINDER = 'GAME_PLAY_REMINDER',
  GAME_PLAYER_LEFT = 'GAME_PLAYER_LEFT',
  GAME_TURN_TIMEOUT_WARNING = 'GAME_TURN_TIMEOUT_WARNING',

  SYSTEM_ALERT = 'SYSTEM_ALERT',
}