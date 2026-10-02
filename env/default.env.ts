// file: ./env/default.env.ts
export const defaultEnvironment: any = {

  // ████ SYNC all below with █ main .env █ file located at root █ ./env/.env ███████████████████████████████

  // Environment
  NODE_ENV: 'production',

  // General
  DEBUG: false,
  ENABLE_LOCAL_DB: false,
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

  // File Format ({ extension: mime type })
  FILE_FORMAT_IMAGE: {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    webp: 'image/webp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    ico: 'image/vnd.microsoft.icon',
    bmp: 'image/bmp',
    apng: 'image/apng',
    avif: 'image/avif',
    heic: 'image/heic',
    heics: 'image/heic-sequence',
    heif: 'image/heif',
    heifs: 'image/heif-sequence',
  },
  FILE_FORMAT_DOC: {
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
  },
  FILE_FORMAT_AUDIO: {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
  },
  FILE_FORMAT_VIDEO: {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
  },
  FILE_FORMAT_CODE: {
    json: 'application/json',
    xml: 'application/xml',
  },
  FILE_FORMAT_EXECUTABLE: {
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
  },
  FILE_FORMAT_GRAPHICS: {
    psd: 'image/vnd.adobe.photoshop',
    ai: 'application/postscript',
    eps: 'application/postscript',
    indd: 'application/x-indesign',
    cdr: 'application/x-cdr',
  },
  FILE_FORMAT_CAD: {
    stl: 'model/stl',
    obj: 'model/obj',
    fbx: 'application/octet-stream',
    gltf: 'model/gltf+json',
    step: 'model/step',
    dwg: 'image/vnd.dwg',
  },

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
