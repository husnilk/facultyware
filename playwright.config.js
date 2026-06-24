const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: './tests/setup.js',
  timeout: 90000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
    storageState: 'tests/auth.json',
  },
});