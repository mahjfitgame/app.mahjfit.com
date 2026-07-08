// file: ./src/app/base/internationalization/component.ts

import { Component, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

import { I18nService } from '@base/internationalization/service';
import { I18nLanguageEnum } from '@base/internationalization/enum';

@Component({
  selector: 'app-internationalization',
  standalone: true,
  imports: [NgClass, TranslocoModule],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class InternationalizationComponent implements OnInit {
  public readonly service = inject(I18nService);

  public ngOnInit(): void {
    this.service.initI18n();
  }
  public changeLanguage(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as I18nLanguageEnum;
    this.service.use(value);
  }

  public isActive(lang: I18nLanguageEnum): boolean {
    return this.service.currentLang() === lang;
  }
}
