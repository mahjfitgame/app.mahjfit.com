# Advance Anguer to Consider
- transfer text to language base
- use Resource API as needd, need to learn how to use it
- [x] @defer lazy loading (used at one place for now - need to think abouot app wide solution)
- [x] in geo contry need to add one more option for mutation form end_drawer
- [x] on module distroy need to remove general statae like module info also find some other
- [x] when action url is requestested need to load listing on page means initial load
- [x] need to switch from synntex old @Input() and @Output to kind of below
user = input.required<User>();
selected = output<User>();
- imprive language base once backend language base get done
- route-level providers / Route Scoped Providers
- SSR + hydration and Incremental hydration

# Plugin System in Angular
need to understand how plugin system works in angular 
need to research on chatgpt for Plugin Architecture

# Micro Frontends
built using:
Module Federation
Native Federation (this is latest so go with this when you chooe)
Micro Frontends solve an organizational scaling problem.

# Many other things we can review and include
There are many things that required our attention and to be included to speed up and improve standards
@tailwindcss/typography
daisyUI
tailwindcss-animate
tailwind-scrollbar-hide
tailwindcss-rtl
tailwindcss-3d
prettier-plugin-tailwindcss
tailwindcss-debug-screens
# ProgressBarComponent + ProgressBarService Manual

# Custom package install and remove
npm uninstall @bfw/api-sdk
npm rm @bfw/api-sdk
npm i bfw-api-sdk-1.0.0.tgz

# Progress bar
This manual shows how to use `app-progress-bar` for **multiple independent processes on the same page** (for example 2-3 forms and one data listing API call).

# Performance
https://angular.dev/best-practices/performance
## Why this works for multiple processes

# Style Guide
https://angular.dev/style-guide
`ProgressBarComponent` has its own `providers: [ProgressBarService]`.
That means every `<app-progress-bar>` instance gets a **unique** `ProgressBarService` instance.

# Tailwind
https://angular.dev/guide/tailwind
So if one page has 3 forms, each form can have its own progress bar:

# Web-Workers
https://angular.dev/ecosystem/web-workers
- Form A loading does not affect Form B.
- Form B loading does not affect Form C.
- A listing API progress does not affect form progress bars.

# Accessibility
https://angular.dev/guide/aria/overview
---

# HTTP Client and Resource
https://angular.dev/guide/http
## API available

# Signals
https://angular.dev/guide/signals
From each component instance you can call:

# Signals Forms
https://angular.dev/guide/forms/signals/overview
- `start()` → marks process as running (`Date.now()`)
- `stop()` → stops process, hides bar, returns elapsed ms
- `progress(value)`
  - `0` automatically triggers `start()`
  - `100` automatically triggers `stop()`

# SSR
https://angular.dev/guide/performance
Template inside progress bar uses:

# Material
https://material.angular.dev/
https://material.angular.dev/cdk/categories

# With new project use latest node version
```
node -v
nvm ls-remote
nvm install v24.14.0 (change v*. Use Latest LTS version as per current time)
nvm alias default v24.14.0
```

# Install Angular CLI
```
npm install -g @angular/cli
```

# Install
```
ng new bfw-angular-pwa
```
When you run the command it creates new folder for project, you might need to relocate the full codebase to root dir if you already have empty git repo and fired above command inside.

