// file: src/app/base/notify-banner/component.ts
import { Component, inject } from '@angular/core';
import { NotifyBannerService } from '@base/notify-banner/service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-notify-banner',
  standalone: true,
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  imports: [MatIconModule, MatButtonModule, NgClass],
})
export class NotifyBannerComponent {
  protected service = inject(NotifyBannerService);
}
