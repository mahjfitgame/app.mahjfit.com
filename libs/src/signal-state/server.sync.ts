// file: libs/src/signal-state/server.sync.ts
import { Service, inject } from '@angular/core';
import { SignatureService } from '../signature/service';
import { SignalStateUtility } from './utility';
import {
  SignalStateServerSyncEnvelopeType,
  SignalStateServerSyncSourceType,
  SignalStateServerSyncValueType,
  SignalStateScopeType,
} from './type';

@Service()
export class SignalStateServerSync {
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
   * Keeps the emptySource: SignalStateServerSyncSourceType dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly emptySource: SignalStateServerSyncSourceType = {
    getValue: async () => null,
    setValue: async () => undefined,
    deleteKey: async () => undefined,
  };

  /**
   * Handles the buildStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string {
    return this.utility.buildStorageKey(store, field, scope);
  }

  /**
   * Saves a serializable value under the normalized storage key.
   * The value is encrypted inside a versioned envelope before it reaches the backend.
   */
  public async save<T>(
    key: string,
    state: T,
    version = 1,
    source?: SignalStateServerSyncSourceType,
  ): Promise<void> {
    const normalizedKey = this.utility.normalizeStorageKey(key);

    this.utility.assertSerializable(state);

    const envelope: SignalStateServerSyncEnvelopeType = {
      v: version,
      u: new Date().toISOString(),
      s: this.signature.encryptJson(state),
    };

    await this.sourceFor(source).setValue(normalizedKey, envelope);
  }

  /**
   * Loads and decrypts a value only when the key and version are valid.
   * Invalid, missing, or unreadable data returns null so callers can use defaults safely.
   */
  public async load<T>(
    key: string,
    expectedVersion = 1,
    source?: SignalStateServerSyncSourceType,
  ): Promise<SignalStateServerSyncValueType<T> | null> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return null;
    }

    try {
      const stored = await this.sourceFor(source).getValue<
        SignalStateServerSyncEnvelopeType | string
      >(normalizedKey);

      if (!stored) {
        return null;
      }

      const envelope = this.utility.parseEnvelope<SignalStateServerSyncEnvelopeType>(stored);
      if (this.utility.isStorageEnvelope(envelope)) {
        if (envelope.v !== expectedVersion) {
          return null;
        }

        return {
          v: envelope.v,
          u: envelope.u,
          s: this.signature.decryptJson<T>(envelope.s),
        };
      }

      return {
        v: expectedVersion,
        u: new Date().toISOString(),
        s: stored as T,
      };
    } catch {
      return null;
    }
  }

  /**
   * Handles the remove operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async remove(key: string, source?: SignalStateServerSyncSourceType): Promise<void> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return;
    }

    const syncSource = this.sourceFor(source);
    if (!syncSource.deleteKey) {
      await syncSource.setValue(normalizedKey, null);
      return;
    }

    await syncSource.deleteKey(normalizedKey);
  }

  /**
   * Handles the sourceFor operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private sourceFor(source?: SignalStateServerSyncSourceType): SignalStateServerSyncSourceType {
    return source ?? this.emptySource;
  }
}