# Add package.json script
```
"build:debug": "ng build --configuration debug",
"build:debug:watch": "ng build --watch --configuration debug",
"build:dev": "ng build --configuration development",
"build:prod": "ng build --configuration production",
"debug": "ng serve --watch --configuration debug --hmr --open",
"dev": "ng serve --configuration development",
"prod": "ng serve --configuration production",
"test:debug": "ng test --configuration debug",
"test:dev": "ng test --configuration development",
"test:prod": "ng test --configuration production"
```html
<mat-progress-bar mode="buffer" [value]="splash.progress()" aria-label="Progress"></mat-progress-bar>
```

# Update angular.json
Update below. [bfw-angular-pwa] is your project name can be any.
JSON: projects.bfw-angular-pwa.architect.build.configurations
JSON: projects.bfw-angular-pwa.architect.serve
Need to update for all env type
You need to check other project angular.json for reference
---

make sure you add your app port number in [serve]
## Example: 3 forms + 1 list request on same page

# Set up debug mode in Angular app
To start code with debug mode need to configure .vscode launch.json file.
Change the data as per the below configurations. For example change the PORT, provide the path of your node version in runtimeExecutable.
```
"configurations": [
    {
      "name": "Angular: Serve & Debug (Chrome)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "/Users/core/.nvm/versions/node/v24.8.0/bin/node",
      "program": "${workspaceFolder}/node_modules/@angular/cli/bin/ng.js",
      "args": ["serve", "--port=20020", "--open=false"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "autoAttachChildProcesses": true,
      "serverReadyAction": {
        "pattern": "https?://localhost:20020",
        "uriFormat": "http://localhost:20020",
        "action": "debugWithChrome"
      }
    },
]
```
Also change package.json 
Add script for debugging to start debugging. 
Example given below, this example shows the local enviorment setup we can change enviorment as per our need.
```
{ 
    "scripts": { 
        "debug": "npm run start && --configuration debug --watch --hmr --source-map=true --open  --inspect",
    }
}
```
# Clear node modules cache
Some time we need it
```
npm cache clean --force
```

### 1) `multi-form-page.component.html`

# Create libs
Manually create folder libs, libs/src, libs/src/index.ts
Here create library based modules which will be used through out the app
```html
<section>
  <h3>Profile Form</h3>
  <app-progress-bar #profileBar></app-progress-bar>
  <form (ngSubmit)="submitProfile()">
    <!-- profile fields -->
    <button type="submit">Save Profile</button>
  </form>
</section>

once file folder created add below in tsconfig.json. Create aliases to plain folder.
In the root tsconfig that your app inherits from (often tsconfig.json or tsconfig.base.json), add baseUrl and paths: 
```
"baseUrl": ".",
"paths": {
      "@libs/*": ["libs/src/*"],
      "@libs": ["libs/src/index.ts"]
    },
```
This allow us to impor using short path '@libs' or '@libs/'
<section>
  <h3>Address Form</h3>
  <app-progress-bar #addressBar></app-progress-bar>
  <form (ngSubmit)="submitAddress()">
    <!-- address fields -->
    <button type="submit">Save Address</button>
  </form>
</section>

# Allow CORS in your api and web-socket
You need to allow this angular app url on server so server 
<section>
  <h3>Password Form</h3>
  <app-progress-bar #passwordBar></app-progress-bar>
  <form (ngSubmit)="submitPassword()">
    <!-- password fields -->
    <button type="submit">Save Password</button>
  </form>
</section>

# Custom package installation
Suppose custom package name is: bfw-api-sdk-1.0.0.tgz
You need to copy and past the package at root of project after run below commands
Genereally we need to remove and after install in case of custom package.
This is because we might have updated package but version is not changed and npm checks with version.
So, for clarity we need to do uninstall and install
```
npm uninstall bfw-api-sdk-1.0.0.tgz
npm rm @bfw/api-sdk
npm i bfw-api-sdk-1.0.0.tgz
<section>
  <h3>Data Listing</h3>
  <app-progress-bar #listBar></app-progress-bar>
  <button type="button" (click)="loadList()">Load List</button>
</section>
```

### 2) `multi-form-page.component.ts`

# Install angular materia
```
ng add @angular/material
```
```ts
import { Component, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProgressBarComponent } from 'src/app/components/progress-bar/component';
import { ApiService } from './api.service';

# Install taildwindcss
```
ng add tailwindcss
```
once done you need to add import statement in file
src/styles.scss
@use 'tailwindcss';
@Component({
  selector: 'app-multi-form-page',
  standalone: true,
  imports: [ProgressBarComponent],
  templateUrl: './multi-form-page.component.html',
})
export class MultiFormPageComponent {
  @ViewChild('profileBar') private profileBar!: ProgressBarComponent;
  @ViewChild('addressBar') private addressBar!: ProgressBarComponent;
  @ViewChild('passwordBar') private passwordBar!: ProgressBarComponent;
  @ViewChild('listBar') private listBar!: ProgressBarComponent;

# Install ionic [pending]
```
npm install -g @ionic/cli
ng add @ionic/angular
```
To uninstall ionic you need to do below
npm uninstall @ionic/angular
npm uninstall @ionic/angular-toolkit
afer remove all import from project files
angular.json
src/styles.scss
src/app/app.config.ts
src/theme/variables.css
Delete: node_modules + package-lock.json
Again run: npm i --verbose
  constructor(private readonly api: ApiService) {}

create ionic project
```
ionic init
  async submitProfile(): Promise<void> {
    this.profileBar.progress(0);
    try {
      await firstValueFrom(this.api.saveProfile());
      this.profileBar.progress(100);
    } catch {
      this.profileBar.stop();
    }
  }

  async submitAddress(): Promise<void> {
    this.addressBar.start();
    try {
      await firstValueFrom(this.api.saveAddress());
      this.addressBar.progress(100);
    } catch {
      this.addressBar.stop();
    }
  }

  async submitPassword(): Promise<void> {
    this.passwordBar.progress(0);
    try {
      await firstValueFrom(this.api.savePassword());
      this.passwordBar.progress(100);
    } catch {
      this.passwordBar.stop();
    }
  }

  async loadList(): Promise<void> {
    this.listBar.progress(0);
    try {
      await firstValueFrom(this.api.getList());
      this.listBar.progress(100);
    } catch {
      this.listBar.stop();
    }
  }
}
```

---

# Install ionic-capacitor
```
npm i @capacitor/core
npm i -D @capacitor/cli
```

## Behavior summary
```
npx cap init
npx cap telemetry off
```
- Each bar is isolated because each `<app-progress-bar>` has its own `ProgressBarService` instance.
- You can run all processes at once (profile + address + password + list) and all bars will update separately.
- `stop()` returns elapsed time if you want to log duration:

You need to check "webDir" in capacitor.config.ts
This is the directory of build project holding index.js file on root.
Common cases are "dist" folder.
Once done run below commands
```ts
const durationMs = this.profileBar.stop();
console.log('Profile request took', durationMs, 'ms');

