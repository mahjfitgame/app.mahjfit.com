import { BreakpointSizeEnum } from '@libs/breakpoint/enum';

/**
 * A persisted file's access-url variants (@bfw/api-sdk UploadFileAccessUrlDto).
 * The canonical shape - @base/crud/type's CrudFieldFileShapeType and
 * @base/form-fields/file/type's FormFieldFileAccessUrlType both alias this
 * instead of redeclaring it, since both used to carry their own byte-identical
 * copy purely because of the form-fields -> crud layering rule.
 */
export interface FileAccessUrlType {
    /** Small, listing-sized image. The listing draws this one, always. */
    thumb: string;

    /** Full-size public url. */
    direct: string;

    /** Full-size signed / access-controlled url. */
    secure: string;
}

/**
 * SLIDESHOW options for a file field's image preview.
 *
 * The object's PRESENCE is the opt-in - a null/absent value is off, `{}` is on
 * at the default size, and there is no `enabled` flag to write. So every member
 * here describes only HOW the viewer behaves, which is what keeps it extensible:
 * a further option (loop, autoplay, …) is a plain member rather than another
 * `slideshow_*` key flattened onto a neighbour.
 *
 * ⚠ note the asymmetry that follows from that: the object's presence turns the
 * VIEWER on, while each capability INSIDE it is its own member and defaults
 * OFF - see [print] below. "Is there a lightbox" and "may it reach a printer"
 * are not one question.
 *
 * The canonical declaration, same stance as FileAccessUrlType above:
 * @base/crud/type's CrudFieldSlideshowType aliases THIS instead of carrying a
 * second structurally-identical copy, and declaring it here creates no
 * form-fields -> crud edge.
 */
export interface FileSlideshowType {
    /**
     * size: BreakpointSizeEnum
     * The dialog size the slideshow OPENS at. Unset = FULL.
     *
     * The viewer's own toolbar menu can still move to any other size afterwards
     * - this only decides where it starts, so a module showing small avatars can
     * open at MD instead of taking over the screen.
     */
    size?: BreakpointSizeEnum;

    /**
     * print: boolean
     * Draw the viewer's PRINT button, which prints the ACTIVE slide only, one
     * image to a page. Unset = off, the same stance as the viewer's own
     * showDownload: handing the original picture to a printer is opted INTO.
     *
     * ⚠ NOT a literal `true` in a module - it carries whether that module was
     * assigned the PRINT action:
     *
     *     print: XRoute.hasPermittedAction(FoundationActionEnum.PRINT)
     *
     * ⚠ and the gate has to live HERE rather than in the openers, because
     * FormFieldFileRegularService is one of the three readers and
     * @base/form-fields may never import crud - so it can never reach
     * CrudActionState.hasPrint(). Putting the answer in this object is what
     * keeps all three readers honouring one declaration.
     *
     * ⚠ therefore a SNAPSHOT of that intersection, taken when the module's
     * state is constructed. @see FoundationModuleRoute.permittedActions().
     */
    print?: boolean;
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
