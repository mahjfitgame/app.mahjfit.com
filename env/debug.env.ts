// ./env/debug.env.ts
import { defaultEnvironment } from "./default.env";
const debugEnvironment: any = {
    NODE_ENV: 'debug',

    DEBUG: true,
    // All app host domain list
    // APP_HOST_GRAPHQL_DOMAIN: 'http://localhost:20147', // GRAPHQL APP gateway supergraph microservice port
    // APP_HOST_WEBSOCKET_DOMAIN: 'ws://localhost:20150', // WEBSOCKET app port
    // APP_HOST_REST_DOMAIN: 'http://localhost:20152', // REST app port
    // APP_HOST_WEB_DOMAIN: 'http://localhost:20153', // WEB app port
    // APP_HOST_AI_DOMAIN: 'http://localhost:20156', // Python AI app port
    // APP_LISTEN_HOST: 'localhost',


    APP_HOST_GRAPHQL_DOMAIN: 'http://0.0.0.0:20147',
    APP_HOST_WEBSOCKET_DOMAIN: 'ws://0.0.0.0:20150',
    APP_HOST_REST_DOMAIN: 'http://0.0.0.0:20152',
    APP_HOST_WEB_DOMAIN: 'http://0.0.0.0:20153',
    APP_HOST_AI_DOMAIN: 'http://0.0.0.0:20156',
    APP_HOST_WEBSITE_DOMAIN: 'https://0.0.0.0:20154', // Frontend Website
    APP_HOST_BACKOFFICE_WEB_DOMAIN: 'https://0.0.0.0:20155', // Frontend BACKOFFICE

    APP_LISTEN_HOST: '0.0.0.0',

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1YkdKYU0xVmtPRFE0VDA5MVlUbFBPUzV5TVRONk5VdzJaMlJ1ZWpCVlQzbDVWbXRaUjB4blBUMHVTVUU5UFEiLCJ1IjoiZGpFdVlsWlNkMDlGYjBaUFJrdDZOVGgyVXk1bVZGUnZaRk0xYWtkNkswRnRWMHh6WTA1VFZXRm5QVDB1ZERobVJGbE5XSE5tUVQwOSIsImUiOiJkakV1SzNNeGNuVkNkV1pEUm05UEwwbHpUaTQzY0dsU2FYSnpRakZMUW1KMGF6aGlRak5MUVdKUlBUMHVOazVDYkd0MmFsWXpRazlwUzJKSGJpdGFOalV5U0cxcFRWZFVOUSIsInIiOiJkakV1ZEhZeVUyRnpUekpFT0Zkd0sxZFJPUzV3ZFVoa1pqZFpVVmwyY3pKVGVIZzJZWGRoVVd4M1BUMHVUa0U5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkzNzk0ODQyLCJleHAiOjE3OTM4ODEyNDIsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.eQZ1_MsnnSD5WtsVR0ZRzSxBXFXQijDXIYWUstMbFVm1jimiP0ftQvERs_7LC6f2O6j6-DlMlZhrZ_MjuLJApIITACePUP1-CxnZ1VPOmOlM5KtJnZFE2gVfOvtyCWwvgQQN2z-uAl35fAJs00uwDx1dVe0Mlrpu86v1BMmx-pACZIz6B132r9iAtb8CkglACU-A_cVSecO1unDBUoSds84GSLf2i49UEOOoef5b1qpyIjHUfW5cbFHq9pbeRgA--OJ4dKL8SJVzko-DLCyEXDw0aTcI-k6xsHzHIIs9qjrCl2Lx9gFlNGJkCt6gT9Yjb4ytQUb0B7UDTJR1H4d7Cg',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1YkdKYU0xVmtPRFE0VDA5MVlUbFBPUzV5TVRONk5VdzJaMlJ1ZWpCVlQzbDVWbXRaUjB4blBUMHVTVUU5UFEiLCJ1IjoiZGpFdVlsWlNkMDlGYjBaUFJrdDZOVGgyVXk1bVZGUnZaRk0xYWtkNkswRnRWMHh6WTA1VFZXRm5QVDB1ZERobVJGbE5XSE5tUVQwOSIsImUiOiJkakV1SzNNeGNuVkNkV1pEUm05UEwwbHpUaTQzY0dsU2FYSnpRakZMUW1KMGF6aGlRak5MUVdKUlBUMHVOazVDYkd0MmFsWXpRazlwUzJKSGJpdGFOalV5U0cxcFRWZFVOUSIsInIiOiJkakV1ZEhZeVUyRnpUekpFT0Zkd0sxZFJPUzV3ZFVoa1pqZFpVVmwyY3pKVGVIZzJZWGRoVVd4M1BUMHVUa0U5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5Mzc5NDg0NCwiZXhwIjoxNzk2Mzg2ODQ0LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.GFoeFjL9BT26G1uPUOWXIw2TZcD134ZXMU13F62Ap154maiykyNmgEGkin5_REPW4usdYqEDZSHjP8QaA58rsbB4bVsFXI8MEf8atgriWoaDUpArvgUq1MXtIB13QPeeR3KC9jRYzRwgrlpHiAuGVhclZw8bRRa6UQcivbSmZbH8lQel6_T2VbAuE_o2UQNLNMwvVmE52kpVyIw2w5qJUPt0ymBn4wNhBWGlLhSMYMCfWVmI2NAovT59PFmI--30H_jQT508xOVYc0BQZW8K7g0g3aEBML0w49JU7D7rV5cy05SLgmKQsB33Kk92yIZueYxVJckk0VxulG_4tuK4Pw',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://localhost:20178/graphql',
    BFW_API_SDK_REST_URL: 'https://localhost:20152/rest',
    BFW_API_SDK_WS_URL: 'https://localhost:20179', */

    // direct API on LAN (cross-site from the app, Safari blocks the session cookie)
    //BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.200:20178/graphql',
    //BFW_API_SDK_REST_URL: 'https://192.168.0.200:20178/rest',
    //BFW_API_SDK_WS_URL: 'https://192.168.0.200:20179',

    // via ng serve proxy (proxy.conf.json forwards to 192.168.0.200), same-site so Safari keeps cookies
    BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.231:20180/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.231:20180/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.231:20180',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://api-mahjfit-com.thatsend.dev/graphql',
    BFW_API_SDK_REST_URL: 'https://api-mahjfit-com.thatsend.dev/rest',
    BFW_API_SDK_WS_URL: 'https://ws-mahjfit-com.thatsend.dev', */
};
export const environment: any = { ...defaultEnvironment, ...debugEnvironment };