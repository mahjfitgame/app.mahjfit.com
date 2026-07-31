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
    APP_LISTEN_HOST: '0.0.0.0',

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1ZVhaUWRsVjVSa05rZEhGdFYzTkJReTVNWTI5cWJtMUJRMkY0UWtKcVpESlJVbE5qZHpGblBUMHVlR2M5UFEiLCJ1IjoiZGpFdWRtbzVSSEZhTUZaRVoxcDBUMmxMTHk1V1lWbDBPRmR3ZDI5MFkxTXZURmRsV0haaU4zQjNQVDB1Y1VodVFsaFJUVmRqUVQwOSIsImUiOiJkakV1WjFOWk5HaHBLMlp2WlRkdFVsTXlReTVzU0hGSE5taEhaM2RqZVZwSk1UVlRjMjE1UjNaM1BUMHVhVk15SzNNemNVbERSV2hwWmxZMGRUazJkVXA0Ym1SMlptVmFhQSIsInIiOiJkakV1ZG1FNVRtMHZORzFsZFdkVlJYbDZNeTQwTUc1NlRGaFVXVU5IYmxSQmRFSTVlVTFQVDJGUlBUMHVlbWM5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg1MzAwOTI0LCJleHAiOjE3ODUzODczMjQsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.KDSh7tHEOjYze1f_qgpIjyJvbl-ddY0MaX0vLLjyEyhKOKv87UVMwpq6o2BrpIpnZ1Bl7NZvp4MozhPE3eWfDiE1GZpHp17xbuc4eQTT78C9QJD4hEGtoFngOssI_51aLdr6N0Z3Y_ircR6hgsGQV4Lym_O5tdRlwszCaPqq6ZNhvrTuzKfzTc_mIDLYDEqMNoLHdGUFpK9J878UJH8i-pdNJRNacZrEBMwTwY49qBwvx9kOFcLPCU87JmuWGa74DsvZFZexlo76fg44_ugYJqzdtktS48FsDDH2ZG1n9Tna0urwu5ExzncFaOzJuwOagE1jFw3iaBmU4eNE3ukQMQ',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1ZVhaUWRsVjVSa05rZEhGdFYzTkJReTVNWTI5cWJtMUJRMkY0UWtKcVpESlJVbE5qZHpGblBUMHVlR2M5UFEiLCJ1IjoiZGpFdWRtbzVSSEZhTUZaRVoxcDBUMmxMTHk1V1lWbDBPRmR3ZDI5MFkxTXZURmRsV0haaU4zQjNQVDB1Y1VodVFsaFJUVmRqUVQwOSIsImUiOiJkakV1WjFOWk5HaHBLMlp2WlRkdFVsTXlReTVzU0hGSE5taEhaM2RqZVZwSk1UVlRjMjE1UjNaM1BUMHVhVk15SzNNemNVbERSV2hwWmxZMGRUazJkVXA0Ym1SMlptVmFhQSIsInIiOiJkakV1ZG1FNVRtMHZORzFsZFdkVlJYbDZNeTQwTUc1NlRGaFVXVU5IYmxSQmRFSTVlVTFQVDJGUlBUMHVlbWM5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NTMwMDkyNCwiZXhwIjoxNzg1OTA1NzI0LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.ck8xH-1Q1brm6oqYQKgOgNChhXC8CruiAcHinauCMfv4muMF4imBrj_d2UrCIcG4KEtGmn0tInaRyFZG0o0m_Jloxj6BPEe_fsOIKC8EDMt8byCwEHDtZBGc-wMF1GFFIN1sDa_hZKnvV1NHgxEHShAJnpDOE3BzV8mP7FSOufUWof2JZaLSDCDPbmyqf9Ga1himG7xtvPGGlMJQ5hZrKkHQc8WHaNnA1F3qiaP0pxCB4RK6tL8AvmVearWGPz6kBbFK6EjCU33uONTSP92tSDvYGPcTVk5xqRJvq6BWeEgMOFUaEE619MTPlLX8u3Dw1YIAXZPYf1fk4wurJlGjcg',
    
    //BFW_API_SDK_GRAPHQL_URL: 'http://localhost:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://localhost:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://localhost:20150',

    //BFW_API_SDK_GRAPHQL_URL: 'http://0.0.0.0:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://0.0.0.0:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://0.0.0.0:20150',
    
    /* BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.230:20147/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.230:20152/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.230:20150', */

    BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.200:20178/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.200:20178/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.200:20179',

    /* BFW_API_SDK_GRAPHQL_URL: 'https://api-mahjfit-com.thatsend.dev/graphql',
    BFW_API_SDK_REST_URL: 'https://api-mahjfit-com.thatsend.dev/rest',
    BFW_API_SDK_WS_URL: 'https:/https://api-mahjfit-com.thatsend.dev', */
};
export const environment: any = {...defaultEnvironment, ...debugEnvironment};