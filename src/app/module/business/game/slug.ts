// file: ./src/app/module/business/game/slug.ts
// main slug
export const SLUG_GAME = 'game' as const;

// params slug
export const SLUG_GAME_PARAM_GKEYID = 'gkeyid' as const;

// query params slug
//export const SLUG_GAME_QUERYPARAM_EXAMPLE = 'example' as const;

// sub slug(s)
export const SLUG_GAME_KEYID = `${SLUG_GAME}/:${SLUG_GAME_PARAM_GKEYID}` as const;