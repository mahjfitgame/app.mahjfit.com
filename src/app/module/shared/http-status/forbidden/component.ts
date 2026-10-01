// file: src/app/module/shared/http-status/forbidden/component.ts

import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { HttpStatusForbiddenService } from './service';
import { HTTP_STATUS_FORBIDDEN_PROVIDER } from './provider';

@Component({
    selector: 'forbidden-component',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        RouterModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
    ],
    providers: [
        HTTP_STATUS_FORBIDDEN_PROVIDER,
    ],
})
export class HttpStatusForbiddenComponent implements OnInit {
    protected readonly service = inject(HttpStatusForbiddenService);

    public ngOnInit(): void {}
}