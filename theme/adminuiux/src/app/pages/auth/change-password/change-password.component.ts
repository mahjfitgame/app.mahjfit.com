import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { PasswordStrengthComponent } from "../../../components/password-strength/password-strength.component";

@Component({
    selector: "app-change-password",
    standalone: true,
    imports: [MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule, ReactiveFormsModule, RouterModule, PasswordStrengthComponent],
    template: `
        <div class="row gx-3 justify-content-center align-items-center" style="min-height: var(--min-height)">
            <div class="col maxwidth-dynamic position-relative" style="--mw-dynamic:440px">
                <mat-card class="bg-light-gradient mb-3 mb-lg-4">
                    <mat-card-content class="p-4 p-lg-5">
                        <div class="login-header mb-4">
                            <h1 class="mb-1">Change Password</h1>
                            <p class="text-secondary">Update your account password</p>
                        </div>
                        <br />

                        <form [formGroup]="changeForm" (ngSubmit)="onSubmit()" class="change-form ">
                            <!-- <mat-form-field appearance="outline" class="w-100">
                                    <mat-label>Current Password</mat-label>
                                    <input matInput formControlName="currentPassword" [type]="hideCurrentPassword ? 'password' : 'text'" placeholder="Enter current password" />
                                    <button matIconButton matSuffix (click)="hideCurrentPassword = !hideCurrentPassword" type="button">
                                        <mat-icon class="material-icons-outlined">{{ hideCurrentPassword ? "visibility_off" : "visibility" }}</mat-icon>
                                    </button>
                                </mat-form-field> -->
                            <app-password-strength class="w-100"></app-password-strength>

                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Confirm New Password</mat-label>
                                <input matInput formControlName="confirmPassword" [type]="hideConfirmPassword ? 'password' : 'text'" placeholder="Confirm new password" />
                                <button matIconButton matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button">
                                    <mat-icon class="material-icons-outlined">{{ hideConfirmPassword ? "visibility_off" : "visibility" }}</mat-icon>
                                </button>
                            </mat-form-field>

                            <button matButton="filled" color="primary" type="submit" class="w-100" [disabled]="changeForm.invalid">Update Password</button>
                        </form>
                    </mat-card-content>
                </mat-card>
                <div class="text-center">
                    <p class="text-secondary mb-1">Do you know your password?</p>
                    <button matButton color="primary" routerLink="/auth/login" class="continue-button"><mat-icon class="material-icons-outlined">arrow_back</mat-icon>Back to Sign In</button>
                </div>
            </div>
        </div>
    `,
    styles: [``],
})
export class ChangePasswordComponent {
    changeForm: FormGroup;
    hideConfirmPassword = true;

    constructor(private fb: FormBuilder, private router: Router) {
        this.changeForm = this.fb.group({
            confirmPassword: ["", [Validators.required]],
        });
    }

    onSubmit() {
        if (this.changeForm.valid) {
            // Handle password change logic
            this.router.navigate(["/auth/login"]);
        }
    }
}
