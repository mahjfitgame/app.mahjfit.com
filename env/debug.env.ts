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

    BFW_API_SDK_JWT_ACCESS_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF2MSJ9.eyJzdWIiOiJkakV1UzFFME1UTndPRFF6Y2s5b05tUnlWaTVXUW5Sc1ozUjRUemRWUVM5aUwxVjFjR3haU2pGQlBUMHVXVkU5UFEiLCJ1IjoiZGpFdVdtUXpiWGg2TDJwSVRXZEhWREJ4Umk0eFIxRmFlbEE1TDBVMFpqTlpZbFJHVEdzek5XZEJQVDB1VEVGelkzRmxla3RqZHowOSIsImUiOiJkakV1TW1KVWJUWmphRGxGZVhRMFRESldNUzVZZUdFdmNFdzBTeTgzTVUwelVYWmFhMjlXY1VaQlBUMHVhVWRyVmtoTFEyb3plbk5ZUjBGaGRrNHhhMWd6YVVwWFpWRktUQSIsInIiOiJkakV1ZUZoQk1tWlhORmR0TW01V05TdG1VaTVyTnk5MVdGRlVjMUp3UVZvNGNtRkxLMXBtVEd0QlBUMHVSRkU5UFEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg2NDMyNTQ2LCJleHAiOjE3ODY1MTg5NDYsImF1ZCI6IkFwcGxpY2F0aW9uIiwiaXNzIjoiVEhBVFNFTkQifQ.eDUZIlej0Zj4P-mlh8rVzSJOwITK6I8srZqMmuzMwVAyUGzFNSDChHNPdatBSJXl9u1rVmyuXjAitFUVR-YpxX5jH3MEuMXoEpAQRSYEowUCMQGAgyPdDkeWDpShCbmzLeRQ7gQje2p46tCLogEUXXhJMo8VCzA3qpXXoSSDK_1rXG8pHwwl7SDpv3mzDCuP2XlDzoBBvrXsPJEQzpBSelklKCVFYLcljR1vs7KFaZi9fFJSvTlGHfB3tm9KUYXM9KBsr5-E1b2pXbjJryoXhuTB62Apj50h6s82J0kqbwNFoqK3scLTfmCU256_HeWO44bMjpwCdAZICacpDYP_Zg',
    BFW_API_SDK_JWT_REFRESH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJ2MSJ9.eyJzdWIiOiJkakV1UzFFME1UTndPRFF6Y2s5b05tUnlWaTVXUW5Sc1ozUjRUemRWUVM5aUwxVjFjR3haU2pGQlBUMHVXVkU5UFEiLCJ1IjoiZGpFdVdtUXpiWGg2TDJwSVRXZEhWREJ4Umk0eFIxRmFlbEE1TDBVMFpqTlpZbFJHVEdzek5XZEJQVDB1VEVGelkzRmxla3RqZHowOSIsImUiOiJkakV1TW1KVWJUWmphRGxGZVhRMFRESldNUzVZZUdFdmNFdzBTeTgzTVUwelVYWmFhMjlXY1VaQlBUMHVhVWRyVmtoTFEyb3plbk5ZUjBGaGRrNHhhMWd6YVVwWFpWRktUQSIsInIiOiJkakV1ZUZoQk1tWlhORmR0TW01V05TdG1VaTVyTnk5MVdGRlVjMUp3UVZvNGNtRkxLMXBtVEd0QlBUMHVSRkU5UFEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjQzMjU0NiwiZXhwIjoxNzg3MDM3MzQ2LCJhdWQiOiJBcHBsaWNhdGlvbiIsImlzcyI6IlRIQVRTRU5EIn0.iys87HoVTpM982PM-IC6noTge0as46QazI-MyQcsjoMXR6QQYU1lZNnwKNtjWz7Vg8WynUbYkmpQwb4iDNI8b6n_3Km3l4TaEun59RHljAb2K9K1NfqGPQpa2kNHWrXOHHklfD1WyKriZqiMnfCuOkODJy2YskrhXidT7HAPDKXQScH_Rbot5pwI9tb8UW6fbqjOLBqRFGn69-xLCjBHAp2hKDBwS652-idRp8MTZJmwLYLxpByNRrWo9zUDOkFEwQsSGTrd2zDbXX2yNtByZ5qACa3Ewuw59Cysg7QPyCUPWSwsOVlAB0Sr8cjYCV2MCQRncBwKh9NRd_aZOkkuKg',

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
export const environment: any = { ...defaultEnvironment, ...debugEnvironment };