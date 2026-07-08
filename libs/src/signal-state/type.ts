// file: libs/src/signal-state/type.ts
import { WritableSignal } from '@angular/core';
import { CookieUrlOptionsType, SetCookieOptionsType } from '../cookie/type';

/**
 * Supported persistence backends for a registered signal.
 * The value decides which adapter will load, save, clear, and snapshot the field.
 */
export type SignalStateStorageType = 'local' | 'session' | 'localDb' | 'server' | 'cookie';

/**
 * Convenience alias for registrations when the value type is not important.
 * The service uses this for mixed collections containing different signal types.
 */
export type PersistRegistration = PersistSignalRegistrationType<any>;

/**
 * Identifies a scope such as a user, tenant, workspace, or project.
 * Scoped fields include both parts in their storage key.
 */
export interface SignalStateScopeType {
  type: string;
  id: string;
}

/** v = version, u = updated ISO date, s = encrypted state. */
export interface SignalStateStorageEnvelopeType {
  v: number;
  u: string;
  s: string;
}

/** v = version, u = updated ISO date, s = decrypted state. */
export interface SignalStateStorageValueType<T> {
  v: number;
  u: string;
  s: T;
}

/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateLocalStorageEnvelopeType = SignalStateStorageEnvelopeType;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateLocalStorageValueType<T> = SignalStateStorageValueType<T>;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateSessionStorageEnvelopeType = SignalStateStorageEnvelopeType;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateSessionStorageValueType<T> = SignalStateStorageValueType<T>;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateLocalDbEnvelopeType = SignalStateStorageEnvelopeType;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateLocalDbValueType<T> = SignalStateStorageValueType<T>;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateServerSyncEnvelopeType = SignalStateStorageEnvelopeType;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateServerSyncValueType<T> = SignalStateStorageValueType<T>;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateCookieEnvelopeType = SignalStateStorageEnvelopeType;
/**
 * Backend-specific alias that keeps public APIs readable.
 * It maps to the shared signal-state envelope or value shape.
 */
export type SignalStateCookieValueType<T> = SignalStateStorageValueType<T>;

/**
 * Cookie attributes accepted for client-side signal-state persistence.
 * Full cookie control, especially HttpOnly, must still come from Set-Cookie headers.
 * path and expires are used while saving; url is used while saving, loading, and deleting.
 */
export interface SignalStateCookieOptionsType extends CookieUrlOptionsType {
  path?: SetCookieOptionsType['path'];
  expires?: SetCookieOptionsType['expires'];
}

/**
 * Minimal repository contract required by local database persistence.
 * Custom sources can implement this shape to replace the default AppStateRepository.
 */
export interface SignalStateLocalDbSourceType {
  getValue: <T>(key: string) => Promise<T | null>;
  setValue: <T>(key: string, value: T) => Promise<void>;
  deleteKey?: (key: string) => Promise<void>;
}

/**
 * Minimal API contract required by server-backed synchronization.
 * Custom sources provide the read, write, and optional delete operations.
 */
export interface SignalStateServerSyncSourceType {
  getValue: <T>(key: string) => Promise<T | null>;
  setValue: <T>(key: string, value: T) => Promise<void>;
  deleteKey?: (key: string) => Promise<void>;
}

/**
 * Common options accepted by every persisted signal helper.
 * They control versioning, debounce timing, scoping, validation, and value conversion.
 */
export interface PersistSignalOptionsBaseType<T> {
  /** Default: 1. */
  version?: number;

  /** Default: 200 milliseconds. */
  debounceMs?: number;

  /** Optional scope type. Without a scope, the field is stored globally. */
  scope?: string;

  /** Required runtime validation after storage is decrypted. */
  validate: (value: unknown) => value is T;

  /** Optional conversion before encryption. */
  serialize?: (value: T) => unknown;

  /** Optional conversion after decryption. */
  deserialize?: (value: unknown) => T;
}

/**
 * Optional cross-tab synchronization switch shared by persistent backends.
 * When enabled, matching fields reload after another tab publishes the same key.
 */
export interface PersistCrossTabSync<T> {
  /** Default: false. */
  crossTab?: boolean;
}

