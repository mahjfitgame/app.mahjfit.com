// file: libs/src/web-page/on-page-seo/const.ts
// ROBOTS_INSTRUCTION
export const RI_PUBLIC_PAGE = 'index,follow' as const;
export const RI_PRIVATE_PAGE = 'noindex,nofollow' as const;
export const RI_FOLLOW_ONLY_PAGE = 'noindex,follow' as const;
export const RI_INDEX_ONLY_PAGE = 'index,nofollow' as const;