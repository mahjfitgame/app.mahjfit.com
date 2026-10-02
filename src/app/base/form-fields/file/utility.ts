import { Service } from '@angular/core';
import {
    FileMediaDimensionLimitType,
    FileMediaDimensionResultType,
    FileMediaDimensionType,
    FileExtensionMimeMapType,
    FileKindTypeEnum,
} from '@base/form-fields/file/type';

/**
 * Framework-light, root-provided (@Service(), not autoProvided:false): stateless
 * decode/validate logic for files, reachable from both @base/crud (which owns
 * these methods today) and @base/form-fields (which may never import crud).
 * Same tier as ConfService / SignatureService / DateTimeService.
 */
@Service()
export class FormFieldFileUtility {

    /**
     * A caller's allowed-extension value is either one of conf's FILE_FORMAT_*
     * maps ({ extension: mime type }) or, for a custom list, a plain array -
     * accept either shape.
     */
    public getAllowedFileExtensions(value: unknown): string[] {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') return Object.keys(value);
        return [];
    }

    public hasAllowedExtension(fileName: string, allowedExtensions: string[]): boolean {
        // suffix match (not a split on the last dot) so a compound extension
        // like FILE_FORMAT_EXECUTABLE's 'tar.gz' matches too
        const lowerFileName = fileName.toLowerCase();

        return allowedExtensions.some((extension) => {
            return lowerFileName.endsWith(`.${extension.toLowerCase()}`);
        });
    }

