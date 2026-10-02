/**
 * A persisted file's access-url variants (@bfw/api-sdk UploadFileAccessUrlDto).
 * The canonical shape - @base/crud/type's CrudFieldFileShapeType and
 * @base/form-fields/file/type's FormFieldFileAccessUrlType both alias this
 * instead of redeclaring it, since both used to carry their own byte-identical
 * copy purely because of the form-fields -> crud layering rule.
 */
export interface FileAccessUrlType {
    thumb: string;
    direct: string;
    secure: string;
}

export interface FileMediaDimensionType {
    width: number;
    height: number;
}

/**
 * Outcome of decoding one file's pixel dimensions:
 * - 'unsupported': the file's extension isn't in the image/video format map passed in
 * - 'undecodable': it looked like an image/video but the browser couldn't read it
 * - 'ok': dimensions were read successfully
 */
export type FileMediaDimensionResultType =
    | ({ status: 'ok' } & FileMediaDimensionType)
    | { status: 'unsupported' }
    | { status: 'undecodable' };

/**
 * Per axis: an exact value wins outright; otherwise `_from`/`_to` are
 * independent min/max bounds, either of which may be omitted.
 */
export interface FileMediaDimensionLimitType {
    width?: number;
    height?: number;
    width_from?: number;
    width_to?: number;
    height_from?: number;
    height_to?: number;
}

/** Describes conf's FILE_FORMAT_* shape ({ extension: mime type }) without importing ConfService. */
export type FileExtensionMimeMapType = Record<string, string>;

export enum FileKindTypeEnum {
    IMAGE = 'image',
    VIDEO = 'video',
    FILE = 'file'
}
