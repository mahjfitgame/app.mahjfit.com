// file: libs/src/print/enum.ts
/** What PrintService was asked to print — used for log messages only. */
export enum PrintSourceEnum {
    ELEMENT = 'element',
    HTML = 'html',
    PAGE = 'page',
    PDF = 'pdf',
    FILE = 'file',
    BASE64 = 'base64',
};
