declare class UploadFileAccessUrlDto {
    direct?: string | null;
    secure?: string | null;
    thumb?: string | null;
}
declare class UploadFileAccessUrlSelectionSchema {
    direct?: boolean;
    secure?: boolean;
    thumb?: boolean;
}

export { UploadFileAccessUrlDto, UploadFileAccessUrlSelectionSchema };
