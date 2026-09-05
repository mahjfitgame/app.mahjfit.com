// file: libs/src/foundation/nav/state.ts
import { Service, signal } from '@angular/core';
import { FoundationNavExpandOverrideType } from './type';

/**
 * @FoundationNavState
 * the only reactive thing in the nav layer
 *
 * ⚠ imports nothing from service.ts, that is why there is no cycle. the split
 * is on what the data IS: an expansion override is a signal so it lives here,
 * the decorated trees are an immutable cache so they live on the service
 */
@Service()
export class FoundationNavState {
    // SIGNALS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** registry_key -> the user's manual expand/collapse, overriding the route */
    private readonly _expandOverride = signal<FoundationNavExpandOverrideType>({});
    public readonly expandOverride = this._expandOverride.asReadonly();

    // MUTATIONS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setExpandOverride(registryKey: string, expanded: boolean): void {
        this._expandOverride.update((current) => ({ ...current, [registryKey]: expanded }));
    }

    public clearExpandOverride(): void {
        this._expandOverride.set({});
    }
}
