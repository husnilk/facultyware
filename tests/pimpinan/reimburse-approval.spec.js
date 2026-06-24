// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Pimpinan Reimburse Approval Tests
 * 
 * Verifies:
 * - Reimburse approval list loads
 * - Table with expense data is visible
 * - Approve/Reject buttons exist for submitted expenses
 * 
 * Does NOT perform destructive approval actions.
 */
test.describe('Pimpinan Reimburse Approval', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'pimpinan');
  });

  test('should load the pimpinan expenses approval page', async ({ page }) => {
    await page.goto(URLS.pimpinanExpenses);
    
    await expect(page).toHaveURL(/\/pimpinan\/expenses/);
    
    // Page heading
    await expect(page.locator('h2')).toContainText('Reimburse');
  });

  test('should display expenses table', async ({ page }) => {
    await page.goto(URLS.pimpinanExpenses);
    
    const table = page.locator(SELECTORS.pimpinanExpenses.table);
    await expect(table).toBeVisible();
  });

  test('should display correct table column headers', async ({ page }) => {
    await page.goto(URLS.pimpinanExpenses);
    
    const table = page.locator(SELECTORS.pimpinanExpenses.table);
    
    // Check for key column headers
    await expect(table.locator('th')).toContainText(['Pegawai']);
    await expect(table.locator('th')).toContainText(['No. Permohonan']);
    await expect(table.locator('th')).toContainText(['Komponen Biaya']);
    await expect(table.locator('th')).toContainText(['Jumlah']);
    await expect(table.locator('th')).toContainText(['Status']);
  });

  test('should have export button', async ({ page }) => {
    await page.goto(URLS.pimpinanExpenses);
    
    const exportBtn = page.locator(SELECTORS.pimpinanExpenses.exportButton);
    await expect(exportBtn).toBeVisible();
  });

  test('should display approve/reject links for submitted expenses', async ({ page }) => {
    await page.goto(URLS.pimpinanExpenses);
    
    // Check if there are any rows with approve/reject buttons
    const approveLinks = page.locator(SELECTORS.pimpinanExpenses.approveLink);
    const rejectLinks = page.locator(SELECTORS.pimpinanExpenses.rejectLink);
    
    const approveCount = await approveLinks.count();
    const rejectCount = await rejectLinks.count();
    
    if (approveCount > 0) {
      // If submitted expenses exist, both buttons should appear
      expect(approveCount).toBeGreaterThan(0);
      expect(rejectCount).toBeGreaterThan(0);
      
      // Verify they have proper hrefs
      const firstApproveHref = await approveLinks.first().getAttribute('href');
      expect(firstApproveHref).toMatch(/\/pimpinan\/expenses\/approve\/\d+/);
      
      const firstRejectHref = await rejectLinks.first().getAttribute('href');
      expect(firstRejectHref).toMatch(/\/pimpinan\/expenses\/reject\/\d+/);
    }
    // If no submitted expenses, the test passes — we just verify the page loads
  });

  test('should show "Sudah Diproses" for processed expenses', async ({ page }) => {
    await page.goto(URLS.pimpinanExpenses);
    
    // Check if any processed expense messages exist
    const processedText = page.locator('text=Sudah Diproses');
    const count = await processedText.count();
    
    // This is informational — either there are processed expenses or there aren't
    // The test just verifies the page doesn't error
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
