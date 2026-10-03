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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1U1ROV2RqZHZRVU5YTkRsNFIwaGhPUzVHV2pKWlVUUkRURlJwYUZGUlZYRmxTSEV6Ymt0blBUMHVlSGM5UFEiLCJ1IjoiZGpFdVdHdHlXa0pvWWpGcFkxUkhXRnA1TXk1R1dHcHlRa1pOVURNMFNUUk5TRUk1Vm5waU5taEJQVDB1ZWpWdWFtMHJNeXRtUVQwOSIsImUiOiJkakV1TkZKWWFuQlBVemswU3pKcFNtVXZiaTV5TUhaYWRUZG1lVWxqVlhCTVZWSmFhRXRrY1hCM1BUMHVVSEpyUmxSd1NHRmpkMjlUYUdRM1NVMUlOVWRsVTNaWGRXWnRWZyIsInIiOiJkakV1ZFhSTlRsaFFUbmswTUZwVU5DOXhkQzQzTkRkWlFsaHRaVEozY3pjeFEyOXBPRkY0TWt0QlBUMHVVVkU5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkwMjM1MDIxLCJleHAiOjE3OTAzMjE0MjEsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.EpfTibvuPTHkT-lfzCNPH4TKJzB8P3CfJmc1wRt7t2R48tpmJ0oe6P6qcQKidLYJpEL5OOqgF4OeoYOW73lmenZnIYI69mydsQ5yuAJiWRZFtgb3pqkrImAvJx2gPVmbMxfGHFTXZ8TW69Jq720bQAvXIZj3FgNAJcnshdmva5L8F3Qg2ctE5iU5gKu5bAx3g1yszBlu96uvuQgEQMDnlfH0pvYqVTLOM4pJlMQ7H8XPuaAE5MoTVdNBQHF7xSYpTgee4qm_5TDhFzXhzfkwaCbN_OYKvwsaG7zUxdYHDZ2e3QQDGOZjlXKAA1YB1FbldA5LMhqmnwHQUrSIGFS4WQ',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1U1ROV2RqZHZRVU5YTkRsNFIwaGhPUzVHV2pKWlVUUkRURlJwYUZGUlZYRmxTSEV6Ymt0blBUMHVlSGM5UFEiLCJ1IjoiZGpFdVdHdHlXa0pvWWpGcFkxUkhXRnA1TXk1R1dHcHlRa1pOVURNMFNUUk5TRUk1Vm5waU5taEJQVDB1ZWpWdWFtMHJNeXRtUVQwOSIsImUiOiJkakV1TkZKWWFuQlBVemswU3pKcFNtVXZiaTV5TUhaYWRUZG1lVWxqVlhCTVZWSmFhRXRrY1hCM1BUMHVVSEpyUmxSd1NHRmpkMjlUYUdRM1NVMUlOVWRsVTNaWGRXWnRWZyIsInIiOiJkakV1ZFhSTlRsaFFUbmswTUZwVU5DOXhkQzQzTkRkWlFsaHRaVEozY3pjeFEyOXBPRkY0TWt0QlBUMHVVVkU5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5MDIzNTAyMSwiZXhwIjoxNzkwODM5ODIxLCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.A-qaEJfo0UCDHorct4aQVKU56V_0V5bXFW_4AFsOyuroyuY-zAJ5XggauIeGSWz3fuuphvwK6QhsaSMKweVQ8KPYHXhEPxC7h3pAUDIbumRmxHmJ0srsziGphUq16AXI1rBf6oR_Z4YBR6A8c8ta_kU0ToTMq58zaLVK4ex5R07gmS9URI4j00KusrToexSTLb0jKCzP3nZ3QU0c0OqXeWyKXjPW9OAOx9C_6NTZei9YAJjhW63pQSwQ2OBda40idC9Ks0Iksx3adMeJUSNdv0ciVxBVD1p3LptKPs8XCArpKEyA_GKRLuznoFua7pVWRsdqY5UO0pvmBjAVINDQgQ',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://localhost:20178/graphql',
    BFW_API_SDK_REST_URL: 'https://localhost:20152/rest',
    BFW_API_SDK_WS_URL: 'https://localhost:20179', */

    //BFW_API_SDK_GRAPHQL_URL: 'http://0.0.0.0:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://0.0.0.0:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://0.0.0.0:20150',

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