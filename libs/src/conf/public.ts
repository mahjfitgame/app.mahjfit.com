export class ConfPublic {
  // ████████████████████████████████████████████████████████████████████████████████████████████████████████
  // ████ PUBLIC █ env variables not in env.ts file █████████████████████████████████████████████████████████
  // ████ PUBLIC █ SYNC █ all below with █ main .env █ file located at root █ ./env/.env ████████████████████
  
  // App version
  public APP_VERSION: string = '1.0.0';

  // Environment
  public NODE_ENV: string = 'production';

  // General
  public DEBUG: boolean = false;
  public ENABLE_LOCAL_DB: boolean = true;
  public TZ: string =  'US/Eastern';
  public PROJECT_NAME: string = 'bfw.nestjs.microservice.api/web';
  public GRAPHQL_ROOT_SLUG: string = 'graphql';
  public LANGUAGE_CODE: string =  'en-US';

  // All app host domain list
  public APP_HOST_DOMAIN_TLD_LABEL_COUNT: number = 1; // 1 = .com, 2 = .com.br kind of, for main app domain
  public APP_HOST_GRAPHQL_DOMAIN: string =  'http://localhost:20147'; // GRAPHQL APP gateway supergraph microservice port
  public APP_HOST_WEBSOCKET_DOMAIN: string =  'ws://localhost:20150'; // WEBSOCKET app port
  public APP_HOST_REST_DOMAIN: string = 'http://localhost:20152'; // REST app port
  public APP_HOST_WEB_DOMAIN: string = 'http://localhost:20153'; // WEB app port
  public APP_HOST_AI_DOMAIN: string = 'http://localhost:20156'; // Python AI app port
  public APP_HOST_WEBSITE_DOMAIN: string = 'http://localhost:20154'; // Frontend Website port
  public APP_HOST_BACKOFFICE_WEB_DOMAIN: string = 'http://localhost:20155'; // Frontend BACKOFFICE port

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

  // File Format ({ extension: mime type })
  public FILE_FORMAT_IMAGE: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    webp: 'image/webp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
  };
  public FILE_FORMAT_DOC: Record<string, string> = {
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    txt: 'text/plain',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    keynote: 'application/vnd.apple.keynote',
    number: 'application/octet-stream',
    pages: 'application/vnd.apple.pages',
  };
  public FILE_FORMAT_AUDIO: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
  };
  public FILE_FORMAT_VIDEO: Record<string, string> = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
  };
  public FILE_FORMAT_CODE: Record<string, string> = {
    json: 'application/json',
    xml: 'application/xml',
  };
  public FILE_FORMAT_EXECUTABLE: Record<string, string> = {
    apk: 'application/vnd.android.package-archive',
    ipa: 'application/vnd.iphone',
    exe: 'application/x-msdownload',
    dmg: 'application/x-apple-diskimage',
    msi: 'application/x-msi',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar.gz': 'application/gzip',
    dll: 'application/x-msdownload',
    sys: 'application/octet-stream',
    ini: 'text/plain',
    inf: 'text/plain',
    sh: 'application/x-sh',
    bat: 'application/x-bat',
    cmd: 'application/x-bat',
  };
  public FILE_FORMAT_GRAPHICS: Record<string, string> = {
    psd: 'image/vnd.adobe.photoshop',
    ai: 'application/postscript',
    eps: 'application/postscript',
    indd: 'application/x-indesign',
    cdr: 'application/x-cdr',
  };
  public FILE_FORMAT_CAD: Record<string, string> = {
    stl: 'model/stl',
    obj: 'model/obj',
    fbx: 'application/octet-stream',
    gltf: 'model/gltf+json',
    step: 'model/step',
    dwg: 'image/vnd.dwg',
  };

  
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
