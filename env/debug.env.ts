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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1UkhONE0wOURSRmxZTjFocWFpOUtVeTV2TTBWSlMzaGFhbWhoTWpOd1JuaFpiR1J1ZGpGM1BUMHVhRkU5UFEiLCJ1IjoiZGpFdVN6RjZPVVZJYkhrMlV6SXlTRGg0Wmk1VE4xRmtZVWRUY3pjd1VWZDVTa2RhYlVKVFdYSm5QVDB1V2t0alEwbG9NVEJXUVQwOSIsImUiOiJkakV1U1V0V1FVSlVkRVozTkc1TWQxTmFkaTVIVG1SV2RHMDVPWGhDUjNKUldHOU5hRzlpV1dKM1BUMHVOakF3ZWxaTVMzSnZaVUZrTmtoRllteHVjRGxxWnk5Nlp6aHdadyIsInIiOiJkakV1TkdGV1ZWVkhlR2c0UTJWU2MyOXBVaTVKYjBWUlNYSTFSbmRYZEZKR1FqUk9aamt4YzNSUlBUMHVTbmM5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyMDQwMzQ4LCJleHAiOjE3OTIxMjY3NDgsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.XyJcwXGrAMf819DpRNmW2iksfIswBIt-cHT_pzU02N0O6WKqKPzGXN8CTWzbSyRwPjfKiExIIqknCLBnsBncOFkkTi06Yk_sj3VgOUZn-hlSNfPiFjGAFOVH0gcm9Na7N5ffpsNKHX-e1jZ4il-nxXXJ6LECfB6rQ-AeEmnTecyhJ-Vn6LDLvD3oAh4LgEIYWw1uO1QOChZ_0QJJFTTtYT742Yrz5ZV4DzejlfFcQS8rtKL9_K3-HHhbGmR8farJo2FpoGHm9e__2JPIGkjyGy6GXJFNLHME7DpZOKat_nXycu6NlxNmrgw4xPTawHnypOs8gEDKatftyL-PHV6HWg',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1UkhONE0wOURSRmxZTjFocWFpOUtVeTV2TTBWSlMzaGFhbWhoTWpOd1JuaFpiR1J1ZGpGM1BUMHVhRkU5UFEiLCJ1IjoiZGpFdVN6RjZPVVZJYkhrMlV6SXlTRGg0Wmk1VE4xRmtZVWRUY3pjd1VWZDVTa2RhYlVKVFdYSm5QVDB1V2t0alEwbG9NVEJXUVQwOSIsImUiOiJkakV1U1V0V1FVSlVkRVozTkc1TWQxTmFkaTVIVG1SV2RHMDVPWGhDUjNKUldHOU5hRzlpV1dKM1BUMHVOakF3ZWxaTVMzSnZaVUZrTmtoRllteHVjRGxxWnk5Nlp6aHdadyIsInIiOiJkakV1TkdGV1ZWVkhlR2c0UTJWU2MyOXBVaTVKYjBWUlNYSTFSbmRYZEZKR1FqUk9aamt4YzNSUlBUMHVTbmM5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5MjA0MDM0OCwiZXhwIjoxNzkyNjQ1MTQ4LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.jt50g23t2lKRAgUkl6b1rcYX-fHsqxzqvGOLygir9bbu9e9rvipZ4a7ltZ5fhVzoKh8AW3xtRWAM49c4GXYavLFFV1nzTCK_Ja_d77ChUkV6NnYkj0-75WVzHZkYjqtRUe4VvSxtKaiZOt5po75JSgyE8ul2Mq7KtqKrMCaDkv6ru-b2xcWVpk_en4aoEIZawK9Dd6mhTrQyMtA5H0nKJ7VuOiUo-8A02--wdl1ntz0X-TqoyJCoJV6zV3KX3JD7c50MmdloLlfGOF4Pp8RfOox7y8KCDGu2dXP7zRvyI6PcrAxkpzmpl6VzLp7XgaPM5RHj8FZ8q9vaxnGobEyCqA',

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

    /*  BFW_API_SDK_GRAPHQL_URL: 'https://api-mahjfit-com.thatsend.dev/graphql',
     BFW_API_SDK_REST_URL: 'https://api-mahjfit-com.thatsend.dev/rest',
     BFW_API_SDK_WS_URL: 'https://ws-mahjfit-com.thatsend.dev', */
};
export const environment: any = { ...defaultEnvironment, ...debugEnvironment };