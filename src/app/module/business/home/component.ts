// file: src/app/module/business/home/component.ts
import { JsonPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { ContextProfileService } from '@libs/context-profile/service';
import { SignoutRoute } from '@module/shared/onboarding/signout/route';
import { HomeService } from './service';
import { HOME_PROVIDER } from './provider';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        //JsonPipe,

        RouterModule,
        TranslocoModule,

        MatButtonModule,
        MatIconModule,
    ],
    providers: [
        HOME_PROVIDER,
    ],
})
export class HomeComponent implements OnInit {
    protected readonly service = inject(HomeService);

    public readonly ctxp = inject(ContextProfileService);

    // template facing aliases, the values themselves live in the module state and service
    protected readonly dbVersion = this.service.state.dbVersion;
    protected readonly brandLogoSrc = this.service.brandLogoSrc;
    protected readonly navigationActions = this.service.genNavigationActions();
    protected readonly SignoutRoute = SignoutRoute;

    public async ngOnInit(): Promise<void> {
        await this.service.loadDbVersion();
    }
}
