// file: ./src/app/module/shared/onboarding/forgot-password/component.ts
import { Component } from '@angular/core';
import { ForgotPasswordService } from '@module/shared/onboarding/forgot-password/service';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-signup',
  templateUrl: './template.html',
  styleUrl: './style.scss',
  providers: [ForgotPasswordService],
})
export class ForgotPasswordComponent {}
