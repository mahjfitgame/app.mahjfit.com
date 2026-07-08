// file: app/base/theme/component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '@base/theme/service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme',
  standalone: true,
  imports: [
    FormsModule,
  ],
  providers: [],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class ThemeComponent implements OnInit, OnDestroy {
    public readonly service = inject(ThemeService)
    constructor() {}
    public async ngOnInit() {}
    public async ngOnDestroy() {}
}