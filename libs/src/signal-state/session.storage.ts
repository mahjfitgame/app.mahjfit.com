// file: libs/src/signal-state/session-storage.ts
import { inject, Service } from '@angular/core';
import { BrowserSessionStorageService } from '../browser-session-storage/service';
import { SignalStateUtility } from './utility';
import {
  SignalStateScopeType,
  SignalStateSessionStorageEnvelopeType,
  SignalStateSessionStorageValueType,
} from './type';

@Service()
export class SignalStateSessionStorage {
  /**
   * Keeps the browserSessionStorage dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly browserSessionStorage = inject(BrowserSessionStorageService);
  /**
   * Keeps the utility dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly utility = inject(SignalStateUtility);

  /**
   * Creates the service instance through Angular dependency injection.
   * All injected collaborators are resolved from field initializers.
   */
  public constructor() {}

  /**
   * Handles the buildStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string {
    return this.utility.buildStorageKey(store, field, scope);
  }

  /**
   * Handles the save<T> operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async save<T>(key: string, state: T, version = 1, plainValue = false): Promise<void> {
    const normalizedKey = this.utility.normalizeStorageKey(key);

    await this.browserSessionStorage.set(
      normalizedKey,
      this.utility.buildRecord(state, version, plainValue),
    );
  }

  /**
   * Loads and decrypts a value only when the key and version are valid.
   * Invalid, missing, or unreadable data returns null so callers can use defaults safely.
   */
  public async load<T>(
    key: string,
    expectedVersion = 1,
  ): Promise<SignalStateSessionStorageValueType<T> | null> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return null;
    }

    try {
      const stored = await this.browserSessionStorage.get<
        SignalStateSessionStorageEnvelopeType | string
      >(normalizedKey);

      // a plain record can be false, 0, or an empty string, only a missing record is null
      if (stored === null || stored === undefined) {
        return null;
      }

      return this.utility.readRecord<T>(stored, expectedVersion);
    } catch {
      return null;
    }
  }

  /**
   * Handles the remove operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async remove(key: string): Promise<void> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (normalizedKey) {
      await this.browserSessionStorage.remove(normalizedKey);
    }
  }
}
