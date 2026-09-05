// file: src/app/area/protected/type.ts

/**
 * @ProtectedAreaModuleInfoType
 * what a module publishes into the shell's header through
 * FoundationModuleServiceType.setModuleInfo()
 *
 * ⚠ structurally identical to PrivateAreaModuleInfoType on purpose: a module
 * moved between the two areas changes the service it injects, never its payload
 */
export interface ProtectedAreaModuleInfoType {
    icon: string | null,
    url: string | null,
    title: string | null,
    hint: string | null,
    i18n: null | {
        title: string | null,
        hint: string | null
    }
}
