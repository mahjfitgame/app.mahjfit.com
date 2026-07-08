// ./env/development.env.ts
import { defaultEnvironment } from "./default.env";
const developmentEnvironment: any = {
    NODE_ENV: 'development',

    BFW_API_SDK_GRAPHQL_URL: 'https://bfw-nestjs-microservice-api.thatsend.app/graphql',
    BFW_API_SDK_REST_URL: 'https://bfw-nestjs-microservice-api.thatsend.app/rest',
    BFW_API_SDK_WS_URL: 'https://bfw-nestjs-microservice-ws.thatsend.app',
};
export const environment: any = {...defaultEnvironment, ...developmentEnvironment};