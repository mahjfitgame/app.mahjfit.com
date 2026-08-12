// file: libs/src/signal-state/cookie.ts
import { Service, inject } from '@angular/core';
import { CookieService } from '../cookie/service';
import { SignalStateUtility } from './utility';
import {
  SignalStateCookieSourceType,
  SignalStateCookieValueType,
  SignalStateScopeType,
} from './type';

@Service()
export class SignalStateCookie {
  /**
   * Keeps the cookie dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly cookie = inject(CookieService);
  /**
   * Keeps the utility dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly utility = inject(SignalStateUtility);

  /**
   * Handles the buildStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string {
    return this.utility.buildStorageKey(store, field, scope);
  }

  /**
   * Saves a serializable value under the normalized cookie key.
   * The value is encrypted inside a versioned envelope before it reaches cookies.
   */
  public async save<T>(
    key: string,
    state: T,
    version = 1,
    options?: SignalStateCookieSourceType,
    plainValue = false,
  ): Promise<void> {
    const normalizedKey = this.utility.normalizeStorageKey(key);

    // cookies hold text only, a plain string is written as is and anything else as JSON
    const record = this.utility.buildRecord(state, version, plainValue);

    await this.cookie.set({
      key: normalizedKey,
      value: typeof record === 'string' ? record : JSON.stringify(record),
      url: options?.url,
      path: options?.path,
      expires: options?.expires,
    });
  }

  /**
   * Loads and decrypts a cookie value only when the key and version are valid.
   * Invalid, missing, or unreadable data returns null so callers can use defaults safely.
   */
  public async load<T>(
    key: string,
    expectedVersion = 1,
    options?: SignalStateCookieSourceType,
  ): Promise<SignalStateCookieValueType<T> | null> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return null;
    }

    try {
      const stored = await this.cookie.get(normalizedKey, { url: options?.url });

      if (!stored) {
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
  public async remove(key: string, options?: SignalStateCookieSourceType): Promise<void> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (normalizedKey) {
      await this.cookie.delete(normalizedKey, {
        url: options?.url,
        path: options?.path,
      });
    }
  }
}
