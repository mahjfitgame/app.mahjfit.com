// file: src/app/area/private/slug.ts
/**
 * ⚠ RENAMED from 'account' → 'private'. the back office master admin area now
 * lives under /private, and 'account' was handed to the new PROTECTED area
 * (src/app/area/protected/slug.ts) which is the website user's logged in area
 */
export const SLUG_PRIVATE_AREA: string = 'private' as const;
