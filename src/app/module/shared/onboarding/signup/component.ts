// file: ./src/app/module/shared/onboarding/signup/component.ts
import { Component } from '@angular/core';
import { SignupService } from '@module/shared/onboarding/signup/service';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-signup',
  templateUrl: './template.html',
  styleUrl: './style.scss',
  providers: [SignupService],
})
export class SignupComponent {}