npm i @capacitor/ios
npm i @capacitor/android 

npx cap add ios
npx cap add android

npx cap sync
npx cap sync ios
npx cap sync android

npx cap open ios
npx cap open android

npx cap run ios
npx cap run android

npx cap build ios
npx cap build android
```
With 
[npx cap run] 
we can set host and port if live-reload required like 
[npx cap run ios --live-reload --host=192.168.0.13 --port=20154]
or 
We can also set default settings in 
[capacitor.config.ts] 
[CapacitorConfig.server.url = http://192.168.0.13:20154] 


# Add WebNative VS Code addon
https://webnative.dev/

# File name standard
module-name
|- service.ts
|- component.ts
|- template.html
|- style.scss
|- route.ts
|- slug.ts

if required we can seperate 3 files inside module
like
|- page (of your feature name)
|-- component.ts
|-- template.html
|-- style.scss

# Implement State Management Solution
Developed using  NgRx SIgnal which uses Angular signal under the hood

# Manage Platform and Device related operations
Done it using capacitor package
Created standard module [libs/src/app-platform]

# Manage ui related state

# Some important links
1]
Local SqLite storage
https://github.com/capacitor-community/sqlite

# Add PWA prograssive web app
https://angular.dev/ecosystem/service-workers/getting-started
This will create ngsw-config.json at root
Also web worker concept will required this

# Set hit reload to all device
1]
Set static ip to your computer
in my case: 192.168.0.130
2]
Make sure your package.json has command set as below 
"debug": "ng serve --watch --configuration your_environment_name --hmr --open --inspect",

so, we can run app like
~ npm run debug
3] 
angular.json
name-of-your-project.architect.serve.configurations.debug.host = 0.0.0.0
4]
run your app
~ npm run debug
At the end you will see Local and Network URL to check the site
You need to choose one of Netword url which is in IP range of your router 
in my case its Network: http://192.168.0.130:20155/
So, you might see something like
Network: http://192.168.0.130.X:20155/
X can be any
5]
Now, you need to copy the url from [2] and paste in beow file
capacitor.config.ts
CapacitorConfig.server.url = http://192.168.0.130:20155/'
CapacitorConfig.server.cleartext =true
6]
connect your ios device and run below
~ npm run ios
make sur eyour package.json has below command
"ios": "npm run build:debug && npx cap run ios --target 00008020-00044D500290003A",
7]
connect your android device and run below
~ npm run android
make sur eyour package.json has below command
"android": "npm run build:debug && npx cap run android --target ZD2225WGBV",
8]
At this stage you will have your app is running at 3 place
- in your web browser
- in ios device
- in android device
9]
Now change in code base and save and check whether it reflect your changes at all 3 palces or not

# Old android device 14 or lower required edge-to-edge manual activation 
Check file 
On Android 14 and lower, edge-to-edge is not automatic. Android’s official guidance is that for older versions you must explicitly enable it at the native window level, either with enableEdgeToEdge() or by setting WindowCompat.setDecorFitsSystemWindows(window, false), plus making system bars transparent.

android/app/src/main/java/com/thatsend/bfw/MainActivity.java
also need to add 2 lines in file
android/app/src/main/res/values/styles.xml
section 
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
below code
<!-- Edge-to-edge related -->
<item name="android:statusBarColor">@android:color/transparent</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
...
</style>

This works at some level but still have issue when usingback button to minimise app but we have no solution.


# Generate app icons
Add icon.png file in public/assets folder, the recommended icon size is 1024x1024 pixels.
icon image name must be "icon.png"
icon.png  => (Must be 1024x1024 px)


Run the command below

```npm run genicon```

This will generate the folder icons inside the assets folder and ```manifest.webmanifest``` file in public folder.

# Usefull command when generated app name and icons are not reflected
Clear Native Caches
# Clean Android Compiler Cache
cd android && ./gradlew clean && cd ..

# Clean Xcode Compiler Cache
rm -rf ~/Library/Developer/Xcode/DerivedData

# Update app logo or app name
- How generated icons and updated app name work
```npm run brand```

Angular build
↓
clean native copied web assets
↓
apply app name
↓
generate icons
↓
cap sync
↓
run platform

# Build android apk and aab file
# 1. Clean the Capacitor web public bundle directories 
npm run clean:cap:web

# 2. Compile optimized production files & copy them directly to Android
npm run android:release

# 3. Enter native shell environment
cd android

# 4. Obliterate cached compiler configurations completely
./gradlew clean

# 5. Compile your installable APK for your real device testing
./gradlew assembleRelease

# 6. Compile your optimized AAB bundle for the Google Play Console upload
./gradlew bundleRelease


# Build archieve for iOS
# 1. Compile optimized production files & copy them directly to iOS
npm run ios:release

# 2. Open iOS project with excode
npx cap open ios

# 3. Setting up xcode
Tatgets > Select the app and cross verify Identify in General tab
Make sure the app name 
Make sure the bundel identifier

Choose tab Signing & Capabilities 
Select the Team and bundel identifier

# 4. Prepare Archive for production build 
Select "Any IOS device" in device selection and Go to top menu Product > Archieve
This will generate the archieve, before send to "Distribute" first "Valid App"

---

# Workbox Service Worker Offline Support Manual

This project has a custom Workbox service worker setup for checking offline/PWA behavior. It is **not the normal development flow** because service workers cache browser assets and can make local development confusing if they are left enabled all the time.

## When to use normal Angular development

Use the normal Angular debug flow for day-to-day development:

```bash
npm run debug:ng
```

This runs Angular with `ng serve` in debug/HMR mode and does not require the Workbox static server flow. Use this for regular feature development, UI changes, API integration work, and most debugging.

### VS Code normal development setup

Before pressing `F5` for regular development, make sure `.vscode/launch.json` is using this configuration:

```json
"name": "BFW Angular Web: Serve & Debug (Chrome)"
```

Basic normal-development flow:

1. Open `.vscode/launch.json`.
2. Comment/uncomment the launch configuration so the active configuration is:
   - `BFW Angular Web: Serve & Debug (Chrome)`
3. Press `F5` in VS Code, or run:

```bash
npm run debug:ng
```

## When to use Workbox offline support testing

After completing some normal development work, use the Workbox flow only when you want to verify that the app can load previously cached files while the browser is offline.

Use this flow for:

- Service worker registration testing.
- Cache Storage verification in Chrome DevTools.
- Offline reload testing.
- Checking that Workbox precache files are generated correctly.
- Confirming the compiled Angular `dist` output is served correctly by the local PWA server.

## How the Workbox setup works

The effective files for this setup are:

- `src/service.worker.js` - custom service worker source file. Workbox injects the precache manifest into this file.
- `workbox.build.js` - runs `workbox-build` and writes the final generated service worker into the Angular browser build output.
- `server.js` - starts the local HTTPS BrowserSync server from the compiled `dist/bfw-angular-pwa/browser/` folder and regenerates the Workbox manifest when build files change.
- `src/app/app.component.ts` - calls `registerServiceWorker()` from `ngOnInit()` so the browser registers `/service.worker.js` after the app loads.
- `package.json` - contains the Workbox-related `build`, `start`, `debug`, `dev`, and `prod` scripts.
- `.vscode/launch.json` - contains a separate debug configuration for the Workbox server:
  - `BFW Angular Web: Serve & Debug Workbox (Chrome)`

Basic request/cache flow:

1. Angular is built into `dist/bfw-angular-pwa/browser/`.
2. `workbox.build.js` runs after the Angular build.
3. Workbox scans the build output and injects the generated precache list into `service.worker.js`.
4. `server.js` serves the compiled app over HTTPS from `dist/bfw-angular-pwa/browser/`.
5. When the browser opens the app, `AppComponent.ngOnInit()` calls `registerServiceWorker()`.
6. The browser registers `/service.worker.js`.
7. Workbox stores the generated precache assets in the browser Cache Storage.
8. After the files are cached, the browser can serve those cached app shell/assets when offline.

In simple terms: as the user opens the app in the browser, the service worker keeps important compiled files in the browser cache. Later, when the network is offline, the service worker can respond from that cache instead of requiring the files from the server.

## Workbox offline testing flow

Before pressing `F5` for Workbox testing, make sure `.vscode/launch.json` is using this configuration:

```json
"name": "BFW Angular Web: Serve & Debug Workbox (Chrome)"
```

Basic Workbox/offline-testing flow:

1. Open `.vscode/launch.json`.
2. Comment/uncomment the launch configuration so the active configuration is:
   - `BFW Angular Web: Serve & Debug Workbox (Chrome)`
3. Press `F5` in VS Code, or run:

```bash
npm run debug
```

This starts `server.js`. The server checks for the compiled Angular app in `dist/bfw-angular-pwa/browser/`, builds a debug bundle if needed, runs `workbox.build.js`, and serves the app securely at:

```text
https://0.0.0.0:20155
```

## Manual offline verification in Chrome

Use Chrome DevTools to confirm that the service worker and caches are working:

1. Start the Workbox flow with `F5` or:

```bash
npm run debug
```

2. Open the app in Chrome.
3. Open Chrome DevTools.
4. Go to **Application** tab.
5. Check **Service Workers** and confirm `/service.worker.js` is registered and active.
6. Check **Cache Storage** and confirm Workbox cache entries exist.
7. Reload the app once while online so the service worker has a chance to install, activate, and cache files.
8. In DevTools, enable offline mode from either:
   - **Application > Service Workers > Offline**, or
   - **Network > Offline**.
9. Refresh the page.
10. Confirm the app shell/assets still load from the service worker cache.

## Switching back to normal development

After offline support testing is finished, switch back to the normal Angular debug setup so service-worker cache behavior does not confuse regular development.

1. Open `.vscode/launch.json`.
2. Comment/uncomment the launch configuration so the active configuration is:
   - `BFW Angular Web: Serve & Debug (Chrome)`
3. Run regular development again with:

```bash
npm run debug:ng
```

## Important notes

- Do not use the Workbox flow as the default daily development flow.
- If Chrome shows old files, clear the site data from DevTools:
  - **Application > Storage > Clear site data**
- You can also unregister the service worker from:
  - **Application > Service Workers > Unregister**
- After changing service-worker behavior, run the Workbox flow again so `workbox.build.js` can regenerate the final `dist` service worker.
- If `/service.worker.js` is missing, make sure the Angular app has been built and `workbox.build.js` has run.
- For Hot Reload in browser you need to perform 2 steps.
Run ~ npm run build:debug:watch
After F5 to start the app.
- Here build process will watch the file and update dist folder and server.js has [files] attribute which update the browser, so this is not straight forward process.
- You also need to enable code in 
[src/app/app.component.ts > ngOnInit() > this.registerServiceWorker();] 