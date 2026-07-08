import { computed, inject, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { BREAKPOINT_XXL, BREAKPOINT_LG, BREAKPOINT_MD, BREAKPOINT_SM, BREAKPOINT_XL, BREAKPOINT_XS, BREAKPOINTS } from './const';
import { BreakpointType } from './type';

@Service()
export class BreakpointObserverService {
  private readonly bpo = inject(BreakpointObserver);

  private readonly state = toSignal(
    this.bpo.observe(Object.values(BREAKPOINTS)).pipe(
      map((result) => result.breakpoints),
    ),
    {
      initialValue: {
        [BREAKPOINTS.xs]: false,
        [BREAKPOINTS.sm]: false,
        [BREAKPOINTS.md]: false,
        [BREAKPOINTS.lg]: false,
        [BREAKPOINTS.xl]: false,
        [BREAKPOINTS.xxl]: false,
      },
    },
  );

  public readonly isXs = computed(() => this.state()[BREAKPOINTS.xs]);
  public readonly isSm = computed(() => this.state()[BREAKPOINTS.sm]);
  public readonly isMd = computed(() => this.state()[BREAKPOINTS.md]);
  public readonly isLg = computed(() => this.state()[BREAKPOINTS.lg]);
  public readonly isXl = computed(() => this.state()[BREAKPOINTS.xl]);
  public readonly isXxl = computed(() => this.state()[BREAKPOINTS.xxl]);

  public readonly isSmAndUp = computed(() => !this.isXs());
  public readonly isMdAndUp = computed(() => this.isMd() || this.isLg() || this.isXl() || this.isXxl());
  public readonly isLgAndUp = computed(() => this.isLg() || this.isXl() || this.isXxl());
  public readonly isXlAndUp = computed(() => this.isXl() || this.isXxl());
  public readonly isXxlAndUp = computed(() => this.isXxl());

  public readonly isXsAndDown = computed(() => this.isXs());
  public readonly isSmAndDown = computed(() => this.isXs() || this.isSm());
  public readonly isMdAndDown = computed(() => this.isXs() || this.isSm() || this.isMd());
  public readonly isLgAndDown = computed(() => this.isXs() || this.isSm() || this.isMd() || this.isLg());
  public readonly isXlAndDown = computed(() => this.isXs() || this.isSm() || this.isMd() || this.isLg() || this.isXl());
  public readonly isXxlAndDown = computed(() => this.isXs() || this.isSm() || this.isMd() || this.isLg() || this.isXl() || this.isXxl());

  public readonly current = computed<BreakpointType>(() => {
    if (this.isXxl()) return BREAKPOINT_XXL;
    if (this.isXl()) return BREAKPOINT_XL;
    if (this.isLg()) return BREAKPOINT_LG;
    if (this.isMd()) return BREAKPOINT_MD;
    if (this.isSm()) return BREAKPOINT_SM;
    return BREAKPOINT_XS;
  });

  public isMatched(query: string | readonly string[]): boolean {
    return this.bpo.isMatched(query);
  }
}