module.exports = {
    apps: [
        {
            name: "mahjfit.com_dev",
            script: "serve",
            env: {
                PM2_SERVE_PATH: "./dist/bfw-angular-pwa/browser",
                PM2_SERVE_PORT: 20180,
                PM2_SERVE_SPA: "true",
                PM2_SERVE_HOMEPAGE: "/index.html",
            },
            instances: 1,
            exec_mode: "fork",
            watch: false,
            max_memory_restart: "512M",
        },
    ],
};