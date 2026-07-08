// file: app/base/notification/component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '@base/notification/service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  providers: [],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class NotificationComponent implements OnInit, OnDestroy {
    public readonly service = inject(NotificationService)
    constructor() {}
    public async ngOnInit() {}
    public async ngOnDestroy() {}
}