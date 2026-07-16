// file: libs/src/platform/provider.ts
import { inject, InjectionToken, Provider, Type } from "@angular/core";
import { PlatformAdapter } from "./adapter";
import { CapacitorPlatformAdapter } from "./capacitor.adapter";

export const PLATFORM_ADAPTER = new InjectionToken<PlatformAdapter>('PLATFORM_ADAPTER', {
  providedIn: 'root',
  factory: () => inject(CapacitorPlatformAdapter),
});

/** Override the default Capacitor adapter without changing application code. */
export function providePlatformAdapter(adapter: Type<PlatformAdapter>): Provider {
  return {
    provide: PLATFORM_ADAPTER,
    useClass: adapter,
  };
}