// file: libs/src/context-profile/type.ts

import type { JwtPayload } from "jwt-decode";

export interface ContextProfileSessionPayload extends JwtPayload {
    kl?: boolean;
}
export interface ContextProfileStatefulInfo {
    user: {
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
        user_defined_id?: string | null,
        user_defined_name?: string | null,
    },
    authorisation: {
        role_title?: string | null,
    },
    device: {
        name?: string | null,
        interface?: string | null,
        os?: string | null,
    }
}