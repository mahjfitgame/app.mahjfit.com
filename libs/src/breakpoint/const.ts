// file: libs/src/breakpoint/const.ts
import { UiSizeEnum } from './enum';

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
export const BREAKPOINTS = {
  xs: '(max-width: 599.98px)',
  sm: '(min-width: 600px) and (max-width: 959.98px)',
  md: '(min-width: 960px) and (max-width: 1279.98px)',
  lg: '(min-width: 1280px) and (max-width: 1679.98px)',
  xl: '(min-width: 1680px) and (max-width: 2239.98px)',
  xxl: '(min-width: 2240px)',
} as const;

export const UI_WIDTH: Record<UiSizeEnum, string> = {
  [UiSizeEnum.XS]: '28rem',
  [UiSizeEnum.SM]: '35rem',
  [UiSizeEnum.MD]: '48rem',
  [UiSizeEnum.LG]: '64rem',
  [UiSizeEnum.XL]: '80rem',
  [UiSizeEnum.XXL]: '90vw',
  [UiSizeEnum.FULL]: '100vw',
};