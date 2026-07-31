export class ConfPublic {
  // ████████████████████████████████████████████████████████████████████████████████████████████████████████
  // ████ PUBLIC █ env variables not in env.ts file █████████████████████████████████████████████████████████
  // ████ PUBLIC █ SYNC █ all below with █ main .env █ file located at root █ ./env/.env ████████████████████
  
  // Environment
  public NODE_ENV: string = 'production';

  // General
  public DEBUG: boolean = false;
  public TZ: string =  'US/Eastern';
  public PROJECT_NAME: string = 'bfw.nestjs.microservice.api/web';
  public GRAPHQL_ROOT_SLUG: string = 'graphql';
  public LANGUAGE_CODE: string =  'en-US';

  // All app host domain list
  public APP_HOST_GRAPHQL_DOMAIN: string =  'http://localhost:20147'; // GRAPHQL APP gateway supergraph microservice port
  public APP_HOST_WEBSOCKET_DOMAIN: string =  'ws://localhost:20150'; // WEBSOCKET app port
  public APP_HOST_REST_DOMAIN: string = 'http://localhost:20152'; // REST app port
  public APP_HOST_WEB_DOMAIN: string = 'http://localhost:20153'; // WEB app port
  public APP_HOST_AI_DOMAIN: string = 'http://localhost:20156'; // Python AI app port

  public APP_LISTEN_HOST: string = 'localhost';
  public APP_LISTEN_PORT: number = 20155;

  public WEBSITE_SERVER_SIDE_LOG_URL_PATH: string = '/wlog/webiste';
  public BACKOFFICE_SERVER_SIDE_LOG_URL_PATH: string = '/wlog/backoffice';
  
  // File upload
  public MAX_FILE_SIZE: number = 20971520; // in bytes (20 * 1024 * 1024) = 20 mb
  public MAX_FILES: number = 10;

  // common secret, salt an iv
  public COMMON_SECRET: string = 'AD2A9F143EB457C72059F5097E9BA07E41EB0F2F8B7CF2734283655BFA9FDD73';
  public COMMON_SALT: string = '37A6C7AFA29CAB98';
  public COMMON_IV: string = '74D5350D1A4A49374FF38661F1064A9A';

  // Data format
  public FORMAT_DATE_TIME: string = 'd MMM yyyy hh:mm:ss aaa';
  public FORMAT_DATE: string = 'd MMM yyyy';
  public FORMAT_TIME: string = 'hh:mm:ss aaa';
  public FORMAT_MONTH_YEAR = 'MMM yyyy';

  public FORMAT_DATE_TIME_OBJ: object = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  };
  public FORMAT_DATE_OBJ: object = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  public FORMAT_TIME_OBJ: object = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  };
  public FORMAT_MONTH_YEAR_OBJ: object = { 
    month: 'short', 
    year: 'numeric' 
  };

  // Pagination
  public NUM_OF_RECORDS_PER_PAGE: number = 25;

  // File Format
  public FILE_FORMAT_IMAGE: string[] = ['jpeg', 'jpg', 'png', 'svg', 'gif'];
  public FILE_FORMAT_DOC: string[] = ['csv', 'doc', 'docx', 'pdf', 'xsl', 'xslx', 'odt', 'ods', 'txt', 'ppt', 'pptx', 'keynote', 'number'];
  public FILE_FORMAT_AUDIO: string[] = ['mp3', 'wav', 'ogg'];
  public FILE_FORMAT_VIDEO: string[] = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv'];
  public FILE_FORMAT_OTHER: string[] = ['csv', 'json', 'xml', 'number', 'zip', 'rar', '7z', 'apk', 'ipa', 'exe'];
  public VALID_FILE_MIME_TYPE: string[] = [
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
  ];

  
  // ████ PUBLIC █ INDEPENDENT █ env variables for this web app █████████████████████████████████████████████
  // Thats End API access
  public BFW_API_SDK_SIGNIN_USERNAME: string = '';
  public BFW_API_SDK_SIGNIN_IDENTIFY: string = '';
  public BFW_API_SDK_JWT_ACCESS_TOKEN: string = '';
  public BFW_API_SDK_JWT_REFRESH_TOKEN: string = '';
  public BFW_API_SDK_GRAPHQL_URL: string = '';
  public BFW_API_SDK_REST_URL: string = '';
  public BFW_API_SDK_WS_URL: string = '';

  // NOTIFICATION AND FIREBASE
  public ENABLE_WEB_PUSH: boolean = false;
  public FIREBASE_WEB_API_KEY: string = '';
  public FIREBASE_WEB_AUTH_DOMAIN: string = '';
  public FIREBASE_WEB_PROJECT_ID: string = '';
  public FIREBASE_WEB_STORAGE_BUCKET: string = '';
  public FIREBASE_WEB_MESSAGING_SENDER_ID: string = '';
  public FIREBASE_WEB_APP_ID: string = '';
  public FIREBASE_WEB_MEASUREMENT_ID: string = '';
  public FIREBASE_WEB_VAPID_KEY: string = '';
  public FIREBASE_PUSH_NOTIFICATION_SW_PATH: string = '';
}