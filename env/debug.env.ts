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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1TDBJeWQyVlBTMVZNUlVKMGJrVldaeTV6U1VSRVlVZFBkbUZ6VTJwSlZIZFljRWxQVTNGUlBUMHVWbWM5UFEiLCJ1IjoiZGpFdVRsWmFOaXRJWWtzeGQyeG5OSE5SUnk1SFZWaFdWa2cxWm5NeVRVczFWV2t2TUhSU09HVkJQVDB1VTBRelZEZEZiVVV4VVQwOSIsImUiOiJkakV1V0ZOc1FUUmlXR1J2VDBWaU5qWTJLeTV2V0RKeFYwWmlSbkZ0VGlzeE0wWnZZbWt5TVc1M1BUMHVWVFYzVERkWGFXbGlaV0p2VURka05ucEVaRkV3VEdwemFXc3pNdyIsInIiOiJkakV1VFV4cmQzRjRLemhRYXpOTGJUUmxVQzQ0V2prMlJ6SklRWGN4YVZwRU9EWkhSbTlZWlhOM1BUMHVjWGM5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkwODMyNjgzLCJleHAiOjE3OTA5MTkwODMsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.P_2bVDGx13dftgh_HgPAL2KtL9DYSaNIpnFkgWusQnZrGYsy4zA1c4DepLCtMHnX64R0fFGIE5Kt9SwwUC0FBfOs7nTyTBYB-tRi-fm9FpL1fipi-Sk7otbJt1NO21Z5ONem93u8L15KDRvbe9pWibuKTSCB5CuO00mfFEgvspl97EnKrz4cAe--jjNLwvGN7gjcgZQ0GV_4gc6dfLXTHa0ZJo7cQI31ApYPXAzIh0PyeCEKH6LsrDiLipwPT2YZYzJtRJYABa1AyFeAWWJRfLkxWq9qw-3wd3evMNXp2xClWDJ2fxMCF7OzC4YIuh5nkTvFkp-62Sz-eUEfjfxZbw',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1TDBJeWQyVlBTMVZNUlVKMGJrVldaeTV6U1VSRVlVZFBkbUZ6VTJwSlZIZFljRWxQVTNGUlBUMHVWbWM5UFEiLCJ1IjoiZGpFdVRsWmFOaXRJWWtzeGQyeG5OSE5SUnk1SFZWaFdWa2cxWm5NeVRVczFWV2t2TUhSU09HVkJQVDB1VTBRelZEZEZiVVV4VVQwOSIsImUiOiJkakV1V0ZOc1FUUmlXR1J2VDBWaU5qWTJLeTV2V0RKeFYwWmlSbkZ0VGlzeE0wWnZZbWt5TVc1M1BUMHVWVFYzVERkWGFXbGlaV0p2VURka05ucEVaRkV3VEdwemFXc3pNdyIsInIiOiJkakV1VFV4cmQzRjRLemhRYXpOTGJUUmxVQzQ0V2prMlJ6SklRWGN4YVZwRU9EWkhSbTlZWlhOM1BUMHVjWGM5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5MDgzMjY4MywiZXhwIjoxNzkxNDM3NDgzLCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.VZCS0KaFr0WcxOUcLWRFnBL_zspsXlAtth92iaK7VDEhlEBFa2IDqUZbQ7RQv05g4Z7lcKP1SFc_b9-OXyIiKLAT-A2Lq_J_-VVbqLZoQGmD7eEna11FpnJPQirKRhX8-lAEb_kfxBCfJn85bv6W-3hDTZp23Kc8FEkczftcBA9BIc5t5_u2_W5WCbqbQsjZzLuBtPBo__iuS2BBZOxrYjMluskV2oQQhSk7K1AbWLlqAlt-2im0F9bi-56g9eoZ79T2y4fL3Hgdeh2-TldeGVPnXCR7zfVW-kyoH_MHDCN5rTho19ZUhtj6dM12yR6WreFlzRas7XDD5rZGE22C6g',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://localhost:20178/graphql',
    BFW_API_SDK_REST_URL: 'https://localhost:20152/rest',
    BFW_API_SDK_WS_URL: 'https://localhost:20179', */

    //BFW_API_SDK_GRAPHQL_URL: 'http://0.0.0.0:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://0.0.0.0:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://0.0.0.0:20150',

    BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.200:20178/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.200:20178/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.200:20179',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://api-mahjfit-com.thatsend.dev/graphql',
    BFW_API_SDK_REST_URL: 'https://api-mahjfit-com.thatsend.dev/rest',
    BFW_API_SDK_WS_URL: 'https://ws-mahjfit-com.thatsend.dev', */
};
export const environment: any = { ...defaultEnvironment, ...debugEnvironment };