/**
 * Options for a signal persisted in encrypted local storage.
 * Use this for durable browser preferences that can survive restarts.
 */
export interface LocalStoragePersistSignalOptionsType<T>
  extends PersistSignalOptionsBaseType<T>, PersistCrossTabSync<T> {}

/**
 * Options for a signal persisted in encrypted session storage.
 * Use this for tab/session-lifetime state such as drafts or wizard progress.
 */
export interface SessionStoragePersistSignalOptionsType<T>
  extends PersistSignalOptionsBaseType<T>, PersistCrossTabSync<T> {}

/**
 * Options for a signal persisted through the local database adapter.
 * Use this for larger or repository-backed app state.
 */
export interface LocalDbPersistSignalOptionsType<T>
  extends PersistSignalOptionsBaseType<T>, PersistCrossTabSync<T> {
  /**
   * Optional persistence source override. Defaults to AppStateRepository.
   * Provide this when a signal field should load/save through a different
   * repository, API, or custom data source.
   */
  source?: SignalStateLocalDbSourceType;
}

/**
 * Options for a signal synchronized through a server source.
 * Use this when the authoritative value is owned by an API.
 */
export interface ServerSyncSignalOptionsType<T>
  extends PersistSignalOptionsBaseType<T>, PersistCrossTabSync<T> {
  /**
   * API source for server-backed state. If omitted, the API sync source is a
   * no-op placeholder until callers provide getValue(), setValue(), and deleteKey().
   */
  source?: SignalStateServerSyncSourceType;
}

/**
 * Options for a signal persisted in an encrypted browser cookie.
 * Use this only for small state that must be visible through the cookie layer.
 */
export interface CookiePersistSignalOptionsType<T>
  extends PersistSignalOptionsBaseType<T>, PersistCrossTabSync<T> {
  /**
   * Optional cookie write/read options. The underlying CookieService controls
   * platform-specific URL normalization. path and expires are write-only.
   */
  cookie?: SignalStateCookieOptionsType;
}

/**
 * Internal options shape after defaults have been applied.
 * Registrations store this so later code can avoid repeatedly checking undefined values.
 */
export interface NormalizedPersistSignalOptionsType<T> {
  version: number;
  debounceMs: number;
  crossTab: boolean;
  scope?: string;
  validate: (value: unknown) => value is T;
  serialize?: (value: T) => unknown;
  deserialize?: (value: unknown) => T;
  source?: SignalStateLocalDbSourceType | SignalStateServerSyncSourceType;
  cookie?: SignalStateCookieOptionsType;
}

export type NormalizedLocalStoragePersistSignalOptionsType<T> =
  NormalizedPersistSignalOptionsType<T>;
export type NormalizedSessionStoragePersistSignalOptionsType<T> =
  NormalizedPersistSignalOptionsType<T>;
export type NormalizedLocalDbPersistSignalOptionsType<T> = NormalizedPersistSignalOptionsType<T>;
export type NormalizedServerSyncSignalOptionsType<T> = NormalizedPersistSignalOptionsType<T>;
export type NormalizedCookiePersistSignalOptionsType<T> = NormalizedPersistSignalOptionsType<T>;

/**
 * Internal record that connects one WritableSignal to its persistence settings.
 * The service updates this object while loading, saving, and clearing state.
 */
export interface PersistSignalRegistrationType<T = unknown> {
  storage: SignalStateStorageType;
  field: string;
  initialValue: T;
  state: WritableSignal<T>;
  options: NormalizedPersistSignalOptionsType<T>;
  ready: boolean;
  loadSequence: number;
  lastSavedSnapshot: string;
}

export type LocalStoragePersistSignalRegistrationType<T = unknown> =
  PersistSignalRegistrationType<T>;
export type SessionStoragePersistSignalRegistrationType<T = unknown> =
  PersistSignalRegistrationType<T>;
export type LocalDbPersistSignalRegistrationType<T = unknown> = PersistSignalRegistrationType<T>;
export type ServerSyncSignalRegistrationType<T = unknown> = PersistSignalRegistrationType<T>;
export type CookiePersistSignalRegistrationType<T = unknown> = PersistSignalRegistrationType<T>;
