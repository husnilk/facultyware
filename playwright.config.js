// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for FacultyWare E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests to avoid database and session conflicts */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Maximum time each action such as `click()` can take */
    actionTimeout: 10000,

    /* Maximum time each navigation can take */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Timeout for each test */
  timeout: 60000,

  /* Global timeout for the entire test run */
  globalTimeout: 600000,

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});
