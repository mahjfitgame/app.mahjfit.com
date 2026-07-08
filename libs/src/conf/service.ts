import { Injectable } from "@angular/core";
import * as cnfconst from './const';
import { ConfPublic } from "./public";
import { ConfPrivate } from "./private";
import { CONF } from "./setting";

@Injectable({providedIn: 'root'})
export class ConfService {
    private _conf: ConfPublic & ConfPrivate;

    constructor(){
        this._conf = CONF;
    }
    
 
    // ███ PRIVATE CONFIG ████████████████████████████████████████████████████
    


    // ████ PUBLIC █ SYNC ████████████████████████████████████████████████████
    public get env(): string {
        return this._conf.NODE_ENV;
    }
    public get isDebugEnv(): boolean {
        return this.env === cnfconst.NODE_ENV_DEBUG;
    }
    public get isDevelopmentEnv(): boolean {
        return this.env === cnfconst.NODE_ENV_DEVELOPMENT;
    }
    public get isProductionEnv(): boolean {
        return this.env === cnfconst.NODE_ENV_PRODUCTION;
    }
    public get tz(): string {
        return this._conf.TZ;
    }
    public get projectName(): string {
        return this._conf.PROJECT_NAME;
    }
    public get graphqlRootSlug(): string {
        return this._conf.GRAPHQL_ROOT_SLUG;
    }
    public get languageCode(): string {
        return this._conf.LANGUAGE_CODE;
    }
    public get appHostGraphQLDomain(): string {
        return this._conf.APP_HOST_GRAPHQL_DOMAIN;
    }
    public get appHostWebsocketDomain(): string {
        return this._conf.APP_HOST_WEBSOCKET_DOMAIN;
    }
    public get appHostRestDomain(): string {
        return this._conf.APP_HOST_REST_DOMAIN;
    }
    public get appHostWebDomain(): string {
        return this._conf.APP_HOST_WEB_DOMAIN;
    }
    public get appHostAiDomain(): string {
        return this._conf.APP_HOST_AI_DOMAIN;
    }
    public get appListenHost(): string {
        return this._conf.APP_LISTEN_HOST;
    }
    public get appListenPort(): number {
        return this._conf.APP_LISTEN_PORT;
    }
    public get websiteServerSideLogUrlPath(): string {
        return this._conf.WEBSITE_SERVER_SIDE_LOG_URL_PATH;
    }
    public get websiteServerSideLogUrl(): string {
        return `${this.appHostRestDomain}${this.websiteServerSideLogUrlPath}`;
    }
    public get backofficeServerSideLogUrlPath(): string {
        return this._conf.BACKOFFICE_SERVER_SIDE_LOG_URL_PATH;
    }
    public get backofficeServerSideLogUrl(): string {
        return `${this.bfwApiSdkRestUrl}${this.backofficeServerSideLogUrlPath}`;
    }
    public get maxFileSize(): number {
        return this._conf.MAX_FILE_SIZE;
    }
    public get maxFiles(): number {
        return this._conf.MAX_FILES;
    }
    public get commonSecret(): string {
        return this._conf.COMMON_SECRET;
    }
    public get commonSalt(): string {
        return this._conf.COMMON_SALT;
    }
    public get commonIv(): string {
        return this._conf.COMMON_IV;
    }
    public get formatDate(): string {
        return this._conf.FORMAT_DATE;
    }
    public get formatDateTime(): string {
        return this._conf.FORMAT_DATE_TIME;
    }
    public get formatTime(): string {
        return this._conf.FORMAT_TIME;
    }
    public get formatMonthYear(): string {
        return this._conf.FORMAT_MONTH_YEAR;
    }
    public get formatDateTimeObj(): object {
        return this._conf.FORMAT_DATE_TIME_OBJ;
    }
    public get formatDateObj(): object {
        return this._conf.FORMAT_DATE_OBJ;
    }
    public get formatTimeObj(): object {
        return this._conf.FORMAT_TIME_OBJ;
    }
    public get formatMonthYearObj(): object {
        return this._conf.FORMAT_MONTH_YEAR_OBJ;
    }
    public get numOfRecordsPerPage(): number {
        return this._conf.NUM_OF_RECORDS_PER_PAGE;
    }
    public get fileFormatImage(): string[] {
        return this._conf.FILE_FORMAT_IMAGE;
    }
    public get fileFormatDoc(): string[] {
        return this._conf.FILE_FORMAT_DOC;
    }
    public get fileFormatAudio(): string[] {
        return this._conf.FILE_FORMAT_AUDIO;
    }
    public get fileFormatVideo(): string[] {
        return this._conf.FILE_FORMAT_VIDEO;
    }
    public get fileFormatOther(): string[] {
        return this._conf.FILE_FORMAT_OTHER;
    }
    public get validFileMimeType(): string[] {
        return this._conf.VALID_FILE_MIME_TYPE;
    }

    // ████ PUBLIC █ INDEPENDENT █████████████████████████████████████████████

    public get bfwApiSdkJwtAccessToken(): string {
        return this._conf.BFW_API_SDK_JWT_ACCESS_TOKEN;
    }
    public get bfwApiSdkJwtRefreshToken(): string {
        return this._conf.BFW_API_SDK_JWT_REFRESH_TOKEN;
    }
    public get bfwApiSdkGraphqlUrl(): string {
        return this._conf.BFW_API_SDK_GRAPHQL_URL;
    }
    public get bfwApiSdkRestUrl(): string {
        return this._conf.BFW_API_SDK_REST_URL;
    }
    public get bfwApiSdkWsUrl(): string {
        return this._conf.BFW_API_SDK_WS_URL;
    }


    // PUSH NOTIFICATION AND FIREBASE 
    public get enableWebPush(): boolean {
        return this._conf.ENABLE_WEB_PUSH;
    }

    public get firebaseWebApiKey(): string {
        return this._conf.FIREBASE_WEB_API_KEY;
    }

    public get firebaseWebAuthDomain(): string {
        return this._conf.FIREBASE_WEB_AUTH_DOMAIN;
    }
    
    public get firebaseWebProjectId(): string {
        return this._conf.FIREBASE_WEB_PROJECT_ID;
    }

    public get firebaseWebStorageBucket(): string {
        return this._conf.FIREBASE_WEB_STORAGE_BUCKET;
    }

    public get firebaseWebMessagingSenderId(): string {
        return this._conf.FIREBASE_WEB_MESSAGING_SENDER_ID;
    }

    public get firebaseWebAppId(): string {
        return this._conf.FIREBASE_WEB_APP_ID;
    }

    public get firebaseWebMeasurementId(): string {
        return this._conf.FIREBASE_WEB_MEASUREMENT_ID;
    }

    public get firebaseWebVapidKey(): string {
        return this._conf.FIREBASE_WEB_VAPID_KEY;
    }

    public get pushNotificationSwPath(): string {
        return this._conf.FIREBASE_PUSH_NOTIFICATION_SW_PATH;
    }
    
}