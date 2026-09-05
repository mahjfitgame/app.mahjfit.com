// file: libs/src/foundation/nav/enum.ts

/**
 * @FoundationNavPositionEnum
 * = te_access_area_navigation.nav_position
 *
 * WHERE a menu entry renders. one build feeds all of them
 *
 * ⚠ START / END, not LEFT / RIGHT. the app ships arabic (src/lang/i18n/ar.json)
 * and the theme is built on logical properties throughout: tw:ps-6,
 * bfw-safe-area-ps, #BfwStartSideBar, bfw-sidenav-end-footer. in RTL the start
 * sidebar IS on the right, so a position named RIGHT would be correct in
 * english and wrong in arabic
 */
export enum FoundationNavPositionEnum {
    /** header bar */
    TOP        = 'top',
    /** the start sidebar, today's main menu. the DEFAULT when a row says nothing */
    START      = 'start',
    /** footer bar */
    BOTTOM     = 'bottom',
    /** the end sidebar */
    END        = 'end',
    /** the avatar menu in the start sidebar's footer */
    ONBOARDING = 'onboarding',
}
