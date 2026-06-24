// @ts-check
const { test, expect } = require('@playwright/test');
const { URLS } = require('../helpers/test-data');

/**
 * Smoke Tests for FacultyWare
 * 
 * Quick health-check tests to verify the application is running
 * and core pages load without critical errors.
 */
test.describe('Smoke Tests', () => {

  test('should load the root page and redirect to login', async ({ page }) => {
    const response = await page.goto(URLS.root);
    
    // Should redirect to login (status may be 200 after redirect, or 302 during)
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(500);
    
    // After redirect, URL should contain /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should load the login page successfully', async ({ page }) => {
    const response = await page.goto(URLS.login);
    
    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);
    
    // Login form should be present
    await expect(page.locator('form[action="/login"]')).toBeVisible();
    
    // Title should exist
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should load the stylesheet (CSS) without errors', async ({ page }) => {
    const response = await page.goto(URLS.stylesCSS);
    
    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('css');
  });

  test('should not return 500 error on login page', async ({ page }) => {
    const response = await page.goto(URLS.login);
    
    expect(response).not.toBeNull();
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(502);
    expect(response.status()).not.toBe(503);
  });

  test('should render login page with required form elements', async ({ page }) => {
    await page.goto(URLS.login);
    
    // Username input exists
    await expect(page.locator('#username')).toBeVisible();
    
    // Password input exists
    await expect(page.locator('#password')).toBeVisible();
    
    // Submit button exists
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should return 302 or redirect for unauthenticated dashboard access', async ({ page }) => {
    // Attempting to visit pegawai dashboard without login should redirect to login
    const response = await page.goto(URLS.pegawaiDashboard);
    
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(500);
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should return 302 or redirect for unauthenticated pimpinan access', async ({ page }) => {
    const response = await page.goto(URLS.pimpinanDashboard);
    
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(500);
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
