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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJNUSIsInVzZXJuYW1lIjoibWFoamZpdCIsImVtYWlsIjoibWFoamZpdGdhbWVAZ21haWwuY29tIiwicm9sZV9pZCI6MCwidHlwZSI6ImFjY2Vzc190b2tlbiIsImlhdCI6MTc4MzUwMjI4MywiZXhwIjoxNzgzNTg4NjgzLCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.TAxNa7udlYJVMe-CFfBOReYYCbAHql4aXxkpbDAg46qMlWHP-NN_XTMpaADZ_7CIkZSO76V_6GnQOtm_Z-sHuLNcRtQxb-DCqxeCZ8S8QgIL5aJMAx1I3hzeUC8kI7fGwx_TPqM3HzPp7xhR8yVIXPgQ-BQ6DdQJCaCtuXAg4NIyX0q5SmIaYfvr1UZqwdq2gg4sjNrtYKAJ1hkAQ9Umlkwr9Y0B3syCh5PvHJK6Rshq42Lthg2s13cQlgl7XQ2KruAdeWX6I7Y5HENEcyqH-BONXAfYwRzjvRkGEBe9ibzG1jqG-1ZsHWKZKDUFM-x5uUOJLkGYoHSWZOUKTjatdw',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJNUSIsInVzZXJuYW1lIjoibWFoamZpdCIsImVtYWlsIjoibWFoamZpdGdhbWVAZ21haWwuY29tIiwicm9sZV9pZCI6MCwidHlwZSI6InJlZnJlc2hfdG9rZW4iLCJpYXQiOjE3ODM1MDIyODMsImV4cCI6MTc4NDEwNzA4MywiYXVkIjoiQXBwbGljYXRpb24iLCJpc3MiOiJUSEFUU0VORCJ9.DRFOYeb6huxNZYyrYSx4N3Iz8JTkCJSIyttxbmUwumFPof6Zhj4xztcvg3CrSdyv95B58qBKSfvcCahFECdK1ni3MxL0Cw3RN15lhKlpDCrA4mI4nwrz9AsfkVLWqKNI7PcdZ04_53Gtdrk_qhjgLajKvf2Zl8lFaWsHbCn7EVhOpFRDSqt1Bp6Mlm0YUtXi9xO4MsS8AUZAo8FaQ8NbWSbS1d98jaGEO5Dw3hpIYSaeDDXpx5YKNw8aFAaM5M09k-66d_Iz_bxpaocHr-AGS0xE441516v9TBTct64zN3Ysi9q-iVKoSfDRcxj2d0b0cZD-jEISuKmNpncbwx54GA',
    
    //BFW_API_SDK_GRAPHQL_URL: 'http://localhost:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://localhost:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://localhost:20150',

    //BFW_API_SDK_GRAPHQL_URL: 'http://0.0.0.0:20147/graphql',
    //BFW_API_SDK_REST_URL: 'http://0.0.0.0:20152/rest',
    //BFW_API_SDK_WS_URL: 'http://0.0.0.0:20150',
    
    /* BFW_API_SDK_GRAPHQL_URL: 'https://192.168.0.230:20147/graphql',
    BFW_API_SDK_REST_URL: 'https://192.168.0.230:20152/rest',
    BFW_API_SDK_WS_URL: 'https://192.168.0.230:20150', */

    BFW_API_SDK_GRAPHQL_URL: 'https://api-mahjfit-com.thatsend.dev/graphql',
    BFW_API_SDK_REST_URL: 'https://api-mahjfit-com.thatsend.dev/rest',
    BFW_API_SDK_WS_URL: 'https:/https://api-mahjfit-com.thatsend.dev',
};
export const environment: any = {...defaultEnvironment, ...debugEnvironment};