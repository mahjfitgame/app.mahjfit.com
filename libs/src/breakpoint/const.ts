// file: libs/src/breakpoint/const.ts
import { BreakpointSizeEnum } from './enum';

export const BREAKPOINT_XS = 'xs' as const;
export const BREAKPOINT_SM = 'sm' as const;
export const BREAKPOINT_MD = 'md' as const;
export const BREAKPOINT_LG = 'lg' as const;
export const BREAKPOINT_XL = 'xl' as const;
export const BREAKPOINT_XXL = 'xxl' as const;

/**
 * If you chnage any break points consider updating file
 * libs/src/breakpoint/constant.ts
 * As we need to align Angular and Tailwind BREAKPOINTS align with each other
 *
 * xs: 0 - 599.98
 * sm: 600 - 959.98
 * md: 960 - 1279.98
 * lg: 1280 - 1679.98
 * xl: 1680 - 2239.98
 * xxl: 2240+
 */
export const BREAKPOINT_RANGE = {
  xs: '(max-width: 599.98px)',
  sm: '(min-width: 600px) and (max-width: 959.98px)',
  md: '(min-width: 960px) and (max-width: 1279.98px)',
  lg: '(min-width: 1280px) and (max-width: 1679.98px)',
  xl: '(min-width: 1680px) and (max-width: 2239.98px)',
  xxl: '(min-width: 2240px)',
} as const;

/**
 * Every UiSizeEnum stop in display order, for any UI that lets a user PICK a
 * size rather than cycle one - a dialog's size menu, a preview switcher.
 *
 * ⚠ the labels are size TOKENS on purpose, not sentences. 'XS'/'LG'/'FULL' read
 * the same in all six languages, so a menu built from this needs no i18n keys.
 */
export const BREAKPOINT_SIZE_OPTIONS: readonly { size: BreakpointSizeEnum; label: string }[] = [
  { size: BreakpointSizeEnum.XS, label: 'XS' },
  { size: BreakpointSizeEnum.SM, label: 'SM' },
  { size: BreakpointSizeEnum.MD, label: 'MD' },
  { size: BreakpointSizeEnum.LG, label: 'LG' },
  { size: BreakpointSizeEnum.XL, label: 'XL' },
  { size: BreakpointSizeEnum.XXL, label: '2XL' },
  { size: BreakpointSizeEnum.FULL, label: 'FULL' },
] as const;

export const BREAKPOINT_WIDTH: Record<BreakpointSizeEnum, string> = {
  [BreakpointSizeEnum.XS]: '28rem',
  [BreakpointSizeEnum.SM]: '35rem',
  [BreakpointSizeEnum.MD]: '48rem',
  [BreakpointSizeEnum.LG]: '64rem',
  [BreakpointSizeEnum.XL]: '80rem',
  /**
   * ⚠ the max() is a FIX, not decoration. A bare '90vw' is viewport-relative
   * while every stop below it is absolute, so the ladder stopped being ordered:
   * between roughly 1312px and 1422px of viewport, 90vw resolves BELOW the XL
   * stop's 1280px and a dialog opened at XXL came out NARROWER than one opened
   * at XL. The floor keeps XXL >= XL at every viewport, and 90vw still wins on
   * the wide screens it was meant for (2240px -> 2016px).
   *
   * 96rem continues the ladder's own rhythm (…48, 64, 80, 96).
   */
  [BreakpointSizeEnum.XXL]: 'max(96rem, 90vw)',
  [BreakpointSizeEnum.FULL]: '100vw',
};