/**
 * Authentication Helper for FacultyWare Playwright E2E Tests
 * 
 * Provides reusable login/logout functions used across test suites.
 */

const { TEST_USERS, URLS } = require('./test-data');
const SELECTORS = require('./selectors');

/**
 * Login as a specific user role.
 * @param {import('@playwright/test').Page} page - The Playwright page object
 * @param {'pegawai' | 'pimpinan'} role - The role to login as
 */
async function login(page, role = 'pegawai') {
  const user = TEST_USERS[role];
  if (!user) {
    throw new Error(`Unknown role: ${role}. Use 'pegawai' or 'pimpinan'.`);
  }

  await page.goto(URLS.login);
  await page.waitForSelector(SELECTORS.login.form);
  
  await page.fill(SELECTORS.login.usernameInput, user.username);
  await page.fill(SELECTORS.login.passwordInput, user.password);
  await page.click(SELECTORS.login.submitButton);
  
  // Wait for redirect to dashboard (allow up to 30s for slow DB connections at cold start)
  await page.waitForURL(`**${user.expectedDashboardURL}`, { timeout: 30000 });
}

/**
 * Logout the current user.
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
async function logout(page) {
  await page.goto(URLS.logout);
  // After logout, the user should be redirected to the login page
  await page.waitForURL(`**${URLS.login}`, { timeout: 10000 });
}

/**
 * Login with custom credentials (for testing invalid login).
 * @param {import('@playwright/test').Page} page 
 * @param {string} username 
 * @param {string} password 
 */
async function loginWithCredentials(page, username, password) {
  await page.goto(URLS.login);
  await page.waitForSelector(SELECTORS.login.form);
  
  await page.fill(SELECTORS.login.usernameInput, username);
  await page.fill(SELECTORS.login.passwordInput, password);
  await page.click(SELECTORS.login.submitButton);
}

module.exports = {
  login,
  logout,
  loginWithCredentials,
};
