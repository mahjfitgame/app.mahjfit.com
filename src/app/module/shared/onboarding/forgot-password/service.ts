// file: ./src/app/module/shared/onboarding/forgot-password/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SLUG_AUTH_AREA } from "@area/auth/slug";
import { SLUG_FORGOT_PASSWORD } from "@module/shared/onboarding/forgot-password/slug";

@Service({ autoProvided: false })
export class ForgotPasswordService {
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    constructor() {
    }

    /**
         * @param params An object like { ':id': 123, ':service': 'Ho' }
         * @returns A clean string
         */
        public static authUrlPath(/*id: number, service: string*/): string {
            // 1. Join the parent and child slugs
            let fullPath = [SLUG_AUTH_AREA, SLUG_FORGOT_PASSWORD].join('/');
    
            // 2. Replace placeholders with actual values, all parameters stay in service only
            const params: Record<string, string | number> = {
                /*
                ':id': 123, 
                ':service': 'Ho'
                */
            };
            Object.entries(params).forEach(([key, value]) => {
                fullPath = fullPath.replace(key, value.toString());
            });
    
            return '/' + fullPath;
        }
        public static authRouterLink(/*id: number, service: string*/): string[] {
            let fullPath = this.authUrlPath(/*id, service*/);
            
            // 3. Clean up and convert to array
            // Splits by '/', removes empty strings, and removes leftover placeholders
            const segments = fullPath.split('/') // removes empty strings
                .filter(seg => seg && !seg.startsWith(':'));
    
            return ['/', ...segments];
        }
}