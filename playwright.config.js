const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './testing',

    timeout: 30000,

    use: {
        browserName: 'chromium',
        headless: true,
        baseURL: 'http://localhost:3000'
    },

    reporter: [
        ['list'],
        ['html']
    ]
});