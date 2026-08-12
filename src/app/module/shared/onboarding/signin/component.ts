// file: src/app/module/shared/onboarding/signin/component.ts
import { AfterViewChecked, AfterViewInit, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { JsonPipe, KeyValuePipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { FormField } from '@angular/forms/signals';
import { CdkPortal } from "@angular/cdk/portal";
import { AuthAreaLayoutDirective } from "@area/auth/directive";
import { SigninService } from "@module/shared/onboarding/signin/service";
import { TranslocoModule } from "@jsverse/transloco";
import { CRUD_PROVIDER } from "@base/crud/provider";
import { NotifyBannerComponent } from "@base/notify-banner/component";
import { SIGNIN_PROVIDER } from "./provider";

@Component({
  selector: 'app-signin',
  standalone: true,
  templateUrl: 'template.html',
  styleUrl: 'style.scss',
  imports: [
    //JsonPipe,
    KeyValuePipe,
    RouterModule,
    
    //CdkPortal,
    //AuthAreaLayoutDirective,

    MatCardModule, 
    MatInputModule, 
    MatCheckboxModule, 
    MatGridListModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatRippleModule,
    MatRadioModule,
    
    FormField,
    
    TranslocoModule,

    NotifyBannerComponent,
    
  ],
  providers: [
    CRUD_PROVIDER,

    SIGNIN_PROVIDER,
  ],
})
export class SigninComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    protected readonly service = inject(SigninService);
    
    constructor() {}

    public async ngOnInit(): Promise<void> {
      this.service.initI18n();
    }
    public async ngAfterViewInit(): Promise<void> {}
    public async ngAfterViewChecked(): Promise<void> {}
    public async ngOnDestroy(): Promise<void> {}
}
