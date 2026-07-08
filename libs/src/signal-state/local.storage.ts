// file: libs/src/signal-state/local-storage.ts
import { Service, inject } from '@angular/core';
import { PreferencesLocalStorageService } from '../preferences-local-storage/service';
import { SignatureService } from '../signature/service';
import { SignalStateUtility } from './utility';
import {
  SignalStateScopeType,
  SignalStateLocalStorageEnvelopeType,
  SignalStateLocalStorageValueType,
} from './type';

@Service()
export class SignalStateLocalStorage {
  /**
   * Keeps the localStorage dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly localStorage = inject(PreferencesLocalStorageService);
  /**
   * Keeps the signature dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly signature = inject(SignatureService);
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
   * Handles the save<T> operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async save<T>(key: string, state: T, version = 1): Promise<void> {
    const normalizedKey = this.utility.normalizeStorageKey(key);

    this.utility.assertSerializable(state);

    const envelope: SignalStateLocalStorageEnvelopeType = {
      v: version,
      u: new Date().toISOString(),
      s: this.signature.encryptJson(state),
    };

    await this.localStorage.set(normalizedKey, envelope);
  }

  /**
   * Loads and decrypts a value only when the key and version are valid.
   * Invalid, missing, or unreadable data returns null so callers can use defaults safely.
   */
  public async load<T>(
    key: string,
    expectedVersion = 1,
  ): Promise<SignalStateLocalStorageValueType<T> | null> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return null;
    }

    try {
      const stored = await this.localStorage.get<SignalStateLocalStorageEnvelopeType | string>(
        normalizedKey,
      );

      if (!stored) {
        return null;
      }

      const envelope = this.utility.parseEnvelope<SignalStateLocalStorageEnvelopeType>(stored);
      if (!this.utility.isStorageEnvelope(envelope) || envelope.v !== expectedVersion) {
        return null;
      }

      return {
        v: envelope.v,
        u: envelope.u,
        s: this.signature.decryptJson<T>(envelope.s),
      };
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
      await this.localStorage.remove(normalizedKey);
    }
  }
}
