import { Component, OnInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

@Component({
    selector: "app-login",
    standalone: true,
    imports: [MatCardModule, MatInputModule, MatCheckboxModule, MatGridListModule, MatButtonModule, MatIconModule, MatFormFieldModule, ReactiveFormsModule, RouterModule],
    template: `
        <div class="row gx-3 justify-content-center align-items-center" style="min-height: var(--min-height)">
            <div class="col maxwidth-dynamic position-relative" style="--mw-dynamic:440px">
                <mat-card class="bg-light-gradient mb-3 mb-lg-4">
                    <mat-card-content class="p-4 p-lg-5">
                        <div class="login-header mb-4 mb-lg-5">
                            <h1 class="mb-1">Welcome Back</h1>
                            <h2 class="text-secondary fw-normal">Sign in to your account</h2>
                        </div>

                        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Email</mat-label>
                                <input matInput formControlName="email" type="email" placeholder="Enter your email" />
                                <mat-icon matSuffix>email</mat-icon>
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Password</mat-label>
                                <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" placeholder="Enter your password" />
                                <button matIconButton matSuffix (click)="hidePassword = !hidePassword" type="button">
                                    <mat-icon class="material-icons-outlined">{{ hidePassword ? "visibility_off" : "visibility" }}</mat-icon>
                                </button>
                            </mat-form-field>

                            <div class="row gx-0 align-items-center mb-3">
                                <div class="col">
                                    <mat-checkbox>Remember me</mat-checkbox>
                                </div>
                                <div class="col-auto">
                                    <a matButton routerLink="/auth/forgot-password" class="link">Forgot Password?</a>
                                </div>
                            </div>

                            <div class="row align-items-center">
                                <div class="col">
                                    <button matButton="filled" color="primary" type="submit" class="w-100" [disabled]="loginForm.invalid">Sign In</button>
                                </div>
                                <div class="col">
                                    <a matButton routerLink="/auth/signup" class="w-100">Signup</a>
                                </div>
                            </div>
                        </form>
                    </mat-card-content>
                </mat-card>
                <div class="row align-items-center mb-3">
                    <div class="col">
                        <hr class="opacity-25" />
                    </div>
                    <div class="col-auto">
                        <p class="text-secondary">OR continue with</p>
                    </div>
                    <div class="col">
                        <hr class="opacity-25" />
                    </div>
                </div>
                <div class="row align-items-center justify-content-center">
                    <div class="col-auto">
                        <button matIconButton>
                            <img src="assets/img/g-logo.png" alt="" />
                        </button>
                    </div>
                    <div class="col-auto">
                        <button matIconButton>
                            <img src="assets/img/f-logo.png" alt="" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
            }
        `,
    ],
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    hidePassword = true;

    constructor(private fb: FormBuilder, private router: Router) {
        this.loginForm = this.fb.group({
            email: ["visitor@adminuiux.com", [Validators.required, Validators.email]],
            password: ["A1122A1122", [Validators.required, Validators.minLength(6)]],
        });
    }

    ngOnInit() {}

    onSubmit() {
        if (this.loginForm.valid) {
            // Simulate login success
            this.router.navigate(["/app/dashboard"]);
        }
    }
}
