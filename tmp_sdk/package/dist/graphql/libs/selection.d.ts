type SchemaClass<T = any> = new () => T;
type SchemaFactory<T = any> = () => SchemaClass<T>;
declare class SchemaRef<T = any> {
    readonly factory: SchemaFactory<T>;
    constructor(factory: SchemaFactory<T>);
}
declare function schemaRef<T = any>(factory: SchemaFactory<T>): SchemaRef<T>;
declare function buildSelectionSetFromSchema<TSelection extends object, TSchema extends SchemaClass>(selection: TSelection, schemaClass: TSchema, opts?: {
    maxDepth?: number;
}): string;

export { type SchemaClass, type SchemaFactory, SchemaRef, buildSelectionSetFromSchema, schemaRef };
