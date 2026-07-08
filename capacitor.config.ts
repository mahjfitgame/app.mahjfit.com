import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thatsend.bfwpwa',
  appName: 'Bfw PWA',
  webDir: 'dist/bfw-angular-pwa/browser',
  zoomEnabled: false,
  //overrideUserAgent: "Bfw Angular PWA/1.0.0 (iOS; Android)",
  appendUserAgent: "BFW-NATIVE-PROGRESSIVE-WEB-APP",
  server: {
    /**
     * @hostname: 'localhost:20155'
     * 
     * This is used if you are loading local files out of webDir 
     * but your application relies heavily on cookies, local storage tracking architectures, 
     * or specific OAuth providers that strict-match your real production domain. 
     * 
     * Setting hostname: 'yourdomain.com' forces Capacitor's internal local buffer engine 
     * to disguise its internal origin protocol (capacitor://localhost) as your real web URL 
     * framework instead. For normal LAN testing, sticking with the dynamic network url parameter 
     * string is what you want.
     */
    //hostname: 'localhost:20155',//required to run on local backoffice port number
    androidScheme: 'https', // Required for Android release build
    iosScheme: 'https', // Required for ios release build Archieve
    //url: 'https://192.168.0.230:20155/', // FOR TESTING PURPOSE: Network URL for "Live Reload" or "External Server"
    cleartext: true
  },
  ios: {
    //overrideUserAgent: "Bfw Angular PWA/1.0.0 (IOS)",
    zoomEnabled: false, // Ensures zooming is disabled
    contentInset: "never",
    webContentsDebuggingEnabled: true, // Inspect app via safari inspector
    backgroundColor: '#f5f5f5',
    allowsLinkPreview: true,
    loggingBehavior: 'none',
    limitsNavigationsToAppBoundDomains: false,
    handleApplicationNotifications: true,
  },
  android: {
    //overrideUserAgent: "Bfw Angular PWA/1.0.0 (Android)",
    zoomEnabled: false,
    webContentsDebuggingEnabled: true, // Inspect app via chrome:inspector
    backgroundColor: '#f5f5f5',
    allowMixedContent: true,
    loggingBehavior: 'none',
    resolveServiceWorkerRequests: true,
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    },
    CapacitorHttp: {
      enabled: false
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DEFAULT"
    },
    SystemBars: {
      insetsHandling: "css",
      style: "DEFAULT",
    },
    SplashScreen: {
      launchShow: false,
      launchShowDuration: 0, // 0 to do not show and (n > 0) to show for a n amount of time
      launchAutoHide: true, // if want to control splash screen hide manually, set to false
      backgroundColor: '#ffffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: false,

      androidScaleType: 'CENTER_CROP',
      androidSpinnerStyle: 'horizontal',

      iosSpinnerStyle: 'large',
    },
    PushNotifications:{
      "presentationOptions": ["badge", "sound", "alert", "banner", "list"]
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: true,
      iosKeychainPrefix: 'bfw-sqlite-app',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle : "Biometric login for capacitor sqlite"
      },
      androidIsEncryption: true,
      androidBiometric: {
        biometricAuth : false,
        biometricTitle : "Biometric login for capacitor sqlite",
        biometricSubTitle : "Log in using your biometric"
      },
      electronIsEncryption: true,
      electronWindowsLocation: "C:\\ProgramData\\CapacitorDatabases",
      electronMacLocation: "/Volumes/Development_Lacie/Development/Databases",
      electronLinuxLocation: "Databases"
    }
  },
};
export default config;