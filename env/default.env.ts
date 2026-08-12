// file: ./env/default.env.ts
export const defaultEnvironment: any = {

  // ████ SYNC all below with █ main .env █ file located at root █ ./env/.env ███████████████████████████████

  // Environment
  NODE_ENV: 'production',

  // General
  DEBUG: false,
  TZ: 'US/Eastern',
  PROJECT_NAME: 'bfw.nestjs.microservice.api/web',
  GRAPHQL_ROOT_SLUG: 'graphql',
  LANGUAGE_CODE: 'en-US',

  // All app host domain list
  APP_HOST_DOMAIN_TLD_LABEL_COUNT: 1, // 1 = .com, 2 = .com.br kind of, for main app domain
  APP_HOST_GRAPHQL_DOMAIN: 'http://localhost:20147', // GRAPHQL APP gateway supergraph microservice
  APP_HOST_WEBSOCKET_DOMAIN: 'ws://localhost:20150', // WEBSOCKET app
  APP_HOST_REST_DOMAIN: 'http://localhost:20152', // REST app
  APP_HOST_WEB_DOMAIN: 'http://localhost:20153', // WEB app
  APP_HOST_AI_DOMAIN: 'http://localhost:20156', // Python AI app
  APP_HOST_WEBSITE_DOMAIN: 'http://localhost:20154', // Frontend Website
  APP_HOST_BACKOFFICE_WEB_DOMAIN: 'http://localhost:20155', // Frontend BACKOFFICE

  APP_LISTEN_HOST: 'localhost',
  APP_LISTEN_PORT: 20180,

  WEBSITE_SERVER_SIDE_LOG_URL_PATH: '/wlog/webiste',
  BACKOFFICE_SERVER_SIDE_LOG_URL_PATH: '/wlog/backoffice',

  // File upload
  MAX_FILE_SIZE: 20971520, // in bytes (20 * 1024 * 1024) = 20 mb
  MAX_FILES: 10,

  // common secret, salt an iv
  COMMON_SECRET: 'AD2A9F143EB457C72059F5097E9BA07E41EB0F2F8B7CF2734283655BFA9FDD73',
  COMMON_SALT: '37A6C7AFA29CAB98',
  COMMON_IV: '74D5350D1A4A49374FF38661F1064A9A',

  // Data format
  FORMAT_DATE_TIME: 'd MMM yyyy hh:mm:ss aaa',
  FORMAT_DATE: 'd MMM yyyy',
  FORMAT_TIME: 'hh:mm aaa',
  FORMAT_MONTH_YEAR: 'MMM yyyy',

  FORMAT_DATE_TIME_OBJ: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  },
  FORMAT_DATE_OBJ: {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  },
  FORMAT_TIME_OBJ: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  },
  FORMAT_MONTH_YEAR_OBJ: {
    month: 'short',
    year: 'numeric'
  },

  // Pagination
  NUM_OF_RECORDS_PER_PAGE: 5,

  // File Format
  FILE_FORMAT_IMAGE: ['jpeg', 'jpg', 'png', 'svg', 'gif'],
  FILE_FORMAT_DOC: ['csv', 'doc', 'docx', 'pdf', 'xsl', 'xslx', 'odt', 'ods', 'txt', 'ppt', 'pptx', 'keynote', 'number'],
  FILE_FORMAT_AUDIO: ['mp3', 'wav', 'ogg'],
  FILE_FORMAT_VIDEO: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv'],
  FILE_FORMAT_OTHER: ['json', 'xml', 'zip', 'rar', '7z', 'apk', 'ipa', 'exe'],
  VALID_FILE_MIME_TYPE: [
    'image/jpeg',         // jpeg, jpg
    'image/jpg',         // jpeg, jpg
    'image/png',          // png
    'image/svg+xml',      // svg
    'image/gif',          // gif
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/pdf',    // pdf
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.oasis.opendocument.text', // odt
    'application/vnd.oasis.opendocument.spreadsheet', // ods
    'text/plain',         // txt
    'text/csv',           // csv
    'application/json',   // json
    'application/xml',    // xml
    'application/octet-stream', // number (generic binary file)
    'application/vnd.ms-powerpoint', // ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.apple.keynote', // keynote
    'application/zip',    // zip
    'application/x-rar-compressed', // rar
    'application/x-7z-compressed',  // 7z
    'video/mp4',          // mp4
    'video/x-matroska',   // mkv
    'video/x-msvideo',    // avi
    'video/quicktime',    // mov
    'video/x-ms-wmv',     // wmv
    'video/x-flv',        // flv
    'audio/mpeg',         // mp3
    'audio/wav',          // wav
    'audio/ogg',          // ogg
    'application/vnd.android.package-archive', // apk
    'application/vnd.iphone', // ipa
    'application/x-msdownload' // exe
  ],

  // ████ INDEPENDENT env variables for this web app ████████████████████████████████████████████████████████

  // BFW API SDK configuration
  BFW_API_SDK_SIGNIN_USERNAME: '',
  BFW_API_SDK_SIGNIN_IDENTIFY: '',
  BFW_API_SDK_JWT_ACCESS_TOKEN: '',
  BFW_API_SDK_JWT_REFRESH_TOKEN: '',
  BFW_API_SDK_GRAPHQL_URL: '',
  BFW_API_SDK_REST_URL: '',
  BFW_API_SDK_WS_URL: '',
}