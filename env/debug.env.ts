// ./env/debug.env.ts
import { defaultEnvironment } from "./default.env";
const debugEnvironment: any = {
    NODE_ENV: 'debug',

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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'yJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJNUSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImluZm9AdGhhdHNlbmQuY29tIiwicm9sZV9pZCI6MSwidHlwZSI6ImFjY2Vzc190b2tlbiIsImlhdCI6MTc4MzQ4NTQwNiwiZXhwIjoxNzgzNTcxODA2LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.TfrkEN1xADiiq7YXTEoZvc0SMAOlXpjPGIxAjwLwCA8Fz460crPmGsgBaZHv8HDR6BgyLmAh9i5MqLEftQGDld2soaCMQBCPVT2qZgB_Q_TvKpLCWED7_eE5qGFH522JlIEHi1914_dAXxiWCbEV0tArvJP5OfogJxQ1vIKJ1pgwLAFOVZCz7If5ZFGBTTgYD9cBtQMVaDVGRTpr6Z1pOTzB2isntvU2C4bEu9_HaqB0Pg8xuMLlG13J2KhbEkFMsgJ0TNfCtURQg4dSrWYkz3qIiUAz14bopRbuHfgOncBu8x9X6PgmC2T6IOV9MoJ0WACi52h-dPVB0eeNPpa94g',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJNUSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImluZm9AdGhhdHNlbmQuY29tIiwicm9sZV9pZCI6MSwidHlwZSI6InJlZnJlc2hfdG9rZW4iLCJpYXQiOjE3ODM0ODU0MDYsImV4cCI6MTc4NDA5MDIwNiwiYXVkIjoiQXBwbGljYXRpb24iLCJpc3MiOiJUSEFUU0VORCJ9.i6BEx-_6vZHdLryEc9AJYj3xFWfXsPQSxYG-VtnGDNU2V1JiA0RMH1UlTtbOPqiqAcN-vohgcUGmNzrmxmade9HmnmhDcpxdGnh9J7e27XIPUfZchmrmp_DiBove75LwumPMcr4zot5xhdvRaBhetbKGV9a1a7ombhicDtl4xmEkBRxJ-QwxK1Fzv0g2kXevYZac2wCHAg5AhS9WLSCqov0FZcSZGkdN31izRKfLkGMNXyG9OSc2oDbbmAFUO66g30oD6PRO_3SyYglQsZpTuvJBy03uLW0AwQDwaZKmHgVsrXeGD7HZe-E4VEdenX3gVF_E3MrJfv1LiwD2bNtA9Q',
    
    //BFW_API_SDK_GRAPHQL_URL: 'http://localhost:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://localhost:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://localhost:20150',

    //BFW_API_SDK_GRAPHQL_URL: 'http://0.0.0.0:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://0.0.0.0:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://0.0.0.0:20150',
    
    /* BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.230:20147/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.230:20152/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.230:20150', */

    BFW_API_SDK_GRAPHQL_URL: 'https://bfw-nestjs-microservice-api.thatsend.app/graphql',
    BFW_API_SDK_REST_URL: 'https://bfw-nestjs-microservice-api.thatsend.app/rest',
    BFW_API_SDK_WS_URL: 'https://bfw-nestjs-microservice-ws.thatsend.app',
};
export const environment: any = {...defaultEnvironment, ...debugEnvironment};