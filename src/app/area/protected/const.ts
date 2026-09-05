// file: src/app/area/protected/const.ts
/**
 * PTAL: protected area layout
 * ⚠ must not collide with the other areas' keys — 'pal' (private), 'aal'
 * (auth), 'oal' (open). one persisted signal-state bucket each
 */
export const PROTECTED_AREA_STATE_STORE_KEY = 'ptal' as const;
