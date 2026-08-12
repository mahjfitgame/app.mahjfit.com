// file: ./src/app/module/shared/http-status/not-found/component.ts

import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { HttpStatusNotFoundService } from './service';
import { HTTP_STATUS_NOT_FOUND_PROVIDER } from './provider';

@Component({
    selector: 'app-not-found',
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
        HTTP_STATUS_NOT_FOUND_PROVIDER,
    ],
})
export class HttpStatusNotFoundComponent implements OnInit {
    protected readonly service = inject(HttpStatusNotFoundService);

    public ngOnInit(): void {
        this.service.initI18n();
    }
}
