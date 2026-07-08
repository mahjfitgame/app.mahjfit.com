import { Component } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-auth-header",
    standalone: true,
    imports: [RouterLink, MatToolbarModule, MatIconModule, MatButtonModule],
    template: `
        <mat-toolbar class="auth-header" color="primary">
            <span class="logo">
                <div class="avatar avatar-40">
                    <img src="assets/img/logo.png" class="logo-img" alt="" />
                </div>
                <span class="logo-text">
                    SaaS Dashboard<br />
                    <small><span class="d-none d-md-inline-block">Template</span> by AdminUIUX</small>
                </span>
            </span>
            <span class="spacer"></span>
            <button routerLink="/web/contact-us" mat-button class="help-btn">
                <mat-icon class="material-icons-outlined">help_outline</mat-icon>
                <span class="mobile-hidden">Help</span>
            </button>
        </mat-toolbar>
    `,
    styles: [``],
})
export class AuthHeaderComponent {}
