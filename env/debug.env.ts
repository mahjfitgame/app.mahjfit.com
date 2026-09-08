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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1SzBSdGVUVk5MMjFDUldsWFRXMXNUaTVIWld0M09FcFRUbUZXTUhkb1ZEaGpaMVpDUkhKQlBUMHVkMmM5UFEiLCJ1IjoiZGpFdWRVRkJXV1YzUkhSTVkzRnpTRkpxUnk1TmVFRmhNSGhsU0V0amJIUXdaemxsUTFkUFVHZG5QVDB1V1ZCVFoybGFkWEpQWnowOSIsImUiOiJkakV1ZGxkaWVEaGFOalp6VUZoSGEzWnRXUzUwUVVGU055OVhVemxaTkhKUGQxTXdNMVpOUTFWQlBUMHVMMll4VFhscFJTdFpkSE4wU3pSR2JWQmpaMGhTU1VsS1RHdzNiQSIsInIiOiJkakV1VERjMFluQnZlRUpoUTJVMVlrWnpTUzVvY21ZNFNub3hPV1pPWkM5M1FubE9TMWhOTkdoQlBUMHVSMUU5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg4MjM5MjU0LCJleHAiOjE3ODgzMjU2NTQsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.BD1GE6sPTHz0dtJZxb4d0_lIJ3Ip_RKp5JJM1m9nPwXyEaa0--qXI0vamA3hMU122iwv83kzXKpFP389S61QgQ9sItt73MknRHfUw7wtjOGNoNVnkUQ1SC3u_aDLJYcdBednR5UzZfeZoaX6OAxKZNmptWA8zQLFQv5jBdX1BoGzINhJMQy9MV2wziaIJunrWLq3ISYhPZjIKZ8pszMte34kNafMfagpNuOIzDKL657FMc_GYnh1QFjGHb5GcBtT7dDDsI6wZ3S3us6TL0tbty6U9sTj0L5jMpiW_cQjnBKL-FHu0JTFZFQlZ-jK4FSvJPvCwHNQFGD3BJgTEs69Rw',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1SzBSdGVUVk5MMjFDUldsWFRXMXNUaTVIWld0M09FcFRUbUZXTUhkb1ZEaGpaMVpDUkhKQlBUMHVkMmM5UFEiLCJ1IjoiZGpFdWRVRkJXV1YzUkhSTVkzRnpTRkpxUnk1TmVFRmhNSGhsU0V0amJIUXdaemxsUTFkUFVHZG5QVDB1V1ZCVFoybGFkWEpQWnowOSIsImUiOiJkakV1ZGxkaWVEaGFOalp6VUZoSGEzWnRXUzUwUVVGU055OVhVemxaTkhKUGQxTXdNMVpOUTFWQlBUMHVMMll4VFhscFJTdFpkSE4wU3pSR2JWQmpaMGhTU1VsS1RHdzNiQSIsInIiOiJkakV1VERjMFluQnZlRUpoUTJVMVlrWnpTUzVvY21ZNFNub3hPV1pPWkM5M1FubE9TMWhOTkdoQlBUMHVSMUU5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4ODIzOTI1NCwiZXhwIjoxNzg4ODQ0MDU0LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.lLK1fjEl7ew0DRInGCpzMEgEczkiF5xqXpJRiMytJ1kms5ktzoYxzmwzgdA5D92_oVMQ47WG-Q2i0Dzh7ZJhVyZCW2hLyLj1LX-HQyzJn0xnkwFGDI5aQL1Bdc5SHO20NIhL3tC05kfFKymFqbkPtPAHu9olEBm2PWioT8c6ExFjNNVEpU2JDYlRGOEaZzU_FJgH7dVk6JhuA-k5-gUqLiafhicAIRzJuSdqRVBAz6hVN8Mn9zyuwIdcJZvYfK2nEsNJWn8W5ihXvd5qRIS83CtJA4YG2N4J5ysbYmP4-8GKulnzIwr16UNSFG_O0d2PpP1exrkHyEuuk0o_01HJLQ',

    BFW_API_SDK_GRAPHQL_URL: 'https://localhost:20178/graphql',
    BFW_API_SDK_REST_URL: 'https://localhost:20152/rest',
    BFW_API_SDK_WS_URL: 'https://localhost:20179',

    //BFW_API_SDK_GRAPHQL_URL: 'http://0.0.0.0:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://0.0.0.0:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://0.0.0.0:20150',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.230:20147/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.230:20152/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.230:20150', */

    // BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.200:20178/graphql',
    // BFW_API_SDK_REST_URL: 'https://192.168.0.200:20178/rest',
    // BFW_API_SDK_WS_URL: 'https://192.168.0.200:20179',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://api-mahjfit-com.thatsend.dev/graphql',
    BFW_API_SDK_REST_URL: 'https://api-mahjfit-com.thatsend.dev/rest',
    BFW_API_SDK_WS_URL: 'https://ws-mahjfit-com.thatsend.dev', */
};
export const environment: any = { ...defaultEnvironment, ...debugEnvironment };