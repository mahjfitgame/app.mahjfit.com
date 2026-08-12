// file: src/app/module/shared/onboarding/forgot-password/component.ts
import { KeyValuePipe } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CRUD_PROVIDER } from 'src/app/base/crud/provider';
import { NotifyBannerComponent } from 'src/app/base/notify-banner/component';
import { ForgotPasswordService } from './service';
import { FORGOT_PASSWORD_PROVIDER } from './provider';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: 'template.html',
  styleUrl: 'style.scss',
  imports: [
    //JsonPipe,
    //KeyValuePipe,
    RouterModule,
    
    //CdkPortal,
    //AuthAreaLayoutDirective,

    MatCardModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatSelectModule,
    
    FormField,
    
    TranslocoModule,

    NotifyBannerComponent,
    
  ],
  providers: [
    CRUD_PROVIDER,

    FORGOT_PASSWORD_PROVIDER,
  ],
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    protected readonly service = inject(ForgotPasswordService);
    
    constructor() {}

    public async ngOnInit(): Promise<void> {
      this.service.initI18n();
    }
    public async ngAfterViewInit(): Promise<void> {}
    public async ngAfterViewChecked(): Promise<void> {}
    public async ngOnDestroy(): Promise<void> {}
}
