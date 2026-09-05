// file: src/app/area/protected/slug.ts
/**
 * ⚠ 'account' was the PRIVATE area's slug until this area was added. it now
 * belongs here: /account is the WEBSITE USER's own signed in space, while the
 * back office master admin moved to /private (src/app/area/private/slug.ts)
 *
 * ⚠ NOT '', unlike the open area. a root level restricted area would prefix
 * match every url and its guard would run for /404 and /503 too — see
 * docs/route-phase-4.md §7. a real segment keeps the gate on this subtree only
 */
export const SLUG_PROTECTED_AREA: string = 'account' as const;
