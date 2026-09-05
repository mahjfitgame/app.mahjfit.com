// file: src/app/area/protected/enum.ts

/**
 * @ProtectedAreaLayoutSlotEnum
 * the portal slots a module may fill in this area's shell
 *
 * ⚠ deliberately a SUBSET of PrivateAreaLayoutSlotEnum, with the same member
 * names where the concept exists. this shell is a top bar and a page, it has no
 * start sidebar and no end sidebar, so those members simply do not exist here —
 * add one only when the template grows an outlet for it
 */
export enum ProtectedAreaLayoutSlotEnum {
    SLOT_MAIN_HEADER_TOOLBAR_EXTENSION = 'SLOT_MAIN_HEADER_TOOLBAR_EXTENSION',
    SLOT_MAIN_FOOTER_TOOLBAR_EXTENSION = 'SLOT_MAIN_FOOTER_TOOLBAR_EXTENSION',
}
