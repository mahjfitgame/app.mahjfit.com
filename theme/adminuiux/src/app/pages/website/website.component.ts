import { Component, ViewChild, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { BarWhiteChartjs100Component } from "../../components/charts/bar-white-chartjs-100.component";
import { AreaBlueChartjs60Component } from "../../components/charts/area-blue-chartjs-60.component";
import { RouterLink } from "@angular/router";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { BarBlueChartjs100Component } from "../../components/charts/bar-blue-chartjs-100.component";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();

@Component({
    selector: "app-website",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, MatExpansionModule, MatButtonToggleModule, MatListModule, MatMenuModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatToolbarModule, MatButtonModule, BarBlueChartjs100Component, AreaBlueChartjs60Component],
    template: `
        <div class="bg-theme-white-gradient bg-light-gradient position-relative pt-5">
            <div class="container py-4 pt-lg-5 z-index-1 position-relative ">
                <div class="row gx-3 gx-lg-4 justify-content-center text-center">
                    <div class="col-12 col-lg-8 col-xl-6 pt-3 pt-lg-5">
                        <h4 class="opacity-75">A Fluid, Flexible and Fluent UI template</h4>
                        <h1 class="mb-3">
                            SAAS Dashboard UIUX is Modern<br />
                            <span class="text-theme">User Interface Designs</span> System with<br />
                            Multi-Device UI Consistency
                        </h1>
                        <p class="opacity-75 mb-4 mb-lg-5">Enhance your web projects with our responsive Angular Material Admin Dashboard Template. This comprehensive UI kit provides a sleek, modern, and intuitive design to help you build powerful, feature-rich admin panels with ease.</p>
                        <button routerLink="/auth/landing" matButton="filled" class="mx-2">Get Started <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                        <button routerLink="/app/dashboard" matButton="elevated" class="mx-2">Dashboard <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                    </div>
                </div>
            </div>
            <div class="container-fluid">
                <div class="row gx-3 gx-lg-4 justify-content-center align-items-end overflow-hidden">
                    <div class="col-auto order-1 order-lg-1">
                        <mat-card class="height-150 width-200  position-relative mb-3 mb-lg-4">
                            <div class=" w-100 rounded position-absolute start-0 bottom-0 z-index-0 opacity-50">
                                <app-area-blue-chartjs-60 class="height-80 w-100 d-block"></app-area-blue-chartjs-60>
                            </div>
                            <mat-card-header> </mat-card-header>
                            <mat-card-content class="">
                                <h2 class="mb-1">Responsive</h2>
                                <h3 class="fw-light text-secondary">Flexible Widget</h3>
                            </mat-card-content>
                        </mat-card>
                    </div>
                    <div class="col-auto order-3 order-lg-2 position-relative">
                        <img src="assets/img/home.png" alt="" class="height-400 mx-auto d-block rounded" style="margin-bottom: -50px; box-shadow: 0 -5px 25px rgba(0, 49, 92, 0.16); margin-top: 45px;" />
                    </div>
                    <div class="col-auto order-2 order-lg-3">
                        <app-bar-blue-chartjs-100 class="height-80 width-180 my-3 my-lg-4 d-block"></app-bar-blue-chartjs-100>
                        <mat-card class="height-150 width-200 bg-theme text-white position-relative theme-green mb-3 mb-lg-4">
                            <div class="h-100 w-100 rounded coverimg position-absolute z-index-0 opacity-50">
                                <img src="assets/img/background1.jpg" alt="" />
                            </div>
                            <mat-card-header> </mat-card-header>
                            <mat-card-content class="z-index-1 position-relative">
                                <h2 class="fw-normal mb-1">Feel</h2>
                                <h3 class="fw-light">The Difference</h3>

                                <p class="small">Adopt the new wave</p>
                            </mat-card-content>
                        </mat-card>
                    </div>
                </div>
            </div>
        </div>
        <!-- count -->
        <div class="w-100 bg-theme text-white mb-4 mb-lg-5">
            <div class="container">
                <div class="row gx-3 gx-lg-4 text-center py-3">
                    <div class="col-6 col-lg-3 my-3 my-lg-4">
                        <h1 class="mb-1">61.15K+</h1>
                        <p>Downloads</p>
                    </div>
                    <div class="col-6 col-lg-3 my-3 my-lg-4">
                        <h1 class="mb-1">10245</h1>
                        <p>Projects</p>
                    </div>
                    <div class="col-6 col-lg-3 my-3 my-lg-4">
                        <h1 class="mb-1">9564</h1>
                        <p>Customer</p>
                    </div>
                    <div class="col-6 col-lg-3 my-3 my-lg-4">
                        <h1 class="mb-1">19+</h1>
                        <p>Country</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- we serve  -->
        <div class="container">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-lg-6 mb-3 mb-lg-4">
                    <mat-card class="bg-light-gradient overflow-hidden">
                        <mat-card-content class="py-md-4 px-md-4 py-lg-5 px-lg-5">
                            <h4 class="opacity-75">Designed for multiple Business Domains</h4>
                            <h1>We design UX UI for Creative & Unique Digital Products</h1>
                            <p class="text-secondary mb-4">We create HTML templates for Enterprise applications, Business applications, eCommerce application, Admin Dashboard Applications, Mobile application, Mobile Websites, Micro websites, HTML for apps etc. Technology you can choose from our latest builds Bootstrap 5 HTML template, Mobile app templates, Angular starter kits.</p>
                            <button routerLink="/auth/login" matButton>Start now<mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-lg-4">
                    <mat-card class="bg-light-gradient text-center h-100 overflow-hidden">
                        <mat-card-content class="py-lg-4 px-lg-4">
                            <div class="text-theme avatar avatar-50 rounded mt-3 mb-4">
                                <mat-icon class="material-icons-outlined align-middle text-xl">palette</mat-icon>
                            </div>
                            <h2>Trending Design</h2>
                            <p class="text-secondary mb-4">Be with latest trending and how content are being specific in AI Age. Our today's significant move can save tomorrows lot of efforts towards user accessibility.</p>
                            <button routerLink="/app/dashboard" matButton>Personalize <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-lg-4">
                    <mat-card class="bg-light-gradient text-center h-100 overflow-hidden">
                        <mat-card-content class="py-lg-4 px-lg-4">
                            <div class="text-theme avatar avatar-50 rounded mt-3 mb-4">
                                <mat-icon class="material-icons-outlined align-middle text-xl">leaderboard</mat-icon>
                            </div>
                            <h2>Uniqueness</h2>
                            <p class="text-secondary mb-4">Standout from crowed by using unique design template and maximize usage of framework capability to stay light weight and efficient.</p>
                            <button routerLink="/app/profile" matButton>Profile <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>

            <!-- technology and customer -->
            <mat-card class="mb-3 mb-lg-4">
                <mat-card-content class="bg-light-gradient py-lg-4 px-md-4 py-lg-5 px-lg-5">
                    <div class="row gx-3 gx-lg-4 align-items-center">
                        <div class="col-12 col-lg-5">
                            <h4 class="opacity-75">Fully Customizable & Responsive</h4>
                            <h1>The Complete <span class="text-theme">UI/UX template</span> for Admin Dashboard Projects</h1>
                            <p class="text-secondary mb-3 mb-lg-4">Get inspired by a wide range of demo pages for different dashboard types. Our template is packed with features and ideas to streamline your development process and enhance the user experience.</p>
                        </div>
                        <div class="col-12 col-lg-6 ms-auto">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-12 col-sm-6 mb-3 mb-lg-4">
                                    <div class="bg-light-theme text-theme avatar avatar-50 rounded mb-3">
                                        <mat-icon class="material-icons-outlined align-middle">web</mat-icon>
                                    </div>
                                    <h3 class="mb-3">Multipurpose Admin Template</h3>
                                    <p class="text-secondary">In Sales Management template we have ready to use pages for Social, Finance, Appointment, Shopping and Admin dashboard to create your new app.</p>
                                </div>
                                <div class="col-12 col-sm-6 mb-3 mb-lg-4">
                                    <div class="bg-light-theme text-theme avatar avatar-50 rounded mb-3 theme-magenta" style="fill: var(--mat-sys-primary);">
                                        <svg x="0px" y="0px" width="960px" height="960px" viewBox="0 0 960 960" class="avatar avatar-30">
                                            <polygon points="562.6,109.8 804.1,629.5 829.2,233.1"></polygon>
                                            <polygon points="624.9,655.9 334.3,655.9 297.2,745.8 479.6,849.8 662,745.8"></polygon>
                                            <polygon points="384.1,539.3 575.2,539.3 479.6,307"></polygon>
                                            <polygon points="396.6,109.8 130,233.1 155.1,629.5"></polygon>
                                        </svg>
                                    </div>
                                    <h3 class="mb-3">Technology Framework</h3>
                                    <p class="text-secondary">We've created template with Angular Material Design framework v20.x. By keep in mind that Material Design it self driving its philosophy and we care for it.</p>
                                </div>
                                <div class="col-12 col-sm-6 mb-3 mb-lg-4">
                                    <div class="bg-light-theme text-theme avatar avatar-50 rounded mb-3 theme-red">
                                        <mat-icon class="material-icons-outlined align-middle">web</mat-icon>
                                    </div>
                                    <h3 class="mb-3">Flexible UI kit Template</h3>
                                    <p class="text-secondary">In Sales Management template we have very flexible UI widgets for best fluid responsive experience and it works smooth in major devices.</p>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="bg-light-theme text-theme avatar avatar-50 rounded mb-3 theme-cyan">
                                        <mat-icon class="material-icons-outlined align-middle">web</mat-icon>
                                    </div>
                                    <h3 class="mb-3">Creativity and Uniqueness</h3>
                                    <p class="text-secondary">In market we are very different from other author in creativity. We do craft each page with own creative thought process to make it incredible in UI design.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </mat-card-content>
            </mat-card>

            <div class="row gx-3 gx-lg-4 justify-content-center pt-4 pt-lg-5">
                <div class="col-12 col-lg-8 text-center mb-3 mb-lg-4">
                    <h4 class="opacity-75">Believe in future proof development</h4>
                    <h1 class="mb-2">Features that <span class="text-theme">helps business</span> to grow and easy adopt trends</h1>
                    <p class="text-secondary mb-4">Quick start development with ready to use pages along with the customizable highly demanded features. Easy to adopt trends no more unwanted code features inside by business specific template development approach.</p>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-6 mb-3 mb-lg-4">
                    <mat-card class="">
                        <mat-card-content class="py-lg-4 px-lg-4">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6">
                                    <h2>SASS Dashboard</h2>
                                    <p class="text-secondary">Take a quick look overview with detailed dashboard interface design</p>

                                    <mat-list class="mb-3 ">
                                        <mat-list-item><mat-icon class="material-icons-outlined align-middle me-2">check_circle</mat-icon> Easy Navigation</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined align-middle me-2">check_circle</mat-icon> Interactive Grid</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined align-middle me-2">check_circle</mat-icon> Charts Options</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined align-middle me-2">check_circle</mat-icon> Elastic Widgets</mat-list-item>
                                    </mat-list>
                                    <button routerLink="/app/dashboard" matButton>Dashboard <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                                </div>
                                <div class="col-6 ">
                                    <img src="assets/img/feature-1.png" alt="" class="w-100 rounded" />
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-md-6 col-lg-3 mb-3 mb-lg-4">
                    <mat-card class="h-100 overflow-hidden">
                        <mat-card-content class="p-4">
                            <h2>Track e-Commerce</h2>
                            <p class="text-secondary mb-3">You can expand project with eCommerce store and manage at one single place.</p>
                            <img src="assets/img/feature-2.png" alt="" class="w-100 rounded mb-2" />
                            <button routerLink="/app/ecommerce" class="" matButton>Storefront UI <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-md-6 col-lg-3 mb-3 mb-lg-4">
                    <mat-card class="h-100 overflow-hidden">
                        <mat-card-content class="p-4">
                            <h2>Appointment Booking</h2>
                            <p class="text-secondary mb-4">Easy to Book appointment and track with calendar. Mange your schedules personal and business now with more accessible way.</p>
                            <img src="assets/img/feature-3.png" alt="" class="w-100 mb-2" />
                            <button routerLink="/app/calendar" class="" matButton>Calendar <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 align-items-center">
                <div class="col-12 col-lg-6">
                    <mat-card class="bg-light-theme mb-3 mb-lg-4">
                        <mat-card-content class="p-lg-4">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col">
                                    <h2>Project Management</h2>
                                    <p class="text-secondary mb-4">Track your project and analyze task progress along with project. Review and Monitor closely with minimal effort. Manage documents and activity view which help you to have better understanding. Responsiveness and customizability allows more flexibility to achieve business goals</p>
                                </div>
                                <div class="col-auto align-self-end">
                                    <button routerLink="/app/projects" class="mb-3" matButton>Projects <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-12 col-lg-6">
                                    <img src="assets/img/feature-4.png" alt="" class="w-100 rounded" />
                                </div>
                                <div class="col-12 col-lg-6">
                                    <img src="assets/img/feature-5.png" alt="" class="w-100 rounded" />
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-lg-6">
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-content class="p-lg-4">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col">
                                    <h2>Task Management</h2>
                                    <p class="text-secondary mb-3">With the minimalistic Kanban chart you can manage your daily task and progress with status.</p>
                                </div>
                                <div class="col-auto align-self-end">
                                    <button routerLink="/app/kanban" class="mb-3" matButton>Kanban view <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-12 col-lg-6">
                                    <img src="assets/img/feature-6.png" alt="" class="w-100 rounded" />
                                </div>
                                <div class="col-12 col-lg-6">
                                    <img src="assets/img/feature-7.png" alt="" class="w-100 rounded" />
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>

            <!-- how to use   -->
            <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4 py-4 py-lg-5">
                <div class="col-6 col-lg-6">
                    <h3 class="opacity-75">Responsive widget HTML development</h3>
                    <h1 class="">Good code structures <span class="text-theme">responsive and customizable</span> with latest UI trends</h1>
                    <p class="text-secondary mb-4">Our template is specifically designed to fast-track your SaaS Dashboard Multipurpose Admin, finance, ecommerce, social, calendar, dashboards for business domain by providing ready-to-use UI pages tailored to industries. With pre-built pages like Shop, Products, dashboards, statistics, finace, cart, reminders, user profiles, invoice, and user settings etc.</p>
                </div>
                <div class="col-6 col-lg-3">
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-content>
                            <h2>Easy to Download</h2>
                            <p class="text-secondary">We have document file in folder to guide you about code structure, customization, personalization settings defaults define.</p>
                        </mat-card-content>
                    </mat-card>
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-content>
                            <h2>Ready-to-use Pages</h2>
                            <p class="text-secondary">As domain specific app template it's benefit to have major commonly used screen ready. Choose page template and start development process.</p>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-6 col-lg-3">
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-content>
                            <h2>Personalize Branding</h2>
                            <p class="text-secondary">Choose your branding assets and color scheme and define it in main layouts. Template used local storage for live personalize value storage.</p>
                        </mat-card-content>
                    </mat-card>
                    <mat-card class="mb-3 mb-lg-4 overflow-hidden">
                        <div class="coverimg height-150 w-100">
                            <img src="assets/img/background2.jpg" alt="" />
                        </div>
                    </mat-card>
                </div>
            </div>
        </div>

        <!-- team -->
        <div class="bg-light-gradient bg-light-theme">
            <div class="container py-4 py-lg-5">
                <h3 class="opacity-75">Meet our team</h3>
                <div class="row gx-3 gx-lg-4 mb-lg-4">
                    <div class="col-12 col-md-6 col-lg-6 mb-3 mb-lg-4">
                        <h1>Our <span class="text-theme">great team</span> is our strength<br />& source of growth.</h1>
                    </div>
                    <div class="col col-lg-5 ms-auto mb-3 mb-lg-4">
                        <p>We work hard, we do it creatively and we like to see you here! We always prefer to have clear communication less headache and only creative thoughts in mind. That is why we prefer to have good working culture across the organization.</p>
                    </div>
                </div>
                <div class="row gx-3 gx-lg-4">
                    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <mat-card class="text-center mb-3 mb-lg-4">
                            <div mat-card-image class="height-250 overflow-hidden mb-3">
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/user-6.jpg" alt="" />
                                </figure>
                            </div>
                            <mat-card-content>
                                <h3 class="text-truncated mb-1">Aditi Johnson</h3>
                                <p class="mb-1">London, UK</p>
                                <p class="text-secondary small">Founder</p>
                            </mat-card-content>
                        </mat-card>
                    </div>
                    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <mat-card class="text-center mb-3 mb-lg-4">
                            <div mat-card-image class="height-250 overflow-hidden mb-3">
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/user-4.jpg" alt="" />
                                </figure>
                            </div>
                            <mat-card-content>
                                <h3 class="text-truncated mb-1">Steven Thomson</h3>
                                <p class="mb-1">New York, USA</p>
                                <p class="text-secondary small">CEO</p>
                            </mat-card-content>
                        </mat-card>
                    </div>
                    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <mat-card class="text-center mb-3 mb-lg-4">
                            <div mat-card-image class="height-250 overflow-hidden mb-3">
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/user-3.jpg" alt="" />
                                </figure>
                            </div>
                            <mat-card-content>
                                <h3 class="text-truncated mb-1">John Ritte</h3>
                                <p class="mb-1">Wembley, UK</p>
                                <p class="text-secondary small">CTO</p>
                            </mat-card-content>
                        </mat-card>
                    </div>
                    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <mat-card class="text-center mb-3 mb-lg-4">
                            <div mat-card-image class="height-250 overflow-hidden mb-3">
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/user-2.jpg" alt="" />
                                </figure>
                            </div>
                            <mat-card-content>
                                <h3 class="text-truncated mb-1">Nicky Lambaa</h3>
                                <p class="mb-1">Wembley, UK</p>
                                <p class="text-secondary small">CTO</p>
                            </mat-card-content>
                        </mat-card>
                    </div>
                </div>
                <div class="row gx-3 gx-lg-4 text-center justify-content-center">
                    <div class="col-auto pt-4">
                        <h2 class="mb-2">Wanted to experience adventure?</h2>
                        <p>Join us now!. We will be happy to make ou part of our team.</p>

                        <button matButton="filled" class="">Apply now</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="container py-4 py-lg-5">
            <!-- pricing   -->
            <div class="row gx-3 gx-lg-4 justify-content-center mb-3 mb-lg-4">
                <div class="col-12 col-md-8 col-lg-6 text-center">
                    <h3 class="opacity-75">Our Pricing</h3>
                    <h2 class="mb-2">Take your saving to next level by upgrading plans</h2>
                    <p class="text-secondary">Take a look at features and upgrade your current plan with us</p>
                    <br />
                    <mat-button-toggle-group name="plans" [hideSingleSelectionIndicator]="hideSingleSelectionIndicator()">
                        <mat-button-toggle value="monthly" checked>Monthly</mat-button-toggle>
                        <mat-button-toggle value="yearly">Yearly <span class="badge badge-theme ms-2">Save 20%</span></mat-button-toggle>
                    </mat-button-toggle-group>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4 align-items-center">
                <div class="col-12 col-md-6 col-lg-4">
                    <mat-card class="mb-3 mb-lg-4 bg-light-gradient theme-orange">
                        <mat-card-content>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme text-white">
                                        <mat-icon>person</mat-icon>
                                    </div>
                                </div>
                                <div class="col">
                                    <h3 class="mb-1">Personal</h3>
                                    <p class="opacity-75">Perfect for the individuals</p>
                                </div>
                            </div>

                            <h1 class="mb-1">$ 50</h1>
                            <p class="opacity-75 mb-3 mb-lg-4">Per license</p>

                            <h4 class="mb-2">Basic includes:</h4>
                            <mat-list style="--mat-list-list-item-one-line-container-height:40px">
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> All demo access</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> Unlimited Download</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> No Contact list</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> 5 transactions per day</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> 24/7 Customer Support</mat-list-item>
                            </mat-list>
                        </mat-card-content>
                        <mat-card-actions class="justify-content-center py-4">
                            <div class="text-center">
                                <p class="text-center mb-2"><span class="opacity-75">Your next due date is:</span> 22-June-2026</p>
                                <span class="badge theme-green">Active</span>
                            </div>
                        </mat-card-actions>
                    </mat-card>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <mat-card class="bg-theme mb-3 mb-lg-4 theme-green">
                        <mat-card-content class="px-1 pb-1">
                            <h4 class="text-center text-white mb-3">Recommended</h4>
                            <mat-card class="shadow-none">
                                <mat-card-content>
                                    <div class="row gx-3 align-items-center mb-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme text-white">
                                                <mat-icon>group</mat-icon>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h3 class="mb-1">Business</h3>
                                            <p class="opacity-75">Multiple team &amp; customer</p>
                                        </div>
                                    </div>

                                    <h1 class="mb-1">$ 100</h1>
                                    <p class="opacity-75 mb-3 mb-lg-4">Per license</p>

                                    <h4 class="mb-2">Basic includes:</h4>
                                    <mat-list style="--mat-list-list-item-one-line-container-height:40px">
                                        <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> All demo access</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> Unlimited Download</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> No Contact list</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> 15 transactions per day</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> Multiple User</mat-list-item>
                                        <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> 24/7 Customer Support</mat-list-item>
                                    </mat-list>
                                </mat-card-content>
                                <mat-card-actions class="justify-content-center p-3">
                                    <button matButton="filled" class="w-100">Buy Now</button>
                                </mat-card-actions>
                            </mat-card>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <mat-card class="bg-light-gradient mb-3 mb-lg-4">
                        <mat-card-content>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme text-white">
                                        <mat-icon>apartment</mat-icon>
                                    </div>
                                </div>
                                <div class="col">
                                    <h3 class="mb-1">Ultra Pro</h3>
                                    <p class="opacity-75">Multiple Application</p>
                                </div>
                            </div>

                            <h1 class="mb-1">On Request</h1>
                            <p class="opacity-75 mb-3 mb-lg-4">Share your customization details</p>

                            <h4 class="mb-2">Basic includes:</h4>
                            <mat-list style="--mat-list-list-item-one-line-container-height:40px">
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> All from Business plan</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> 50 transactions per day</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> Multiple user</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> Merchant Account</mat-list-item>
                                <mat-list-item><mat-icon class="material-icons-outlined me-2 align-middle">check_circle</mat-icon> Customization as per request</mat-list-item>
                            </mat-list>
                        </mat-card-content>
                        <mat-card-actions class="justify-content-center p-3">
                            <button routerLink="/app/contact-us" matButton="filled" class="w-100">Contact Us</button>
                        </mat-card-actions>
                    </mat-card>
                </div>
            </div>
        </div>

        <!-- testimonials -->
        <div class="bg-light-gradient bg-light-theme">
            <div class="container py-4 py-lg-5">
                <h3 class="opacity-75">Our Testimonials</h3>
                <h1 class="mb-2">What our <span class="text-theme">customer says</span></h1>
                <p class="opacity-75">Here are few testimonials we had received for our product on website.</p>
                <br />
                <swiper-container slides-per-view="auto" space-between="20px" autoplay="true" pagination="true" class="swiper">
                    <swiper-slide class="pb-3 width-400">
                        <mat-card class="overflow-hidden mb-4">
                            <mat-card-content class="p-lg-4">
                                <span class="avatar avatar-50 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30.575" height="24.416" viewBox="0 0 30.575 24.416" class="w-100 opacity-50">
                                        <path id="Path_71" data-name="Path 71" d="M9.326,13.916H-2.919V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159H9.326Zm18.33,0H15.411V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159h6.086Z" transform="translate(2.919 10.5)" />
                                    </svg>
                                </span>
                                <h3 class="mb-2">Fantastic work as what we need</h3>
                                <p class="text-secondary">AdminUIUX completely transformed our internal dashboard, making complex data intuitive and actionable. The streamlined interface cut our daily report generation time by over 40%. If you need efficient design and administrative clarity, look no further.</p>
                                <br />
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="coverimg avatar avatar-60 rounded">
                                            <img src="assets/img/user-7.jpg" alt="" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h3 class="text-truncated mb-1">Rick Dino</h3>
                                        <p class="mb-1">London, UK</p>
                                        <p class="text-secondary small">CEO, Webmavdev.com</p>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </swiper-slide>
                    <swiper-slide class="pb-3 width-400">
                        <mat-card class="overflow-hidden mb-4">
                            <mat-card-content class="p-lg-4">
                                <span class="avatar avatar-50 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30.575" height="24.416" viewBox="0 0 30.575 24.416" class="w-100 opacity-50">
                                        <path id="Path_71" data-name="Path 71" d="M9.326,13.916H-2.919V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159H9.326Zm18.33,0H15.411V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159h6.086Z" transform="translate(2.919 10.5)" />
                                    </svg>
                                </span>
                                <h3 class="mb-2">Gear up with new system design</h3>
                                <p class="text-secondary">We struggled with a clunky, outdated system, but AdminUIUX provided a solution that was easy to adopt. The training materials and transition support were flawless, ensuring zero disruption to our workflow. Professional, reliable, and highly recommended for any enterprise solution</p>
                                <br />
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="coverimg avatar avatar-60 rounded">
                                            <img src="assets/img/user-10.jpg" alt="" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h3 class="text-truncated mb-1">Carala Trio</h3>
                                        <p class="mb-1">Wembly, UK</p>
                                        <p class="text-secondary small">Project Manager, Console.log</p>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </swiper-slide>
                    <swiper-slide class="pb-3 width-400">
                        <mat-card class="overflow-hidden mb-4">
                            <mat-card-content class="p-lg-4">
                                <span class="avatar avatar-50 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30.575" height="24.416" viewBox="0 0 30.575 24.416" class="w-100 opacity-50">
                                        <path id="Path_71" data-name="Path 71" d="M9.326,13.916H-2.919V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159H9.326Zm18.33,0H15.411V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159h6.086Z" transform="translate(2.919 10.5)" />
                                    </svg>
                                </span>
                                <h3 class="mb-2">So futuristic goal achieve</h3>
                                <p class="text-secondary">Their approach to user experience design is modern, clean, and perfectly aligned with current trends. We received overwhelmingly positive feedback from our customers on the new checkout flow. A fantastic investment that directly boosted our conversion rates</p>
                                <br />
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="coverimg avatar avatar-60 rounded">
                                            <img src="assets/img/user-7.jpg" alt="" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h3 class="text-truncated mb-1">Amazing Person</h3>
                                        <p class="mb-1">Canada, UK</p>
                                        <p class="text-secondary small">Unknown</p>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </swiper-slide>
                    <swiper-slide class="pb-3 width-400">
                        <mat-card class="overflow-hidden mb-4">
                            <mat-card-content class="p-lg-4">
                                <span class="avatar avatar-50 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30.575" height="24.416" viewBox="0 0 30.575 24.416" class="w-100 opacity-50">
                                        <path id="Path_71" data-name="Path 71" d="M9.326,13.916H-2.919V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159H9.326Zm18.33,0H15.411V1.745q0-10.852,12.245-12.245v6.086q-5.939.22-6.086,6.159h6.086Z" transform="translate(2.919 10.5)" />
                                    </svg>
                                </span>
                                <h3 class="mb-2">We are at top in Australia</h3>
                                <p class="text-secondary">The support team at AdminUIUX is unparalleled in responsiveness and technical expertise. They resolved a critical integration bug within hours, preventing major downtime during our peak season. Truly a partner in keeping our systems running smoothly and securely.</p>
                                <br />
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="coverimg avatar avatar-60 rounded">
                                            <img src="assets/img/user-5.jpg" alt="" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h3 class="text-truncated mb-1">Xen Chi</h3>
                                        <p class="mb-1">AU</p>
                                        <p class="text-secondary small">Owner, carmobi world tour</p>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </swiper-slide>
                </swiper-container>
            </div>
        </div>
    `,
    styles: [``],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WebsiteComponent {
    value = "";
    ngAfterInit() {}

    // button group
    hideSingleSelectionIndicator = signal(false);
    toggleSingleSelectionIndicator() {
        this.hideSingleSelectionIndicator.update((value) => !value);
    }
}
