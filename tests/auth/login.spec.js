// @ts-check
const { test, expect } = require('@playwright/test');
const { login, logout, loginWithCredentials } = require('../helpers/auth');
const { TEST_USERS, URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Authentication Tests for FacultyWare
 * 
 * Tests login page accessibility, invalid login rejection,
 * valid login for both roles, and logout functionality.
 */
test.describe('Authentication', () => {

  test.describe('Login Page', () => {

    test('should display the login page correctly', async ({ page }) => {
      await page.goto(URLS.login);
      
      // The heading should say "Welcome back"
      await expect(page.locator(SELECTORS.login.heading)).toContainText('Welcome back');
      
      // Form elements should be visible
      await expect(page.locator(SELECTORS.login.usernameInput)).toBeVisible();
      await expect(page.locator(SELECTORS.login.passwordInput)).toBeVisible();
      await expect(page.locator(SELECTORS.login.submitButton)).toBeVisible();
    });

    test('should have required attributes on input fields', async ({ page }) => {
      await page.goto(URLS.login);
      
      // Username input should be required
      await expect(page.locator(SELECTORS.login.usernameInput)).toHaveAttribute('required', '');
      
      // Password input should be required
      await expect(page.locator(SELECTORS.login.passwordInput)).toHaveAttribute('required', '');
    });
  });

  test.describe('Invalid Login', () => {

    test('should reject invalid credentials and show error message', async ({ page }) => {
      await loginWithCredentials(
        page,
        TEST_USERS.invalid.username,
        TEST_USERS.invalid.password
      );
      
      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
      
      // Error message should be visible
      await expect(page.locator(SELECTORS.login.errorMessage)).toBeVisible();
      await expect(page.locator(SELECTORS.login.errorMessage)).toContainText('salah');
    });

    test('should reject empty username submission via HTML validation', async ({ page }) => {
      await page.goto(URLS.login);
      
      // Only fill password, leave username empty
      await page.fill(SELECTORS.login.passwordInput, 'somepassword');
      await page.click(SELECTORS.login.submitButton);
      
      // Should stay on login page (HTML5 validation prevents submission)
      await expect(page).toHaveURL(/\/login/);
    });

    test('should reject empty password submission via HTML validation', async ({ page }) => {
      await page.goto(URLS.login);
      
      // Only fill username, leave password empty
      await page.fill(SELECTORS.login.usernameInput, 'someuser');
      await page.click(SELECTORS.login.submitButton);
      
      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Valid Login - Pegawai', () => {

    test('should login as pegawai and redirect to pegawai dashboard', async ({ page }) => {
      await login(page, 'pegawai');
      
      // Should be on pegawai dashboard
      await expect(page).toHaveURL(/\/pegawai\/dashboard/);
      
      // Dashboard content should be visible
      await expect(page.locator(SELECTORS.pegawaiDashboard.totalPermohonan)).toBeVisible();
    });
  });

  test.describe('Valid Login - Pimpinan', () => {

    test('should login as pimpinan and redirect to pimpinan dashboard', async ({ page }) => {
      await login(page, 'pimpinan');
      
      // Should be on pimpinan dashboard
      await expect(page).toHaveURL(/\/pimpinan\/dashboard/);
      
      // Dashboard content should be visible
      await expect(page.locator(SELECTORS.pimpinanDashboard.totalPerjalanan)).toBeVisible();
    });
  });

  test.describe('Logout', () => {

    test('should logout pegawai and redirect to login page', async ({ page }) => {
      // First login
      await login(page, 'pegawai');
      await expect(page).toHaveURL(/\/pegawai\/dashboard/);
      
      // Then logout
      await logout(page);
      
      // Should be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should logout pimpinan and redirect to login page', async ({ page }) => {
      // First login
      await login(page, 'pimpinan');
      await expect(page).toHaveURL(/\/pimpinan\/dashboard/);
      
      // Then logout
      await logout(page);
      
      // Should be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should not be able to access dashboard after logout', async ({ page }) => {
      // Login
      await login(page, 'pegawai');
      
      // Logout
      await logout(page);
      
      // Try to access dashboard
      await page.goto(URLS.pegawaiDashboard);
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
