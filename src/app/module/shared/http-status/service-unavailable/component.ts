// file: src/app/module/shared/http-status/service-unavailable/component.ts

import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { HttpStatusServiceUnavailableService } from './service';
import { HTTP_STATUS_SERVICE_UNAVAILABLE_PROVIDER } from './provider';

@Component({
    selector: 'app-service-unavailable',
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
        HTTP_STATUS_SERVICE_UNAVAILABLE_PROVIDER,
    ],
})
export class HttpStatusServiceUnavailableComponent implements OnInit {
    protected readonly service = inject(HttpStatusServiceUnavailableService);

    public ngOnInit(): void {}
}
