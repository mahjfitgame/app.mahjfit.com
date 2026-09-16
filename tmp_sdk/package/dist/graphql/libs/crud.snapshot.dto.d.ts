declare class SnapshotListDto {
    message?: string[];
    result?: string[];
    imp?: string[];
    mismatch?: string[];
    notFound?: string[];
    conflict?: string[];
    success?: string[];
    error?: string[];
    alert?: string[];
    warning?: string[];
    notice?: string[];
    info?: string[];
}
declare class SnapshotListSelectionSchema {
    message?: boolean;
    result?: boolean;
    imp?: boolean;
    mismatch?: boolean;
    notFound?: boolean;
    conflict?: boolean;
    success?: boolean;
    error?: boolean;
    alert?: boolean;
    warning?: boolean;
    notice?: boolean;
    info?: boolean;
}
declare class CrudSnapshotDto {
    snapshot?: SnapshotListDto;
}
declare class CrudSnapshotSelectionSchema {
    snapshot?: typeof SnapshotListSelectionSchema | SnapshotListSelectionSchema | false;
}

export { CrudSnapshotDto, CrudSnapshotSelectionSchema, SnapshotListDto, SnapshotListSelectionSchema };
