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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1TlhsdE5GazFjbEJ5T1RONmJ6SnJjeTV0WTI4NFdtUlBXVXRVYjJ0Q1dsVm5URWg0YmtOblBUMHVUVkU5UFEiLCJ1IjoiZGpFdVRYQkpkVmhFZWxveVZsQjVNME5NUnk1RE1qRllLMlJVTDFaTWNIRXJPRlZ4WkZwTFdYRjNQVDB1V0U5MmFYYzNXaXRGZHowOSIsImUiOiJkakV1VVZkNUwyWjFVbWxFTkRGV1JGaE1XaTVKYTI1blRubG1XSGRFYWpOVVpVNVhNV0Z1VDFOM1BUMHVOWGt4TUV0WVUzVktVQ3MxTTNKNWNWbGlSRkZ1YzFGQlpHVjVUUSIsInIiOiJkakV1WmxWbGQycFdSRkJzT1hGSFdrdDJkUzVxZW5GMVUyRlVWMUJ3UzNOVFFWWjJWbkJMVVVoblBUMHVMMUU5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyODE4MDQwLCJleHAiOjE3OTI5MDQ0NDAsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.cUfImmcGdqKfgRdMolpv9UodNOczr0YZB09I5kUVhqxTAd3z3tRZNjz4JxKMfMNixm0nADEKh76k1L7H4mz8ksGWyr_wdCr3P3MXz5z0z5Tj7A-D6mmrBuRrt7C-c5brsZzsQpHRJ0FvT57fTOMXGNpsMgAaecaeefDln9zydvLWXaTSTJKJFloYSKI8i_N-Yp9r-wpBt6l7szrP3iQ8uxKH-6J2sjbYgvWXmxdFiBUmgoOPpyb6iIOt-euk2XlcjMM1Hj7cHlIl6upjLf1DQL1VHadhmiT3C1HGAF1IMiVo8bWP8tqR0zzVhs_Ewop87sWB-HwV_9Hn6OoojT8NMQ',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1TlhsdE5GazFjbEJ5T1RONmJ6SnJjeTV0WTI4NFdtUlBXVXRVYjJ0Q1dsVm5URWg0YmtOblBUMHVUVkU5UFEiLCJ1IjoiZGpFdVRYQkpkVmhFZWxveVZsQjVNME5NUnk1RE1qRllLMlJVTDFaTWNIRXJPRlZ4WkZwTFdYRjNQVDB1V0U5MmFYYzNXaXRGZHowOSIsImUiOiJkakV1VVZkNUwyWjFVbWxFTkRGV1JGaE1XaTVKYTI1blRubG1XSGRFYWpOVVpVNVhNV0Z1VDFOM1BUMHVOWGt4TUV0WVUzVktVQ3MxTTNKNWNWbGlSRkZ1YzFGQlpHVjVUUSIsInIiOiJkakV1WmxWbGQycFdSRkJzT1hGSFdrdDJkUzVxZW5GMVUyRlVWMUJ3UzNOVFFWWjJWbkJMVVVoblBUMHVMMUU5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5MjgxODA0MCwiZXhwIjoxNzkzNDIyODQwLCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.qpK2IvCNpp9_9AW3fnM7mjekDE1eRionY8586ZuI3Biw51XCm0-bqhKHnyjlCM0hMuEswRh_LcNgLV-6CKZ7-Vrox5dWNxXI2SmdTxLXgkttwTBTmCrpHxdJG6U9NlC8jcUf2hp8dVuwyNT-aaJ_sq3KnvsbzX9_fapyA9W7IT63cOtCbzoo-jlt9fAsEo_fVXNjQCPnecIgX-fReqQI0leiAuUctc1xasLCqzYwuOp8lNSLOgpNC_Qy5DEZaC03HvqhGq7yNq2y7aRlER8kHZEzHWujNozOMF9UHgbcGQlLs0nbpUkcttlA0RzpMkAn-8mv_yuXkJ29_WnZNcM3ag',

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