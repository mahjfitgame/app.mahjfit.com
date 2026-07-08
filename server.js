// file: server.js

const browserSync = require('browser-sync').create();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log("Preparing Angular build and service worker before startup...");

// BrowserSync serves the compiled Angular app from dist. If that folder does
// not exist yet, /service.worker.js will be missing and Chrome DevTools will show no active
// service worker/cache storage entries. Build once before generating the
// Workbox manifest so local PWA testing starts from a valid dist directory.
const distDir = path.join(__dirname, 'dist/bfw-angular-pwa/browser/');

try {
  // check of Angular build not exists yet before generating the Workbox manifest
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log("Compiled Angular app not found. Building debug bundle first...");
    execSync('npx ng build --configuration debug', { stdio: 'inherit' });
  }

  // Generate the service worker after the Angular files exist so Workbox can
  // inject a real precache manifest into the service.worker.js served from dist.
  execSync('node workbox.build.js', { stdio: 'inherit' });
} catch (err) {
  console.error("Workbox pre-build hook failed:", err);
}

// --- SERVER CONFIGURATION ---
const CONFIG = {
  host: '0.0.0.0',
  port: 20155,
  
  // relative path to your compiled Angular browser build folder
  distDir,
  
  // SSL Settings (Reads from your local asset paths)
  ssl: {
    key: path.join(__dirname, 'ssl/localhost-key.pem'),
    cert: path.join(__dirname, 'ssl/localhost-crt.pem'),
  }
};

// --- INITIALIZE AND LAUNCH SERVER ---
browserSync.init({
  server: CONFIG.distDir,
  host: CONFIG.host,
  port: CONFIG.port,
  https: {
    key: CONFIG.ssl.key,
    cert: CONFIG.ssl.cert
  },
  
  open: false,
  browser: "google chrome", // Targets Chrome on Mac and Windows

  single: true,
  ui: false,
  logLevel: "info", // Optional: Cleans up default browser-sync terminal outputs
  middleware: [
    function serviceWorkerHeaders(req, res, next) {
      if (req.url === '/service.worker.js') {
        // Make Chrome re-check the generated worker on every F5 session and
        // explicitly allow this root worker to control the whole app.
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Service-Worker-Allowed', '/');
      }
      next();
    }
  ],
  // --- REBUILD WATCH HOOK SYSTEM ---
  files: [
    {
      // Monitor all files inside the dist directory
      match: [path.join(CONFIG.distDir, '**/*')],
      fn: function (event, file) {
        // Strict boundary: Skip the generated service.worker.js file to avoid an infinite build loop
        if (!file.endsWith('service.worker.js')) {
          try {
            console.log(`\x1b[33m%s\x1b[0m`, `[Watcher] Build file change detected. Regenerating Workbox manifest...`);
            
            // Re-run your workbox build script programmatically
            execSync('node workbox.build.js', { stdio: 'inherit' });
            
            // Notify Browsersync to reload the attached Chrome tabs
            browserSync.reload();
          } catch (e) {
            console.error("[Watcher] Workbox generation failed during auto-rebuild:", e);
          }
        }
      }
    }
  ],
  callbacks: {
    ready: function(err, bs) {
      if (err) {
        console.error("Failed to start the PWA local server:", err);
        return;
      }
      // Your custom teal logging string prints cleanly here on success
      console.log(`\x1b[36m%s\x1b[0m`, `[PWA Server] Running securely at: https://${CONFIG.host}:${CONFIG.port}`);
    }
  }
});
