// file: libs/src/context-profile/type.ts
import { DateTime } from "@bfw/api-sdk/graphql/libs/crud.scalar";
import type { JwtPayload } from "jwt-decode";

// here (sub) is already part of JwtPayload — no need to add in any of artifacts here
export interface ContextProfileStatefulPayload extends JwtPayload {
    kl?: boolean;
}
export interface ContextProfileStatefulInfo {
    user: {
        keyid?: string | null,
        fname?: string | null,
        mname?: string | null,
        lname?: string | null,
        url_slug?: string | null,
        username?: string | null,
        primary_email?: string | null,
        primary_mobile?: string | null,
        primary_mobile_cc?: string | null,
        whatsapp?: string | null,
        whatsapp_cc?: string | null,
        file_profile_banner_url?: {
            direct?: string | null,
            secure?: string | null,
            thumb?: string | null
        },
        file_profile_photo_url?: {
            direct?: string | null,
            secure?: string | null,
            thumb?: string | null
        }
    },
    udevice: {
        keyid?: string | null,
        user_defined_id?: string | null,
        user_defined_name?: string | null,
    },
    device: {
        keyid?: string | null,
        name?: string | null,
        interface?: string | null,
        os?: string | null,
    },
    session: {
        keyid?: string | null,
        logged_in?: DateTime | Date | null,
        keep_logged?: DateTime | Date | null,
    }
}
export interface ContextProfileAuthorisationRole {
    keyid?: string | null;
    role_title?: string | null;
}
export interface ContextProfileUauthorisation {
    keyid?: string | null;
    arole_id?: string | null;
    fr_authorisation_role?: ContextProfileAuthorisationRole | null;
}
export interface ContextProfilePrivilegePayload extends JwtPayload {
    rt?: string | null; // role title
}