    /** A { extension: mime } map's VALUES double as the mime whitelist. */
    public getAllowedMimeTypes(value: unknown): string[] {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.values(value as Record<string, string>);
        }
        return [];
    }

    /**
     * Browser-reported mime type check, on top of the extension check - catches a
     * renamed-extension file the OS still sniffs as its real type. Not a substitute
     * for server-side content (magic-byte) validation: a caller can set File.type
     * to whatever it wants via the File constructor / Blob, so this is a UX guard,
     * not a security boundary.
     */
    public hasAllowedMimeType(value: unknown, allowedMimeTypes: string[]): boolean {
        if (allowedMimeTypes.length === 0) return true;
        if (!(value instanceof File) || !value.type) return true;

        return allowedMimeTypes.includes(value.type);
    }

    /** FILE_SIZE's `value` is a plain byte count; anything else is not configured. */
    public getMaxFileSize(value: unknown): number | null {
        const size = Number(value);
        return Number.isFinite(size) && size > 0 ? size : null;
    }

    /** MAX_FILES's `value` is a positive whole count; anything else is not configured. */
    public getMaxFiles(value: unknown): number | null {
        const count = Number(value);
        return Number.isInteger(count) && count > 0 ? count : null;
    }

    /**
     * A multiple-file value holds File[]; any single value (File or a persisted
     * filename string) counts as one; blank counts as none. (Inlines the blank
     * check instead of calling crud's CrudUtility.isValidationEmpty - this module
     * must not depend on crud - but is behaviourally identical: an empty array
     * already returns 0 through the .length branch below.)
     */
    public countFiles(value: unknown): number {
        if (value === null || value === undefined || value === '') return 0;
        return Array.isArray(value) ? value.length : 1;
    }

    /** bytes -> a short human-readable size, e.g. for a {{max_size}} message placeholder. */
    public formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        const rounded = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
        return `${rounded} ${units[unitIndex]}`;
    }

    /** The picked file(s)' own size, e.g. for a {{current_size}} message placeholder. */
    public formatCurrentFileSize(value: unknown): string | undefined {
        const files = (Array.isArray(value) ? value : [value]).filter((item): item is File => item instanceof File);
        const sizes = files.map((file) => this.formatFileSize(file.size));

        return sizes.length > 0 ? sizes.join(', ') : undefined;
    }

    /** Which of the two format maps the file's extension belongs to - independent of any allow-list rule. */
    public getFileKind(
        fileName: string,
        imageFormat: FileExtensionMimeMapType,
        videoFormat: FileExtensionMimeMapType,
    ): FileKindTypeEnum | null {
        if (!fileName) return null;
        if (this.hasAllowedExtension(fileName, this.getAllowedFileExtensions(imageFormat))) return FileKindTypeEnum.IMAGE;
        if (this.hasAllowedExtension(fileName, this.getAllowedFileExtensions(videoFormat))) return FileKindTypeEnum.VIDEO;
        return FileKindTypeEnum.FILE;
    }

    public readImageDimensions(file: File): Promise<FileMediaDimensionType | null> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
            img.src = url;
        });
    }

    /**
     * Some browsers (Safari in particular) never fire loadedmetadata/error on a
     * <video> that isn't attached to the DOM - unlike Image, which decodes fine
     * detached - so this one is inserted (hidden) for the duration of the load.
     */
    public readVideoDimensions(file: File): Promise<FileMediaDimensionType | null> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.style.display = 'none';

            let timeoutId: any;

            const settle = (result: FileMediaDimensionType | null) => {
                clearTimeout(timeoutId);
                URL.revokeObjectURL(url);
                video.remove();
                resolve(result);
            };

            // an unsupported/corrupt codec can leave a browser firing neither event -
            // don't leave a caller stuck pending forever, settle as undecodable instead.
            timeoutId = setTimeout(() => settle(null), 8000);

            video.onloadedmetadata = () => settle({ width: video.videoWidth, height: video.videoHeight });
            video.onerror = () => settle(null);

            document.body.appendChild(video);
            video.src = url;
        });
    }

    /** Kind classification + dimension dispatch. Callers that want a decode cache (crud does) keep it themselves. */
    public async readMediaDimensions(
        file: File,
        fileName: string,
        imageFormat: FileExtensionMimeMapType,
        videoFormat: FileExtensionMimeMapType,
    ): Promise<FileMediaDimensionResultType> {
        const kind = this.getFileKind(fileName, imageFormat, videoFormat);
        if (kind !== FileKindTypeEnum.IMAGE && kind !== FileKindTypeEnum.VIDEO) {
            return { status: 'unsupported' };
        }

        const dim = kind === FileKindTypeEnum.IMAGE ? await this.readImageDimensions(file) : await this.readVideoDimensions(file);
        if (!dim) return { status: 'undecodable' };

        return { status: 'ok', ...dim };
    }

    /**
     * Per axis: an exact value wins outright; otherwise `_from`/`_to` are
     * independent min/max bounds, either of which may be omitted.
     */
    public isMediaDimensionValid(dim: FileMediaDimensionType, rule: FileMediaDimensionLimitType | null | undefined): boolean {
        if (!rule || typeof rule !== 'object') return true;

        const axisValid = (actual: number, exact?: number, from?: number, to?: number): boolean => {
            if (exact !== undefined && exact !== null) return actual === exact;
            if (from !== undefined && from !== null && actual < from) return false;
            if (to !== undefined && to !== null && actual > to) return false;
            return true;
        };

        return axisValid(dim.width, rule.width, rule.width_from, rule.width_to)
            && axisValid(dim.height, rule.height, rule.height_from, rule.height_to);
    }

    /** A dimension rule turned into a human-readable spec, e.g. for a {{dimension}} message placeholder. */
    public formatMediaDimensionRule(rule: FileMediaDimensionLimitType | null | undefined): string {
        if (!rule || typeof rule !== 'object') return '';

        const axis = (label: string, exact?: number, from?: number, to?: number): string | null => {
            if (exact !== undefined && exact !== null) return `${label} ${exact}px`;
            if (from !== undefined && from !== null && to !== undefined && to !== null) return `${label} ${from}-${to}px`;
            if (from !== undefined && from !== null) return `${label} min ${from}px`;
            if (to !== undefined && to !== null) return `${label} max ${to}px`;
            return null;
        };

        return [
            axis('width', rule.width, rule.width_from, rule.width_to),
            axis('height', rule.height, rule.height_from, rule.height_to),
        ].filter((part): part is string => !!part).join(', ');
    }

    /**
     * Middle-truncated file name, e.g. for a FILE download cell. The EXTENSION is
     * what tells the user what the file is, so it is never what gets cut - only
     * the base name loses its middle. A name already short enough comes back
     * untouched. `head`/`tail` are the caller's own config (crud's
     * CRUD_FIELD_FILE_NAME_TRUNCATE today).
     */
    public truncateFileName(fileName: string, head: number, tail: number): string {
        const name = fileName.trim();
        if (!name) return '';

        const dot = name.lastIndexOf('.');
        const ext = dot > 0 ? name.slice(dot) : '';
        const base = dot > 0 ? name.slice(0, dot) : name;

        return base.length > head + tail + 1
            ? `${base.slice(0, head)}…${base.slice(-tail)}${ext}`
            : name;
    }

    /**
     * Initials drawn in place of a missing image, from a free-text source
     * (a name, username, email, ...). No source = '' = draw nothing - NOT a
     * copy of ContextProfileState.user_monogram_avatar's Math.random() fallback,
     * which would answer differently on every change detection.
     */
    public getInitialsMonogram(source: string): string {
        const trimmed = source.trim();
        if (!trimmed) return '';

        const parts = trimmed.split(/[\s._@-]+/).filter(Boolean);
        const initials = parts.length > 1
            ? parts[0][0] + parts[1][0]
            : trimmed.slice(0, 2);

        return initials.toUpperCase();
    }
}
