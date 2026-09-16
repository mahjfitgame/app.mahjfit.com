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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1VFVkdk1FTTROamRxV0VOTk4ybHdhaTQxTUd4WWFsazRSMVp1VEU0eWVEWTJVMXBRYm5kQlBUMHVZbWM5UFEiLCJ1IjoiZGpFdWNtRXZZekpSUzJ4a1YxRTNTWEJOU0M1RGRGZEpTVkZ2U1VRelNtMXBUbWhOWW1kemRsWjNQVDB1ZG1ncmFYcHlkRlpwVVQwOSIsImUiOiJkakV1YTJaRmRESm5PV1IxV2sxWVQweG1ZUzVpTHk5bk1XdHhXSEZsZEZJck5taENRVGRKWlhaUlBUMHVMekZzV25FeE5FTkphbmxOY0U1bFNuWmpUazVGV2xkSWVUZHVNdyIsInIiOiJkakV1TWtKcmF6UnZZbUZaVG5OTloyZFZhaTV5T1doYVltSk1WRmx1VVhaMFpEaDZNa1ZWY25OblBUMHVNMUU5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg5MTA3MTk4LCJleHAiOjE3ODkxOTM1OTgsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.hpI7iFsu7yEP51Zg7hzXJGUHbVdVG_zr9htn_DKTpze4dBg4jE_JZfL9zzVuL3c9us3N7TAPQjY7h3PAEpnZaf68Day71GRpSwoWYcSkuz-M3zHInswSH7AFMxwkNia8nPiI87vo-VVvmvi2hUwqANKQc3DB0kARdEoyF6ZPVpWs6uJQ0RFqSNTjJbGcEFjXNpKsmtZhIefE5z1Gt0m625_MXDqI1ksJY5FesBWP1rE6L99BQ7x6lFCsqcTaAatZkchDGa-BSUt2GYgarM3rhE3o_qePEfHk5_zw448RD-0CwpaHYav3GpSfzIK_dJk95YdkP3rMocevqLXWUOf9eQ',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1VFVkdk1FTTROamRxV0VOTk4ybHdhaTQxTUd4WWFsazRSMVp1VEU0eWVEWTJVMXBRYm5kQlBUMHVZbWM5UFEiLCJ1IjoiZGpFdWNtRXZZekpSUzJ4a1YxRTNTWEJOU0M1RGRGZEpTVkZ2U1VRelNtMXBUbWhOWW1kemRsWjNQVDB1ZG1ncmFYcHlkRlpwVVQwOSIsImUiOiJkakV1YTJaRmRESm5PV1IxV2sxWVQweG1ZUzVpTHk5bk1XdHhXSEZsZEZJck5taENRVGRKWlhaUlBUMHVMekZzV25FeE5FTkphbmxOY0U1bFNuWmpUazVGV2xkSWVUZHVNdyIsInIiOiJkakV1TWtKcmF6UnZZbUZaVG5OTloyZFZhaTV5T1doYVltSk1WRmx1VVhaMFpEaDZNa1ZWY25OblBUMHVNMUU5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4OTEwNzE5OCwiZXhwIjoxNzg5NzExOTk4LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.B4T3a-totPjy7rU6Z6WmlduSGKhOlRsbF-chlGUyQRSVHxcMGn88Ee1TyMHzc5epvls5yg_y7HhMSHssJUI901rQcDCga796idSaFcSetfExMHLKRcrI5_Wi3l2qh9oHrccYycPvMnbNy0a5APNzkXPwG2PJYK-Ld5dlXTRJCBa7AYzSqWH4iPtYxrt4xtje4cdgYGdX9RVD25deo1ySOxz0dCIGIQ_RprlSDF_OfdlGj3fWgjoDfVzsB-fOtKzidn1DOwdP-dSn0obKJ9-w4XPY04sur0frGoBi-LLbc11hnSckS2GBnK9p-xLGht8zOxi2BVM2S66-_s9gIIvp5Q',

    // BFW_API_SDK_GRAPHQL_URL: 'https://localhost:20178/graphql',
    // BFW_API_SDK_REST_URL: 'https://localhost:20152/rest',
    // BFW_API_SDK_WS_URL: 'https://localhost:20179',

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