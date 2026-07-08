declare module '@shimmer-from-structure/angular' {
  import { Type } from '@angular/core';
  export const ShimmerComponent: Type<any>;
  export function provideShimmerConfig(config: any): any;
}
