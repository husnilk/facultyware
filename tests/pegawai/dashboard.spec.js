// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Pegawai Dashboard Tests
 * 
 * Verifies that the pegawai dashboard loads correctly,
 * statistics cards are visible, and navigation links work.
 */
test.describe('Pegawai Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'pegawai');
  });

  test('should load the pegawai dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/pegawai\/dashboard/);
    
    // Page should have rendered without errors
    const content = await page.content();
    expect(content).not.toContain('Error');
  });

  test('should display statistics cards', async ({ page }) => {
    // At least 4 stat cards should be visible
    const cards = page.locator(SELECTORS.pegawaiDashboard.statsCards);
    await expect(cards.first()).toBeVisible();
    
    // Check specific stat cards
    await expect(page.locator(SELECTORS.pegawaiDashboard.totalPermohonan)).toBeVisible();
    await expect(page.locator(SELECTORS.pegawaiDashboard.disetujui)).toBeVisible();
    await expect(page.locator(SELECTORS.pegawaiDashboard.menungguApproval)).toBeVisible();
    await expect(page.locator(SELECTORS.pegawaiDashboard.totalReimburse)).toBeVisible();
  });

  test('should display recent travels table', async ({ page }) => {
    // The table or empty state message should be present
    const table = page.locator(SELECTORS.pegawaiDashboard.recentTravelsTable);
    await expect(table.first()).toBeVisible();
  });

  test('should display status statistics section', async ({ page }) => {
    await expect(page.locator(SELECTORS.pegawaiDashboard.statistikStatus)).toBeVisible();
  });

  test('should have "Lihat Semua" link to travels list', async ({ page }) => {
    const lihatSemua = page.locator(SELECTORS.pegawaiDashboard.lihatSemua);
    await expect(lihatSemua).toBeVisible();
    await expect(lihatSemua).toHaveAttribute('href', '/pegawai/travels');
  });

  test('should navigate to travels list when clicking "Lihat Semua"', async ({ page }) => {
    await page.click(SELECTORS.pegawaiDashboard.lihatSemua);
    await expect(page).toHaveURL(/\/pegawai\/travels/);
  });
});
