// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');

/**
 * API Endpoint Tests for FacultyWare
 * 
 * Verifies that authenticated API endpoints return:
 * - HTTP 200
 * - JSON format with { success: true, data: [...] }
 * 
 * All API endpoints require authentication.
 */
test.describe('API Endpoints', () => {

  test.describe('Pegawai API Endpoints', () => {

    test.beforeEach(async ({ page }) => {
      await login(page, 'pegawai');
    });

    test('GET /api/my-travel should return 200 with JSON', async ({ page }) => {
      const response = await page.goto(URLS.apiMyTravel);
      
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('json');
      
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('GET /api/my-expenses should return 200 with JSON', async ({ page }) => {
      const response = await page.goto(URLS.apiMyExpenses);
      
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('json');
      
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('GET /api/my-documents should return 200 with JSON', async ({ page }) => {
      const response = await page.goto(URLS.apiMyDocuments);
      
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('json');
      
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    });
  });

  test.describe('Pimpinan / General API Endpoints', () => {

    test.beforeEach(async ({ page }) => {
      await login(page, 'pimpinan');
    });

    test('GET /api/travel should return 200 with JSON', async ({ page }) => {
      const response = await page.goto(URLS.apiTravel);
      
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('json');
      
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('GET /api/expenses should return 200 with JSON', async ({ page }) => {
      const response = await page.goto(URLS.apiExpenses);
      
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('json');
      
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('GET /api/reports should return 200 with JSON', async ({ page }) => {
      const response = await page.goto(URLS.apiReports);
      
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('json');
      
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    });
  });

  test.describe('Unauthenticated API Access', () => {

    test('GET /api/my-travel should redirect when not authenticated', async ({ page }) => {
      // Don't login — make unauthenticated request
      const response = await page.goto(URLS.apiMyTravel);
      
      expect(response).not.toBeNull();
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('GET /api/travel should redirect when not authenticated', async ({ page }) => {
      const response = await page.goto(URLS.apiTravel);
      
      expect(response).not.toBeNull();
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
