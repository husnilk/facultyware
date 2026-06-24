// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Pimpinan Dashboard Tests
 * 
 * Verifies that the pimpinan dashboard loads correctly,
 * statistics cards are visible, and pending approvals table works.
 */
test.describe('Pimpinan Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'pimpinan');
  });

  test('should load the pimpinan dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/pimpinan\/dashboard/);
    
    // No server error
    const content = await page.content();
    expect(content).not.toContain('Error');
  });

  test('should display statistics cards', async ({ page }) => {
    const cards = page.locator(SELECTORS.pimpinanDashboard.statsCards);
    await expect(cards.first()).toBeVisible();
    
    // Check specific stat cards
    await expect(page.locator(SELECTORS.pimpinanDashboard.totalPerjalanan)).toBeVisible();
    await expect(page.locator(SELECTORS.pimpinanDashboard.pendingApproval)).toBeVisible();
    await expect(page.locator(SELECTORS.pimpinanDashboard.laporanSelesai)).toBeVisible();
    await expect(page.locator(SELECTORS.pimpinanDashboard.klaimReimburse)).toBeVisible();
  });

  test('should display pending approvals table', async ({ page }) => {
    const table = page.locator(SELECTORS.pimpinanDashboard.pendingTable);
    await expect(table.first()).toBeVisible();
  });

  test('should display "Statistik Perjalanan Dinas" section', async ({ page }) => {
    await expect(page.locator(SELECTORS.pimpinanDashboard.statistikSection)).toBeVisible();
  });

  test('should have "Lihat Semua" link to travels list', async ({ page }) => {
    const link = page.locator('a:has-text("Lihat Semua")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/pimpinan/travels');
  });

  test('should navigate to travels list when clicking "Lihat Semua"', async ({ page }) => {
    await page.click('a:has-text("Lihat Semua")');
    await expect(page).toHaveURL(/\/pimpinan\/travels/);
  });
});
