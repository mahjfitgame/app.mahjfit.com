// file: src/app/module/shared/preboarding/recover-password/component.ts

import { Component, inject, OnInit } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CRUD_PROVIDER } from '@base/crud/provider';
import { NotifyBannerComponent } from '@base/notify-banner/component';
import { RecoverPasswordService } from './service';
import { RECOVER_PASSWORD_PROVIDER } from './provider';

@Component({
    selector: 'app-recover-password',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        FormField,
        TranslocoModule,
        NotifyBannerComponent,
    ],
    providers: [
        CRUD_PROVIDER,
        RECOVER_PASSWORD_PROVIDER,
    ],
})
export class RecoverPasswordComponent implements OnInit {
    protected readonly service = inject(RecoverPasswordService);

    public ngOnInit(): void {
        this.service.initRouteToken();
    }
}
