// file: ./src/app/module/shared/onboarding/signout/component.ts
import { AfterViewChecked, AfterViewInit, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { JsonPipe, KeyValuePipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { Router, RouterModule } from "@angular/router";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { CdkPortal } from "@angular/cdk/portal";
import { AuthAreaLayoutDirective } from "@area/auth/directive";
import { TranslocoModule } from "@jsverse/transloco";
import { URL_PROVIDER } from "@libs/url/provider";
import { NotifyBannerComponent } from "@base/notify-banner/component";
import { SignoutService } from "./service";
import { SignoutState } from "./state";
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-signout',
  standalone: true,
  templateUrl: 'template.html',
  styleUrl: 'style.scss',
  imports: [
    JsonPipe,
    //KeyValuePipe,
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
    TranslocoModule,
    NotifyBannerComponent,
    MatDivider
],
  providers: [
    SignoutState,
    SignoutService,
  ],
})
export class SignoutComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    private router = inject(Router);
    protected readonly service = inject(SignoutService);
    
    constructor() {}

    public async ngOnInit(): Promise<void> {
      this.service.initI18n();
    }
    public async ngAfterViewInit(): Promise<void> {}
    public async ngAfterViewChecked(): Promise<void> {}
    public async ngOnDestroy(): Promise<void> {}
}