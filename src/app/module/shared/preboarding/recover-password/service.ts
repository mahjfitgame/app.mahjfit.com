// file: src/app/module/shared/preboarding/recover-password/service.ts

import { inject, Service } from '@angular/core';
import { BfwApiSdkError } from '@bfw/api-sdk/core';
import { UserAuthentication } from '@bfw/api-sdk/graphql/endpoints/shared';
import { FoundationModuleServiceType } from '@libs/foundation/module/type';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { LogService } from '@libs/log/service';
import { SigninRoute } from '../signin/route';
import { GlobalProgressBarService } from '@base/global-progress-bar/service';
import { I18nService } from '@base/internationalization/service';
import { NotifyBannerService } from '@base/notify-banner/service';
import { HttpStatusNotFoundRoute } from '@module/shared/http-status/not-found/route';
import { PREBOARDING_RECOVERPASSWORD_I18N_KEY } from './const';
import { RecoverPasswordState } from './state';
import { RecoverPasswordRoute } from './route';

@Service({ autoProvided: false })
export class RecoverPasswordService implements FoundationModuleServiceType {
    public readonly SigninRoute = SigninRoute;

    public readonly route = inject(RecoverPasswordRoute);
    public readonly state = inject(RecoverPasswordState);

    public readonly gpbs = inject(GlobalProgressBarService);
    private readonly api = inject(BfwApiService);
    private readonly i18n = inject(I18nService);
    private readonly log = inject(LogService);
    private readonly notifyBanner = inject(NotifyBannerService);

    constructor() {
        // █████ FoundationModuleServiceType
        // load this module's translations first, before any label can render.
        // constructor, not component ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();

        this.api.sdk.graphql.initialize(UserAuthentication);
    }

    public initI18n(): void {
        this.i18n.useModule(PREBOARDING_RECOVERPASSWORD_I18N_KEY);
    }

    public initRouteToken(): void {
        const token = this.route.paramPublicid();

        if (!token) {
            void this.route.router.navigateByUrl(HttpStatusNotFoundRoute.absolutePath(), { replaceUrl: true });
            return;
        }

        // if password recovery token found in url query params then show in text area
        const passRecoverToken = this.route.queryParamPassRecoverToken();
        if (passRecoverToken) {
            this.state.updateMutationFormModel({
                pass_recover_token: passRecoverToken,
            });
        }
    }

    public setModuleInfo(): void {}

    public alterBreadcrumb(): void {}

    public fieldErrorMessage(fieldState: { errors?: () => Array<{ message?: string }> }): string | null {
        return fieldState.errors?.()?.[0]?.message ?? null;
    }

    public toggleHidePassword(): void {
        this.state.setHidePassword(!this.state.hidePassword());
    }

    public toggleHidePasswordConfirm(): void {
        this.state.setHidePasswordConfirm(!this.state.hidePasswordConfirm());
    }

    public preventClipboardAction(event: Event): void {
        event.preventDefault();
    }

    public async onSubmit(): Promise<void> {
        if (this.state.mutationFormProcessing()) {
            return;
        }

        const mutationForm = this.state.mutationForm;
        mutationForm().markAsTouched();

        if (mutationForm().invalid()) {
            return;
        }

        
        this.gpbs.start();
        this.state.setMutationFormProcessing(this.gpbs.processing);
        this.notifyBanner.state.clearAlert();

        try {
            this.gpbs.stream = 30;

            const http = await this.api.sdk.graphql.userAuthentication.recoverForgotPassword({
                input: {
                    un_pe_pm: mutationForm.un_pe_pm().value(),
                    identify: mutationForm.identify().value(),
                    identify_confirm: mutationForm.identify_confirm().value(),
                    pass_recover_token: mutationForm.pass_recover_token().value(),
                },
                selection: {
                    affected: true,
                    snapshot: {
                        success: true,
                        message: true,
                        error: true,
                        alert: true,
                    },
                },
            });

            this.gpbs.stream = 80;
            const response = http.data;
            const succeeded = (response.affected ?? 0) > 0 || Boolean(response.snapshot?.success?.length);

            if (!succeeded) {
                const message = response.snapshot?.error?.[0]
                    ?? response.snapshot?.alert?.[0]
                    ?? this.i18n.translate('PREBOARDING_RECOVERPASSWORD.MESSAGE.ERROR');
                this.notifyBanner.error(message);
                return;
            }

            const message = response.snapshot?.success?.[0]
                ?? response.snapshot?.message?.[0]
                ?? this.i18n.translate('PREBOARDING_RECOVERPASSWORD.MESSAGE.SUCCESS');
            this.notifyBanner.success(message);
            
            // as success need to reset the form
            this.state.resetMutationForm();
            
            this.gpbs.stream = 90;
        } catch (error: unknown) {
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? error.message
                : error instanceof Error
                    ? error.message
                    : this.i18n.translate('PREBOARDING_RECOVERPASSWORD.MESSAGE.ERROR');

            this.log.error('[RecoverPasswordService] password recovery failed', error);
            this.notifyBanner.error(message);
        } finally {
            this.gpbs.stream = 100;
            this.gpbs.stop();
            this.state.setMutationFormProcessing(this.gpbs.processing);
        }
    }
}
