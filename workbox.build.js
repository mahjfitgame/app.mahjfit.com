// file: workbox-build.js
const { injectManifest } = require('workbox-build');

let workboxConfig = {
  globDirectory: 'dist/bfw-angular-pwa/browser/', // Match your angular.json output path
  globPatterns: [
    '**/*.{html,js,css,ico,png,svg,webmanifest}',
  ],
  swSrc: 'src/service.worker.js',
  swDest: 'dist/bfw-angular-pwa/browser/service.worker.js',
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // Set 10MB to avoid dev build limits
};

injectManifest(workboxConfig).then(({count, size}) => {
  console.log(`Generated ${workboxConfig.swDest}, which will precache ${count} files, totaling ${size} bytes.`);
}).catch((err) => {
  console.error('Workbox generation failed:', err);
});