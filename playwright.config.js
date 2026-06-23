const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({

    testDir: './testing',

    timeout: 30000,

    fullyParallel: false,

    use: {

        baseURL: 'http://localhost:3000',

        browserName: 'chromium',

        headless: true,

        viewport: {
            width: 1280,
            height: 720
        }

    }

});