// ./src/app/module/shared/onboarding/my-profile/component.ts
import { Component, inject, OnInit } from "@angular/core";
import { MyProfileService } from "@module/shared/onboarding/my-profile/service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { JsonPipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { StateExample } from "@libs/signal-state/example/state";
import { ServiceExample } from "@libs/signal-state/example/service";
import { TranslocoModule } from "@jsverse/transloco";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
@Component({
  selector: 'app-my-profile',
  standalone: true,
  templateUrl: 'template.html',
  styleUrl: 'style.scss',
  imports: [
    JsonPipe,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslocoModule
  ],
  providers: [
    MyProfileService,

    StateExample,
    ServiceExample
  ],
})
export class MyProfileComponent implements OnInit {
    protected readonly service = inject(MyProfileService);
    
    constructor() {
    
    }

    public async ngOnInit(): Promise<void> {
      this.service.initI18n();
    }
}